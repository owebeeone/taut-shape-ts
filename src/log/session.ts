// INTERNAL session table — one entry per live stream instance (§4.5, D3/D4).
// NOT exported from the public barrel. Each entry is the per-stream "response
// handler": its ≤1 held read (D5), the timer token that read is waiting on
// (D14), and its delivery watermark (D7). Clean-room (glade has no held-read /
// timer / lifecycle equivalent). Mirrors taut-shape-rs session.rs.
//
// D16 emission order: each entry records an explicit creation rank (56-F6),
// kept in a held-only sorted index so a wake touches only currently held
// stream ids instead of every live stream (see Table's doc comment below).

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
  /** Creation rank (D16 emission order on a multi-read wake). */
  readonly created: number;
  /** ≤1 outstanding read per stream (D5). */
  held?: HeldRead;
  /** Last delivered seq (D7); the eviction-safety watermark. */
  watermark: number;
}

/**
 * 56-F6: `heldRanks`/`rankToId` and `timerIndex` are auxiliary indices kept in
 * lockstep with `entries[*].held` by `setHeld`/`clearHeld` (the only two ways
 * `held` may change). They hold *only* the currently held stream ids, so a
 * wake (`heldInCreationOrder`) touches `H` (held reads) instead of `S` (all
 * live streams), and a timer expiry (`findByTimer`) is an O(1) map lookup
 * instead of an O(S) scan.
 */
export class Table {
  private entries = new Map<string, Entry>();
  private nextRank = 0;
  // Ascending creation ranks of streams that currently hold a read (D16),
  // kept sorted via binary-search insert/remove into a plain array. H (held
  // count) is typically « S (live stream count), so this touches O(H) work
  // per update/traversal instead of scanning all S sessions.
  private heldRanks: number[] = [];
  private rankToId = new Map<number, string>();
  // timer_token -> stream_id (D14): O(1) expiry lookup instead of scanning
  // held sessions for a matching token.
  private timerIndex = new Map<number, string>();

  /** Number of live stream instances (D4 reader count). */
  get size(): number {
    return this.entries.size;
  }

  /** Get an existing entry, or implicitly create it on first use (D4). */
  getOrCreate(id: string): Entry {
    let e = this.entries.get(id);
    if (e === undefined) {
      e = { created: this.nextRank++, watermark: 0 };
      this.entries.set(id, e);
    }
    return e;
  }

  get(id: string): Entry | undefined {
    return this.entries.get(id);
  }

  /** Remove a stream instance (D4 EndStream). Returns the removed entry so the
   *  caller can cancel its timer, or undefined if unknown. Clears any
   *  auxiliary held/timer index entries for it (56-F6). */
  remove(id: string): Entry | undefined {
    const e = this.entries.get(id);
    if (e === undefined) return undefined;
    this.entries.delete(id);
    if (e.held !== undefined) {
      this.removeHeldRank(e.created);
      if (e.held.timer !== undefined) this.timerIndex.delete(e.held.timer);
    }
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

  /** Park (or replace) `id`'s held read, updating the creation-order and timer
   *  indices in lockstep (D16/D14). The caller must have already released any
   *  prior held read via `clearHeld`. */
  setHeld(id: string, held: HeldRead): void {
    const e = this.entries.get(id)!;
    e.held = held;
    this.insertHeldRank(e.created, id);
    if (held.timer !== undefined) this.timerIndex.set(held.timer, id);
  }

  /** Release `id`'s held read, if any, clearing both auxiliary indices.
   *  Returns the removed HeldRead, or undefined if it was not held. */
  clearHeld(id: string): HeldRead | undefined {
    const e = this.entries.get(id);
    if (e === undefined || e.held === undefined) return undefined;
    const held = e.held;
    e.held = undefined;
    this.removeHeldRank(e.created);
    if (held.timer !== undefined) this.timerIndex.delete(held.timer);
    return held;
  }

  /** Release several held reads in one pass over the held-rank index.
   *  `releaseHeld` uses this after resolving a wake batch so clearing H reads
   *  is O(H), rather than H repeated array splices (O(H²)). */
  clearHeldMany(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const ranks = new Set<number>();
    for (const id of ids) {
      const e = this.entries.get(id);
      if (e === undefined || e.held === undefined) continue;
      ranks.add(e.created);
      this.rankToId.delete(e.created);
      if (e.held.timer !== undefined) this.timerIndex.delete(e.held.timer);
      e.held = undefined;
    }
    if (ranks.size !== 0) {
      this.heldRanks = this.heldRanks.filter((rank) => !ranks.has(rank));
    }
  }

  /** All stream ids that currently hold a read, in CREATION ORDER (D16) — used
   *  to sweep held reads when an input (Push/Seal/Close) may release several.
   *  O(H): `heldRanks` contains only held ids. */
  heldInCreationOrder(): string[] {
    return this.heldRanks.map((r) => this.rankToId.get(r)!);
  }

  /** The stream id whose held read is waiting on `token`, if any (D14). O(1)
   *  via the timer index, instead of scanning held reads. */
  findByTimer(token: number): string | undefined {
    return this.timerIndex.get(token);
  }

  private insertHeldRank(rank: number, id: string): void {
    const i = this.rankLowerBound(rank);
    this.heldRanks.splice(i, 0, rank);
    this.rankToId.set(rank, id);
  }

  private removeHeldRank(rank: number): void {
    const i = this.rankLowerBound(rank);
    if (this.heldRanks[i] === rank) this.heldRanks.splice(i, 1);
    this.rankToId.delete(rank);
  }

  /** Index of the first element >= rank in the sorted `heldRanks` array. */
  private rankLowerBound(rank: number): number {
    let lo = 0;
    let hi = this.heldRanks.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.heldRanks[mid]! < rank) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
