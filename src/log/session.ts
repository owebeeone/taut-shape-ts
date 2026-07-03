// INTERNAL session table — one entry per live stream instance (§4.5, D3/D4).
// NOT exported from the public barrel. Each entry is the per-stream "response
// handler": its ≤1 held read (D5), the timer token that read is waiting on
// (D14), and its delivery watermark (D7). Clean-room (glade has no held-read /
// timer / lifecycle equivalent). Mirrors taut-shape-rs session.rs.
//
// D16 emission order: JS Map iteration order IS insertion order, and entries are
// inserted in stream-creation order, so "creation order" falls out of the data
// structure for free — no rank counter needed.

import type { Cursor } from "./messages.ts";
import type { Limits } from "./window.ts";

/** A parked tail read (shared §3.4 rule 2, held branch). Its timeout has already
 *  been resolved into an optional timer token by the node. */
export interface HeldRead {
  readonly cursor: Cursor;
  readonly limits: Limits;
  /** The timer this held read is waiting on, if any (timeoutMs > 0). `undefined`
   *  = hold indefinitely (timeoutMs absent). */
  readonly timer?: number;
}

/** One stream instance's state. */
export interface Entry {
  /** ≤1 outstanding read per stream (D5). */
  held?: HeldRead;
  /** Last delivered seq (D7); the eviction-safety watermark. */
  watermark: number;
}

export class Table {
  private entries = new Map<string, Entry>();

  /** Number of live stream instances (D4 reader count). */
  get size(): number {
    return this.entries.size;
  }

  /** Get an existing entry, or implicitly create it on first use (D4). */
  getOrCreate(id: string): Entry {
    let e = this.entries.get(id);
    if (e === undefined) {
      e = { watermark: 0 };
      this.entries.set(id, e);
    }
    return e;
  }

  get(id: string): Entry | undefined {
    return this.entries.get(id);
  }

  /** Remove a stream instance (D4 EndStream). Returns the removed entry so the
   *  caller can cancel its timer, or undefined if unknown. */
  remove(id: string): Entry | undefined {
    const e = this.entries.get(id);
    if (e !== undefined) this.entries.delete(id);
    return e;
  }

  /** The minimum watermark across all live streams (D7), or undefined when there
   *  are no live streams. The safe eviction floor for the consumer. */
  minWatermark(): number | undefined {
    let min: number | undefined;
    for (const e of this.entries.values()) {
      if (min === undefined || e.watermark < min) min = e.watermark;
    }
    return min;
  }

  /** All stream ids that currently hold a read, in CREATION ORDER (D16) — used
   *  to sweep held reads when an input (Push/Seal/Close) may release several. */
  heldInCreationOrder(): string[] {
    const out: string[] = [];
    for (const [id, e] of this.entries) {
      if (e.held !== undefined) out.push(id);
    }
    return out;
  }
}
