// The engine: `LogNode` — the pure mailbox endpoint (§4.4, D1). No I/O, no clock,
// no locks, no callbacks. Held long-polls are ENGINE STATE: a tail Read that
// cannot be answered is parked in the session table and answered when a later
// input (push/seal/close/timer_expired/end_stream) releases it. Outputs are a
// deterministic function of the input history (D16). Unsynchronized by design —
// the shell owns serialization (D15). Mirrors taut-shape-rs node.rs.

import type { Cursor, LogError, LogInput, LogOutput, LogResponse } from "./messages.ts";
import { START } from "./messages.ts";
import { Table } from "./session.ts";
import type { HeldRead } from "./session.ts";
import { Window } from "./window.ts";
import type { Limits, Lifecycle } from "./window.ts";
import type { LogState } from "./taut/gen/shape_log.ts";

/** ProducerStop policy (D6). A log never read must not spuriously stop its
 *  producer, so the ≥1→0 reader transition is what fires under "last_reader". */
export type StopWhen = "last_reader" | "explicit_only";

export interface LogNodeOptions {
  /** Default pinned by the oracle. The Rust reference default is explicit_only;
   *  the oracle scripts pass stop_when explicitly, so tests never rely on it. */
  readonly stopWhen?: StopWhen;
}

/** The outcome of classifying a cursor (shared §3.4). */
type Resolution =
  | { readonly r: "data" }
  | { readonly r: "terminal"; readonly state: LogState; readonly error?: LogError }
  | { readonly r: "expired"; readonly nextCursor: Cursor }
  | { readonly r: "caught_up_live" };

/** Pure mailbox endpoint (D1): no I/O, no clock, no callbacks, no locks.
 *  Outputs are a deterministic function of the input history (D16). */
export class LogNode {
  private readonly window = new Window();
  private readonly sessions = new Table();
  private readonly stopWhen: StopWhen;
  /** Monotonic timer-token allocator, from 1 (D16). */
  private nextTimer = 0;

  constructor(opts?: LogNodeOptions) {
    this.stopWhen = opts?.stopWhen ?? "explicit_only";
  }

  /** The whole API. Total — never throws on protocol-level misuse: protocol
   *  outcomes are messages. Feed one input; collect zero or more outputs.
   *  Synchronous. When one input releases several held reads, responses are
   *  emitted in stream-creation order (D16). */
  handle(input: LogInput): LogOutput[] {
    switch (input.type) {
      case "push":
        return this.onPush(input.payload);
      case "seal":
        return this.onSeal();
      case "close":
        return this.onClose(input.error);
      case "read":
        return this.onRead(
          input.streamId,
          input.cursor,
          { maxRecords: input.maxRecords, maxBytes: input.maxBytes },
          input.timeoutMs,
        );
      case "end_stream":
        return this.onEndStream(input.streamId);
      case "timer_expired":
        return this.onTimerExpired(input.token);
      case "evict":
        return this.onEvict(input.upToSeq);
    }
  }

  // ── read-only accessors (§4.4) ────────────────────────────────────────────

  /** Highest assigned seq; 0 when empty (D8). */
  get head(): number {
    return this.window.head;
  }

  /** Lowest retained seq; 0 when nothing evicted. */
  get floor(): number {
    return this.window.floor;
  }

  /** The minimum per-stream watermark, or undefined when no streams (D7). */
  get minWatermark(): number | undefined {
    return this.sessions.minWatermark();
  }

  /** Number of live stream instances. */
  get streamCount(): number {
    return this.sessions.size;
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private allocTimer(): number {
    this.nextTimer += 1;
    return this.nextTimer;
  }

  /** Classify + resolve a Read, returning the immediate outputs. If the read
   *  must be held, the entry is parked and (for timeoutMs > 0) a set_timer output
   *  is produced. */
  private onRead(
    streamId: string,
    cursorOpt: Cursor | undefined,
    limits: Limits,
    timeoutMs: number | undefined,
  ): LogOutput[] {
    const cursor = cursorOpt ?? START;
    const out: LogOutput[] = [];

    // D5 supersede: a new Read on a stream with a held read drops the old one
    // unanswered and cancels its timer.
    {
      const entry = this.sessions.getOrCreate(streamId);
      if (entry.held !== undefined) {
        const prev = entry.held;
        entry.held = undefined;
        if (prev.timer !== undefined) out.push({ type: "cancel_timer", token: prev.timer });
      }
    }

    const res = this.classify(cursor);
    switch (res.r) {
      case "data": {
        const { records, last } = this.window.scan(cursor.seq, limits);
        // scan is only reached when data exists, so records is non-empty.
        const entry = this.sessions.get(streamId)!;
        entry.watermark = last;
        out.push({
          type: "read_response",
          streamId,
          records,
          nextCursor: { seq: last },
          state: "data",
        });
        break;
      }
      case "terminal": {
        out.push(this.terminalResponse(streamId, cursor, res.state, res.error));
        break;
      }
      case "expired": {
        out.push({
          type: "read_response",
          streamId,
          records: [],
          nextCursor: res.nextCursor,
          state: "expired",
        });
        break;
      }
      case "caught_up_live": {
        // shared §3.4 rule 2, live branch — depends on timeoutMs (D14).
        if (timeoutMs === 0) {
          // Immediate would_block probe.
          out.push({
            type: "read_response",
            streamId,
            records: [],
            nextCursor: cursor,
            state: "would_block",
          });
        } else if (timeoutMs === undefined) {
          // Hold indefinitely.
          const entry = this.sessions.get(streamId)!;
          entry.held = { cursor, limits };
        } else {
          // Hold + set_timer.
          const token = this.allocTimer();
          const entry = this.sessions.get(streamId)!;
          entry.held = { cursor, limits, timer: token };
          out.push({ type: "set_timer", token, ms: timeoutMs });
        }
        break;
      }
    }
    return out;
  }

  /** Classify a cursor against the current window (shared §3.4 rules 1–4). */
  private classify(cursor: Cursor): Resolution {
    const head = this.window.head;
    const floor = this.window.floor;
    const c = cursor.seq;

    // Rule 3a: beyond head — position never existed → expired, next = head.
    if (c > head) return { r: "expired", nextCursor: { seq: head } };
    // Rule 3b: below floor — records were evicted → expired, next = floor-1.
    // c + 1 < floor (D9). floor==0 means nothing evicted, never trips.
    if (floor > 0 && c + 1 < floor) return { r: "expired", nextCursor: { seq: floor - 1 } };
    // Rule 1: data available (c < head, records retained after c).
    if (c < head) return { r: "data" };
    // Rule 2: caught up (c == head). Depends on lifecycle.
    return this.caughtUp(this.window.lifecycle);
  }

  private caughtUp(lc: Lifecycle): Resolution {
    switch (lc.kind) {
      case "sealed":
        return { r: "terminal", state: "eof" };
      case "closed":
        return { r: "terminal", state: "closed" };
      case "failed":
        return { r: "terminal", state: "failed", error: lc.error };
      case "live":
        return { r: "caught_up_live" };
    }
  }

  private terminalResponse(
    streamId: string,
    cursor: Cursor,
    state: LogState,
    error: LogError | undefined,
  ): LogResponse {
    return error === undefined
      ? { type: "read_response", streamId, records: [], nextCursor: cursor, state }
      : { type: "read_response", streamId, records: [], nextCursor: cursor, state, error };
  }

  private onPush(payload: Uint8Array): LogOutput[] {
    // D19: a Push after any terminal lifecycle (sealed/closed/failed) is dropped
    // — nothing appended, head unchanged — and emits exactly one
    // push_after_terminal warning per late push. Held reads are untouched: head
    // did not move, so nothing to release.
    if (this.window.lifecycle.kind !== "live") {
      return [{ type: "diagnostic", severity: "warn", code: "push_after_terminal" }];
    }
    this.window.push(payload);
    // Data now available for held reads: release them in creation order.
    return this.releaseHeld();
  }

  private onSeal(): LogOutput[] {
    this.window.seal();
    return this.releaseHeld();
  }

  private onClose(error: LogError | undefined): LogOutput[] {
    // D6 (refined): ProducerStop fires on the TRANSITION into a terminal state
    // via Close. A Close on an already-terminal (closed/failed) log is a no-op
    // that emits NOTHING — outputs-idempotent, symmetric with Seal: no held reads
    // to answer (they were drained on the first terminal), no timers to cancel,
    // no re-ProducerStop. A Close on a live OR sealed log is a real transition,
    // so it runs the full path.
    const lc = this.window.lifecycle.kind;
    if (lc === "closed" || lc === "failed") return [];
    const failed = error !== undefined;
    this.window.close(error);
    const out = this.releaseHeld();
    // Real transition into a terminal state via Close ⇒ ProducerStop (D6).
    out.push({ type: "producer_stop", reason: failed ? "failed" : "closed" });
    return out;
  }

  private onEvict(upToSeq: number): LogOutput[] {
    this.window.evict(upToSeq);
    // Eviction does not release held reads (they are caught-up at head, above any
    // evicted region).
    return [];
  }

  private onEndStream(streamId: string): LogOutput[] {
    const out: LogOutput[] = [];
    const before = this.sessions.size;
    const entry = this.sessions.remove(streamId);
    if (entry !== undefined) {
      // Drop held read (no response), cancel its timer.
      if (entry.held !== undefined && entry.held.timer !== undefined) {
        out.push({ type: "cancel_timer", token: entry.held.timer });
      }
      // D6: reader-count ≥1→0 transition under stop_when=last_reader.
      const after = this.sessions.size;
      if (this.stopWhen === "last_reader" && before >= 1 && after === 0) {
        out.push({ type: "producer_stop", reason: "last_reader_gone" });
      }
    }
    // Unknown streamId = no-op (nothing removed, no outputs).
    return out;
  }

  private onTimerExpired(token: number): LogOutput[] {
    // Find the held read waiting on this token; answer it would_block.
    // Unknown/canceled token = no-op.
    let target: string | undefined;
    for (const id of this.sessions.heldInCreationOrder()) {
      const held = this.sessions.get(id)?.held;
      if (held?.timer === token) {
        target = id;
        break;
      }
    }
    if (target === undefined) return [];
    const entry = this.sessions.get(target)!;
    const held = entry.held!;
    entry.held = undefined;
    return [
      {
        type: "read_response",
        streamId: target,
        records: [],
        nextCursor: held.cursor,
        state: "would_block",
      },
    ];
  }

  /** Sweep held reads in creation order (D16), releasing each the current window
   *  state can now answer. Every held read is re-resolved from its parked cursor:
   *  a Push may now yield data; a Seal/Close yields the terminal state (or data,
   *  if pushes were buffered before it). A read that still classifies as
   *  caught-up + live is re-parked, untouched. */
  private releaseHeld(): LogOutput[] {
    const out: LogOutput[] = [];
    for (const id of this.sessions.heldInCreationOrder()) {
      const entry = this.sessions.get(id)!;
      const held = entry.held!;
      entry.held = undefined;
      const resp = this.resolveHeld(id, held, out);
      if (resp !== undefined) {
        out.push(resp);
      } else {
        // Still cannot answer (caught up + live): re-park it.
        entry.held = held;
      }
    }
    return out;
  }

  /** Re-resolve a released held read. Returns the LogResponse to emit, or
   *  undefined if it should stay parked (still caught-up + live). Cancels the
   *  held read's timer as a side effect when the read is now answerable. */
  private resolveHeld(id: string, held: HeldRead, out: LogOutput[]): LogResponse | undefined {
    const cursor = held.cursor;
    const res = this.classify(cursor);
    let response: LogResponse;
    switch (res.r) {
      case "data": {
        const { records, last } = this.window.scan(cursor.seq, held.limits);
        const entry = this.sessions.get(id)!;
        entry.watermark = last;
        response = {
          type: "read_response",
          streamId: id,
          records,
          nextCursor: { seq: last },
          state: "data",
        };
        break;
      }
      case "terminal":
        response = this.terminalResponse(id, cursor, res.state, res.error);
        break;
      case "expired":
        response = {
          type: "read_response",
          streamId: id,
          records: [],
          nextCursor: res.nextCursor,
          state: "expired",
        };
        break;
      case "caught_up_live":
        return undefined;
    }
    // Answerable: cancel its timer if it had one.
    if (held.timer !== undefined) out.push({ type: "cancel_timer", token: held.timer });
    return response;
  }
}
