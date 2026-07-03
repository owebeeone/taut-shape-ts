// INTERNAL store core — the bounded in-engine record window (§4.5, D2). NOT
// exported from the public barrel. Distilled from glade/client-ts store.ts: the
// scan(from) resume discipline (no dup / no skip) with `heads` collapsed to a
// single origin (§2). Knows nothing of streams, held reads, timers, or
// watermarks — those live in session.ts. Mirrors taut-shape-rs window.rs.

import type { LogRecord, LogError } from "./messages.ts";

/** The lifecycle of the backing log (D12). `live` is the only non-terminal
 *  state; the three terminals describe the *log*, not any stream, and still
 *  permit re-reads of retained data (shared §3.4 rule 4). */
export type Lifecycle =
  | { readonly kind: "live" }
  | { readonly kind: "sealed" } // finite log complete: drained readers see `eof`
  | { readonly kind: "closed" } // Close{}: drained readers see `closed`
  | { readonly kind: "failed"; readonly error: LogError }; // Close{error}: drained readers see `failed`

/** Bounds on a scan (D10). Absent = unbounded. */
export interface Limits {
  readonly maxRecords?: number;
  readonly maxBytes?: number;
}

/** The result of a scan: the records plus the seq of the last one returned
 *  (the caller's next_cursor on `data`). */
export interface ScanResult {
  readonly records: LogRecord[];
  readonly last: number;
}

export class Window {
  // Records ordered by ascending seq. Array is fine: single-origin, append at
  // the back, evict from the front.
  private records: LogRecord[] = [];
  private _head = 0; // highest assigned seq; 0 when empty (D8)
  private _floor = 0; // lowest retained seq; 0 when nothing evicted
  private _lifecycle: Lifecycle = { kind: "live" };

  get head(): number {
    return this._head;
  }

  get floor(): number {
    return this._floor;
  }

  get lifecycle(): Lifecycle {
    return this._lifecycle;
  }

  /** Append one record: assigns seq := head + 1 (first record seq = 1, D8) and
   *  returns it. The window always accepts; the node gates pushes on lifecycle
   *  (kept simple and total, matching window.rs). */
  push(payload: Uint8Array): LogRecord {
    this._head += 1;
    const rec: LogRecord = { seq: this._head, payload };
    this.records.push(rec);
    return rec;
  }

  /** Mark the log sealed. Idempotent; a terminal Close/Failed is not overwritten
   *  by a later Seal (Close wins — terminal is terminal). */
  seal(): void {
    if (this._lifecycle.kind === "live") this._lifecycle = { kind: "sealed" };
  }

  /** Mark the log closed (error absent → closed; present → failed). Idempotent:
   *  the first terminal transition wins (a later Close does not mutate an
   *  already-terminal state). */
  close(error: LogError | undefined): void {
    if (this._lifecycle.kind === "live" || this._lifecycle.kind === "sealed") {
      this._lifecycle = error === undefined ? { kind: "closed" } : { kind: "failed", error };
    }
  }

  /** Records with seq > from, ascending, bounded by `limits` with the D10
   *  forward-progress guarantee (≥1 record whenever any is available, even if it
   *  alone exceeds maxBytes). maxBytes counts RAW PAYLOAD BYTES ONLY. Assumes the
   *  caller has classified `from` as valid-for-data. */
  scan(from: number, limits: Limits): ScanResult {
    const out: LogRecord[] = [];
    let last = from;
    let bytes = 0;
    for (const rec of this.records) {
      if (rec.seq <= from) continue;
      if (limits.maxRecords !== undefined && out.length >= limits.maxRecords) break;
      if (limits.maxBytes !== undefined) {
        const nextBytes = bytes + rec.payload.length;
        if (out.length > 0 && nextBytes > limits.maxBytes) break;
        bytes = nextBytes;
      }
      last = rec.seq;
      out.push(rec);
    }
    return { records: out, last };
  }

  /** Drop records with seq <= upToSeq, raising the floor (D7). The floor becomes
   *  the lowest seq still retained (so floor - 1 is the last evicted seq — the
   *  D9 earliest-resumable position). Clamped so eviction never claims to drop
   *  beyond head. Floor only ever rises. */
  evict(upToSeq: number): void {
    if (upToSeq === 0) return;
    while (this.records.length > 0 && this.records[0]!.seq <= upToSeq) {
      this.records.shift();
    }
    const evictedThrough = Math.min(upToSeq, this._head);
    const newFloor = evictedThrough + 1;
    if (newFloor > this._floor) this._floor = newFloor;
  }
}
