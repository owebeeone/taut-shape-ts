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
    if (entry.origin.length === 0 || entry.seq <= 0n || (previous !== null && entry.origin <= previous)) return null;
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
    if (left[index]! !== right[index]!) return left[index]! - right[index]!;
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

/** Payload-agnostic immediate anti-entropy engine (`crdt.oracle/v1`). */
export class CrdtNode {
  readonly maxPending: number;
  private readonly clockState = new Map<string, bigint>();
  private readonly floor = new Map<string, bigint>();
  private bootstrapState: CrdtBootstrap | null = null;
  private readonly ops = new Map<string, CrdtOp>();
  private readonly integrated = new Set<string>();
  private readonly equivocated = new Set<string>();
  private sealed = false;
  private closed = false;
  private error: CrdtClose["error"] = null;

  constructor(options: CrdtNodeOptions = {}) {
    this.maxPending = options.maxPending ?? 1024;
    if (!Number.isSafeInteger(this.maxPending) || this.maxPending < 0) throw new RangeError("maxPending must be a non-negative safe integer");
  }

  get clock(): CrdtClock { return clockValue(this.clockState); }
  get bootstrap(): CrdtBootstrap | null { return this.bootstrapState === null ? null : cloneBootstrap(this.bootstrapState); }
  get operations(): readonly CrdtOp[] { return [...this.integrated].map((id) => this.ops.get(id)!).sort(compareOps).map(cloneOp); }
  get equivocations(): readonly CrdtOp[] { return [...this.equivocated].map((id) => this.ops.get(id)!).sort(compareOps).map(cloneOp); }

  handle(input: CrdtInput): readonly CrdtOutput[] {
    switch (input.type) {
      case "apply": return this.apply(input.op);
      case "install_bootstrap": return this.installBootstrap(input.bootstrap);
      case "seal": if (!this.closed) this.sealed = true; return [];
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
    if (this.sealed || this.closed) return [this.diagnostic("apply_after_terminal", op)];
    if (!this.valid(op)) return [this.diagnostic("invalid_operation", op)];
    const id = key(op);
    if (op.seq <= (this.floor.get(op.origin) ?? 0n)) return [];
    const prior = this.ops.get(id);
    if (prior !== undefined) {
      if (opEqual(prior, op)) return [];
      const outputs: CrdtOutput[] = [];
      if (!this.equivocated.has(id)) { this.equivocated.add(id); outputs.push(this.diagnostic("equivocation", op)); }
      if (variantCompare(op, prior) < 0) this.ops.set(id, cloneOp(op));
      this.drain();
      return outputs;
    }
    if (!this.ready(op) && this.ops.size - this.integrated.size >= this.maxPending) return [this.diagnostic("pending_bound_exceeded", op)];
    this.ops.set(id, cloneOp(op));
    this.drain();
    return [];
  }

  private ready(op: CrdtOp): boolean {
    if (op.seq > (this.clockState.get(op.origin) ?? 0n) + 1n) return false;
    const deps = clockMap(op.deps)!;
    return [...deps].every(([origin, seq]) => (this.clockState.get(origin) ?? 0n) >= seq);
  }

  private drain(): void {
    for (;;) {
      const ready = [...this.ops.entries()].filter(([id, op]) => !this.integrated.has(id) && this.ready(op)).sort((a, b) => compareOps(a[1], b[1]));
      if (ready.length === 0) return;
      for (const [id, op] of ready) {
        this.integrated.add(id);
        const current = this.clockState.get(op.origin) ?? 0n;
        if (op.seq > current) this.clockState.set(op.origin, op.seq);
      }
    }
  }

  private installBootstrap(bootstrap: CrdtBootstrap): readonly CrdtOutput[] {
    if (this.sealed || this.closed) return [this.diagnostic("apply_after_terminal")];
    const parsed = clockMap(bootstrap.clock);
    if (parsed === null) return [this.diagnostic("invalid_operation")];
    if (this.bootstrapState !== null && JSON.stringify(this.bootstrapState.clock.entries.map((e) => [e.origin, e.seq.toString()])) === JSON.stringify(bootstrap.clock.entries.map((e) => [e.origin, e.seq.toString()])) && bytesEqual(this.bootstrapState.state, bootstrap.state)) return [];
    if (this.bootstrapState !== null || this.ops.size > 0) return [this.diagnostic("bootstrap_conflict")];
    this.bootstrapState = cloneBootstrap(bootstrap);
    for (const [origin, seq] of parsed) { this.floor.set(origin, seq); this.clockState.set(origin, seq); }
    return [];
  }

  private read(request: { readonly type: "read" } & CrdtReadRequest): CrdtOutput {
    const cursor = request.cursor === null ? new Map<string, bigint>() : clockMap(request.cursor);
    if (cursor === null || [...cursor].some(([origin, seq]) => seq > (this.clockState.get(origin) ?? 0n))) return this.response(request, "invalid_cursor");
    const belowFloor = [...this.floor].some(([origin, seq]) => (cursor.get(origin) ?? 0n) < seq);
    const bootstrap = request.cursor !== null && belowFloor ? this.bootstrapState : request.cursor === null ? this.bootstrapState : null;
    const base = request.cursor !== null && belowFloor ? this.floor : cursor;
    const ops = this.operations.filter((op) => op.seq > (base.get(op.origin) ?? 0n));
    if (bootstrap !== null || ops.length > 0) return this.response(request, request.cursor !== null && belowFloor ? "bootstrap_required" : "data", bootstrap, ops);
    if (this.closed) return this.response(request, this.error === null ? "closed" : "failed", null, [], this.error);
    if (this.sealed) return this.response(request, "eof");
    return this.response(request, "empty");
  }

  private response(request: CrdtReadRequest, state: CrdtReadResponse["state"], bootstrap: CrdtBootstrap | null = null, ops: readonly CrdtOp[] = [], error: CrdtReadResponse["error"] = null): CrdtOutput {
    return { type: "read_response", crdt_id: request.crdt_id, stream_id: request.stream_id, bootstrap: bootstrap === null ? null : cloneBootstrap(bootstrap), ops: ops.map(cloneOp), next_cursor: this.clock, state, error };
  }
}
