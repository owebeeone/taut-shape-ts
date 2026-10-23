import type {
  CrdtApply, CrdtBootstrap, CrdtClock, CrdtClose, CrdtDiagnostic, CrdtDiagCode,
  CrdtInstallBootstrap, CrdtOp, CrdtReadRequest, CrdtReadResponse, CrdtSeal,
} from "../taut/gen/shape_crdt.ts";

export type CrdtInput =
  | ({ readonly type: "apply" } & CrdtApply)
  | ({ readonly type: "install_bootstrap" } & CrdtInstallBootstrap)
  | ({ readonly type: "seal" } & CrdtSeal)
  | ({ readonly type: "close" } & CrdtClose)
  | ({ readonly type: "read" } & CrdtReadRequest);
export type CrdtOutput =
  | ({ readonly type: "read_response" } & CrdtReadResponse)
  | ({ readonly type: "diagnostic" } & CrdtDiagnostic);

function clockMap(clock: CrdtClock): Map<string, bigint> | null {
  const result = new Map<string, bigint>();
  let previous: string | null = null;
  for (const entry of clock.entries) {
    if (entry.origin.length === 0 || entry.seq <= 0n || (previous !== null && entry.origin <= previous)) { return null; }
    previous = entry.origin;
    result.set(entry.origin, entry.seq);
  }
  return result;
}

function clockValue(clock: ReadonlyMap<string, bigint>): CrdtClock {
  return { entries: [...clock].filter(([, seq]) => seq > 0n).sort(([a], [b]) => a.localeCompare(b)).map(([origin, seq]) => ({ origin, seq })) };
}

function key(op: CrdtOp): string { return JSON.stringify([op.origin, op.seq.toString()]); }
function compareOps(left: CrdtOp, right: CrdtOp): number {
  const origin = left.origin.localeCompare(right.origin);
  return origin !== 0 ? origin : left.seq < right.seq ? -1 : left.seq > right.seq ? 1 : 0;
}
function bytesCompare(left: Uint8Array, right: Uint8Array): number {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    if (left[index]! !== right[index]!) { return left[index]! - right[index]!; }
  }
  return left.length - right.length;
}
function bytesEqual(left: Uint8Array, right: Uint8Array): boolean { return bytesCompare(left, right) === 0; }
function cloneClock(value: CrdtClock): CrdtClock { return { entries: value.entries.map((entry) => ({ ...entry })) }; }
function cloneOp(value: CrdtOp): CrdtOp { return { ...value, deps: cloneClock(value.deps), payload: value.payload.slice() }; }
function cloneBootstrap(value: CrdtBootstrap): CrdtBootstrap { return { clock: cloneClock(value.clock), state: value.state.slice() }; }
function opEqual(left: CrdtOp, right: CrdtOp): boolean {
  return left.origin === right.origin && left.seq === right.seq
    && JSON.stringify(left.deps.entries.map((e) => [e.origin, e.seq.toString()])) === JSON.stringify(right.deps.entries.map((e) => [e.origin, e.seq.toString()]))
    && bytesEqual(left.payload, right.payload);
}
function variantCompare(left: CrdtOp, right: CrdtOp): number {
  const leftDeps = JSON.stringify(left.deps.entries.map((e) => [e.origin, e.seq.toString()]));
  const rightDeps = JSON.stringify(right.deps.entries.map((e) => [e.origin, e.seq.toString()]));
  const deps = leftDeps.localeCompare(rightDeps);
  return deps === 0 ? bytesCompare(left.payload, right.payload) : deps;
}

export interface CrdtNodeOptions { readonly maxPending?: number; }

/** Local, structured-clone checkpoint; not a new wire bootstrap format. */
export interface CrdtCheckpoint {
  readonly version: 1;
  readonly maxPending: number;
  readonly clock: CrdtClock;
  readonly floor: CrdtClock;
  readonly bootstrap: CrdtBootstrap | null;
  readonly operations: readonly CrdtOp[];
  readonly integrated: readonly string[];
  readonly equivocated: readonly string[];
  readonly sealed: boolean;
  readonly closed: boolean;
  readonly error: CrdtClose["error"];
}

/** Payload-agnostic immediate anti-entropy engine (`crdt.oracle/v1`). */
export class CrdtNode {
  readonly maxPending: number;
  private readonly clockState = new Map<string, bigint>();
  private readonly floor = new Map<string, bigint>();
  private bootstrapState: CrdtBootstrap | null = null;
  private readonly ops = new Map<string, CrdtOp>();
  private readonly integrated = new Set<string>();
  private readonly byOrigin = new Map<string, Map<bigint, CrdtOp>>();
  private readonly pending = new Set<string>();
  private readonly changes: CrdtOp[] = [];
  private resetAt = 0;
  private revisionValue = 0;
  private readonly counters = { pendingVisits: 0, textDecodes: 0, readVisits: 0 };

  /** Deterministic work evidence, independent of machine speed. */
  get work() { return { ...this.counters }; }
  recordTextDecode(): void { this.counters.textDecodes++; }
  get revision(): number { return this.revisionValue; }
  /** A projection may consume new integrated operations; replacements require reset. */
  changesSince(revision: number): { reset: boolean; operations: readonly CrdtOp[] } {
    if (revision < this.resetAt) { return { reset: true, operations: this.operations }; }
    return { reset: false, operations: this.changes.slice(revision - this.resetAt).map(cloneOp) };
  }
  private resetProjection(): void {
    this.revisionValue++;
    this.resetAt = this.revisionValue;
    this.changes.length = 0;
  }
  private readonly equivocated = new Set<string>();
  private sealed = false;
  private closed = false;
  private error: CrdtClose["error"] = null;

  constructor(options: CrdtNodeOptions = {}) {
    this.maxPending = options.maxPending ?? 1024;
    if (!Number.isSafeInteger(this.maxPending) || this.maxPending < 0) { throw new RangeError("maxPending must be a non-negative safe integer"); }
  }

  checkpoint(): CrdtCheckpoint {
    return {
      version: 1, maxPending: this.maxPending, clock: this.clock,
      floor: clockValue(this.floor), bootstrap: this.bootstrap,
      operations: [...this.ops.values()].map(cloneOp), integrated: [...this.integrated],
      equivocated: [...this.equivocated], sealed: this.sealed, closed: this.closed, error: this.error,
    };
  }

  static restore(saved: CrdtCheckpoint): CrdtNode {
    if (saved.version !== 1) { throw new Error("unsupported CRDT checkpoint version"); }
    const node = new CrdtNode({ maxPending: saved.maxPending });
    const clock = clockMap(saved.clock), floor = clockMap(saved.floor);
    if (!clock || !floor) { throw new Error("invalid CRDT checkpoint clock"); }
    for (const [origin, seq] of floor) {
      if (seq > (clock.get(origin) ?? 0n)) { throw new Error("checkpoint floor exceeds clock"); }
      node.floor.set(origin, seq);
    }
    for (const op of saved.operations) {
      if (!node.valid(op) || !(op.payload instanceof Uint8Array) || node.ops.has(key(op))) {
        throw new Error("invalid CRDT checkpoint operation");
      }
      node.ops.set(key(op), cloneOp(op));
      node.pending.add(key(op));
    }
    for (const id of saved.integrated) {
      const op = node.ops.get(id);
      if (!op || op.seq > (clock.get(op.origin) ?? 0n)) { throw new Error("invalid integrated checkpoint operation"); }
      node.integrated.add(id);
      node.index(op);
      node.pending.delete(id);
    }
    for (const [origin, seq] of clock) { node.clockState.set(origin, seq); }
    for (const id of saved.equivocated) {
      if (!node.ops.has(id)) { throw new Error("invalid checkpoint equivocation"); }
      node.equivocated.add(id);
    }
    node.bootstrapState = saved.bootstrap === null ? null : cloneBootstrap(saved.bootstrap);
    node.sealed = saved.sealed; node.closed = saved.closed; node.error = saved.error;
    // A new projection must read the restored integrated set once; consumers
    // with a matching text checkpoint can install that without decoding history.
    node.resetProjection();
    return node;
  }

  get clock(): CrdtClock { return clockValue(this.clockState); }
  get bootstrap(): CrdtBootstrap | null { return this.bootstrapState === null ? null : cloneBootstrap(this.bootstrapState); }
  get operations(): readonly CrdtOp[] { return [...this.integrated].map((id) => this.ops.get(id)!).sort(compareOps).map(cloneOp); }
  get equivocations(): readonly CrdtOp[] { return [...this.equivocated].map((id) => this.ops.get(id)!).sort(compareOps).map(cloneOp); }

  handle(input: CrdtInput): readonly CrdtOutput[] {
    switch (input.type) {
      case "apply": return this.apply(input.op);
      case "install_bootstrap": return this.installBootstrap(input.bootstrap);
      case "seal": if (!this.closed) { this.sealed = true; } return [];
      case "close": if (!this.closed) { this.closed = true; this.error = input.error; } return [];
      case "read": return [this.read(input)];
    }
  }

  private diagnostic(code: CrdtDiagCode, op?: CrdtOp): CrdtOutput {
    return { type: "diagnostic", severity: code === "apply_after_terminal" ? "warn" : "error", code, origin: op?.origin ?? null, seq: op?.seq ?? null };
  }

  private valid(op: CrdtOp): boolean {
    const deps = clockMap(op.deps);
    return op.origin.length > 0 && op.seq > 0n && deps !== null && (deps.get(op.origin) ?? 0n) < op.seq;
  }

  private apply(op: CrdtOp): readonly CrdtOutput[] {
    if (this.sealed || this.closed) { return [this.diagnostic("apply_after_terminal", op)]; }
    if (!this.valid(op)) { return [this.diagnostic("invalid_operation", op)]; }
    const id = key(op);
    if (op.seq <= (this.floor.get(op.origin) ?? 0n)) { return []; }
    const prior = this.ops.get(id);
    if (prior !== undefined) {
      if (opEqual(prior, op)) { return []; }
      const outputs: CrdtOutput[] = [];
      if (!this.equivocated.has(id)) { this.equivocated.add(id); outputs.push(this.diagnostic("equivocation", op)); }
      if (variantCompare(op, prior) < 0) {
        this.ops.set(id, cloneOp(op));
        if (this.integrated.has(id)) { this.index(this.ops.get(id)!); this.resetProjection(); }
      }
      this.drain();
      return outputs;
    }
    if (!this.ready(op) && this.ops.size - this.integrated.size >= this.maxPending) { return [this.diagnostic("pending_bound_exceeded", op)]; }
    this.ops.set(id, cloneOp(op));
    this.pending.add(id);
    this.drain();
    return [];
  }

  private ready(op: CrdtOp): boolean {
    if (op.seq > (this.clockState.get(op.origin) ?? 0n) + 1n) { return false; }
    const deps = clockMap(op.deps)!;
    return [...deps].every(([origin, seq]) => (this.clockState.get(origin) ?? 0n) >= seq);
  }

  private index(op: CrdtOp): void {
    let chain = this.byOrigin.get(op.origin);
    if (!chain) { chain = new Map(); this.byOrigin.set(op.origin, chain); }
    chain.set(op.seq, op);
  }

  private drain(): void {
    for (;;) {
      const ready = [...this.pending].map(id => [id, this.ops.get(id)!] as const).filter(([, op]) => {
        this.counters.pendingVisits++;
        return this.ready(op);
      }).sort((a, b) => compareOps(a[1], b[1]));
      if (ready.length === 0) { return; }
      for (const [id, op] of ready) {
        this.integrated.add(id);
        this.index(op);
        this.pending.delete(id);
        this.changes.push(op);
        this.revisionValue++;
        const current = this.clockState.get(op.origin) ?? 0n;
        if (op.seq > current) { this.clockState.set(op.origin, op.seq); }
      }
    }
  }

  private installBootstrap(bootstrap: CrdtBootstrap): readonly CrdtOutput[] {
    if (this.sealed || this.closed) { return [this.diagnostic("apply_after_terminal")]; }
    const parsed = clockMap(bootstrap.clock);
    if (parsed === null) { return [this.diagnostic("invalid_operation")]; }
    if (this.bootstrapState !== null && JSON.stringify(this.bootstrapState.clock.entries.map((e) => [e.origin, e.seq.toString()])) === JSON.stringify(bootstrap.clock.entries.map((e) => [e.origin, e.seq.toString()])) && bytesEqual(this.bootstrapState.state, bootstrap.state)) { return []; }
    if (this.bootstrapState !== null || this.ops.size > 0) { return [this.diagnostic("bootstrap_conflict")]; }
    this.bootstrapState = cloneBootstrap(bootstrap);
    this.resetProjection();
    for (const [origin, seq] of parsed) { this.floor.set(origin, seq); this.clockState.set(origin, seq); }
    return [];
  }

  private read(request: { readonly type: "read" } & CrdtReadRequest): CrdtOutput {
    const cursor = request.cursor === null ? new Map<string, bigint>() : clockMap(request.cursor);
    if (cursor === null || [...cursor].some(([origin, seq]) => seq > (this.clockState.get(origin) ?? 0n))) { return this.response(request, "invalid_cursor"); }
    const belowFloor = [...this.floor].some(([origin, seq]) => (cursor.get(origin) ?? 0n) < seq);
    const bootstrap = request.cursor !== null && belowFloor ? this.bootstrapState : request.cursor === null ? this.bootstrapState : null;
    const base = request.cursor !== null && belowFloor ? this.floor : cursor;
    const ops: CrdtOp[] = [];
    for (const origin of [...this.byOrigin.keys()].sort((a, b) => a.localeCompare(b))) {
      const chain = this.byOrigin.get(origin)!;
      const retainedFloor = this.floor.get(origin) ?? 0n;
      const requested = base.get(origin) ?? 0n;
      const first = (requested > retainedFloor ? requested : retainedFloor) + 1n;
      const last = this.clockState.get(origin) ?? 0n;
      for (let seq = first; seq <= last; seq++) {
        this.counters.readVisits++;
        const op = chain.get(seq);
        if (op) { ops.push(op); }
      }
    }
    if (bootstrap !== null || ops.length > 0) { return this.response(request, request.cursor !== null && belowFloor ? "bootstrap_required" : "data", bootstrap, ops); }
    if (this.closed) { return this.response(request, this.error === null ? "closed" : "failed", null, [], this.error); }
    if (this.sealed) { return this.response(request, "eof"); }
    return this.response(request, "empty");
  }

  private response(request: CrdtReadRequest, state: CrdtReadResponse["state"], bootstrap: CrdtBootstrap | null = null, ops: readonly CrdtOp[] = [], error: CrdtReadResponse["error"] = null): CrdtOutput {
    return { type: "read_response", crdt_id: request.crdt_id, stream_id: request.stream_id, bootstrap: bootstrap === null ? null : cloneBootstrap(bootstrap), ops: ops.map(cloneOp), next_cursor: this.clock, state, error };
  }
}
