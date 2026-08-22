import type {
  SwmrCancelTimer,
  SwmrClose,
  SwmrDelta,
  SwmrDeltaPush,
  SwmrDiagnostic,
  SwmrEndStream,
  SwmrError,
  SwmrProducerStop,
  SwmrReadRequest,
  SwmrReadResponse,
  SwmrReset,
  SwmrResetReason,
  SwmrSeal,
  SwmrSetTimer,
  SwmrSnapshot,
  SwmrSnapshotPush,
  SwmrTimerExpired,
} from "../taut/gen/shape_swmr.ts";
import type { StopWhen } from "../log/node.ts";

export type SwmrInput =
  | ({ readonly type: "snapshot_push" } & SwmrSnapshotPush)
  | ({ readonly type: "delta_push" } & SwmrDeltaPush)
  | ({ readonly type: "reset" } & SwmrReset)
  | ({ readonly type: "seal" } & SwmrSeal)
  | ({ readonly type: "close" } & SwmrClose)
  | ({ readonly type: "read" } & SwmrReadRequest)
  | ({ readonly type: "end_stream" } & SwmrEndStream)
  | ({ readonly type: "timer_expired" } & SwmrTimerExpired);

export type SwmrOutput =
  | ({ readonly type: "read_response" } & SwmrReadResponse)
  | ({ readonly type: "set_timer" } & SwmrSetTimer)
  | ({ readonly type: "cancel_timer" } & SwmrCancelTimer)
  | ({ readonly type: "producer_stop" } & SwmrProducerStop)
  | ({ readonly type: "diagnostic" } & SwmrDiagnostic);

type ReadOutput = { readonly type: "read_response" } & SwmrReadResponse;

interface HeldRead {
  readonly swmrId: string;
  readonly cursor: SwmrReadRequest["cursor"];
  readonly timeoutMs: bigint | null;
  readonly timerToken: bigint | null;
}

export interface SwmrNodeOptions {
  readonly stopWhen?: StopWhen;
  readonly maxDeltas?: number | null;
  readonly recoveryPolicy?: SwmrRecoveryPolicy;
}

export type SwmrRecoveryPolicy = "repair" | "expire";

/** Pure single-writer snapshot/delta mailbox implementing `swmr.oracle/v1`. */
export class SwmrNode {
  readonly stopWhen: StopWhen;
  readonly maxDeltas: number | null;
  readonly recoveryPolicy: SwmrRecoveryPolicy;
  private snapshot: SwmrSnapshot | null = null;
  private deltas: SwmrDelta[] = [];
  private sealed = false;
  private closed = false;
  private closeError: SwmrError | null = null;
  private writerId: string | null = null;
  private currentEpoch = 0n;
  private lastResetReason: SwmrResetReason | null = null;
  private lastResetDetail: Uint8Array | null = null;
  private readonly streams = new Map<string, HeldRead | null>();
  private readonly order: string[] = [];
  private nextToken = 1n;

  constructor(options: SwmrNodeOptions = {}) {
    this.stopWhen = options.stopWhen ?? "last_reader";
    this.maxDeltas = options.maxDeltas ?? null;
    this.recoveryPolicy = options.recoveryPolicy ?? "repair";
    if (this.maxDeltas !== null && (!Number.isSafeInteger(this.maxDeltas) || this.maxDeltas < 0)) {
      throw new RangeError("maxDeltas must be a non-negative safe integer or null");
    }
  }

  handle(input: SwmrInput): readonly SwmrOutput[] {
    switch (input.type) {
      case "snapshot_push": return this.snapshotPush(input);
      case "delta_push": return this.deltaPush(input);
      case "reset": return this.reset(input);
      case "seal": return this.seal();
      case "close": return this.close(input);
      case "read": return this.read(input);
      case "end_stream": return this.endStream(input);
      case "timer_expired": return this.timerExpired(input);
    }
  }

  get head(): bigint {
    return this.snapshot === null ? 0n : this.snapshot.seq + BigInt(this.deltas.length);
  }

  get epoch(): bigint {
    return this.currentEpoch;
  }

  private get terminal(): boolean {
    return this.sealed || this.closed;
  }

  private checkWriter(writerId: string): boolean {
    if (this.writerId === null) {
      this.writerId = writerId;
      return true;
    }
    return this.writerId === writerId;
  }

  private diagnostic(code: SwmrDiagnostic["code"]): SwmrOutput[] {
    return [{
      type: "diagnostic",
      severity: code === "push_after_terminal" ? "warn" : "error",
      code,
    }];
  }

  private snapshotPush(input: { readonly type: "snapshot_push" } & SwmrSnapshotPush): SwmrOutput[] {
    if (this.terminal) return this.diagnostic("push_after_terminal");
    if (!this.checkWriter(input.writer_id)) return this.diagnostic("writer_conflict");
    this.snapshot = { seq: this.head, payload: input.payload.slice() };
    this.deltas = [];
    return this.answerAllHeld();
  }

  private deltaPush(input: { readonly type: "delta_push" } & SwmrDeltaPush): SwmrOutput[] {
    if (this.terminal) return this.diagnostic("push_after_terminal");
    if (!this.checkWriter(input.writer_id)) return this.diagnostic("writer_conflict");
    if (this.snapshot === null) return this.diagnostic("delta_before_snapshot");
    if (this.maxDeltas !== null && this.deltas.length >= this.maxDeltas) {
      return this.diagnostic("retention_bound_exceeded");
    }
    const seq = this.head + 1n;
    this.deltas.push({ base_seq: seq - 1n, seq, payload: input.payload.slice() });
    return this.answerAllHeld();
  }

  private reset(input: { readonly type: "reset" } & SwmrReset): SwmrOutput[] {
    if (this.terminal) return this.diagnostic("push_after_terminal");
    if (!this.checkWriter(input.writer_id)) return this.diagnostic("writer_conflict");
    const reason: SwmrResetReason = "producer_requested";
    this.currentEpoch += 1n;
    this.snapshot = null;
    this.deltas = [];
    this.lastResetReason = reason;
    this.lastResetDetail = input.detail?.slice() ?? null;
    const outputs: SwmrOutput[] = [];
    for (const streamId of this.order) {
      const held = this.streams.get(streamId);
      if (held === null || held === undefined) continue;
      if (held.cursor === null) {
        const response = this.resolve(held.swmrId, streamId, null, held.timeoutMs);
        if (response !== null) {
          if (held.timerToken !== null) outputs.push({ type: "cancel_timer", token: held.timerToken });
          outputs.push(response);
          this.streams.set(streamId, null);
        }
        continue;
      }
      if (held.timerToken !== null) outputs.push({ type: "cancel_timer", token: held.timerToken });
      outputs.push(this.response(held.swmrId, streamId, {
        state: "reset",
        resetReason: reason,
        resetDetail: this.lastResetDetail,
      }));
      this.streams.set(streamId, null);
    }
    return outputs;
  }

  private seal(): SwmrOutput[] {
    if (this.sealed) return [];
    this.sealed = true;
    return this.answerAllHeld();
  }

  private close(input: { readonly type: "close" } & SwmrClose): SwmrOutput[] {
    if (this.closed) return [];
    this.closed = true;
    this.closeError = input.error === null
      ? null
      : { code: input.error.code, message: input.error.message };
    const outputs = this.answerAllHeld();
    outputs.push({ type: "producer_stop", reason: this.closeError === null ? "closed" : "failed" });
    return outputs;
  }

  private ensureStream(streamId: string): void {
    if (!this.streams.has(streamId)) {
      this.streams.set(streamId, null);
      this.order.push(streamId);
    }
  }

  private read(input: { readonly type: "read" } & SwmrReadRequest): SwmrOutput[] {
    this.ensureStream(input.stream_id);
    const outputs: SwmrOutput[] = [];
    const prior = this.streams.get(input.stream_id);
    if (prior?.timerToken !== null && prior?.timerToken !== undefined) {
      outputs.push({ type: "cancel_timer", token: prior.timerToken });
    }
    this.streams.set(input.stream_id, null);
    const cursor = input.cursor === null
      ? null
      : { seq: input.cursor.seq, epoch: input.cursor.epoch };
    const response = this.resolve(input.swmr_id, input.stream_id, cursor, input.timeout_ms);
    if (response !== null) {
      outputs.push(response);
      return outputs;
    }
    let timerToken: bigint | null = null;
    if (input.timeout_ms !== null && input.timeout_ms > 0n) {
      timerToken = this.nextToken++;
      outputs.push({ type: "set_timer", token: timerToken, ms: input.timeout_ms });
    }
    this.streams.set(input.stream_id, {
      swmrId: input.swmr_id,
      cursor,
      timeoutMs: input.timeout_ms,
      timerToken,
    });
    return outputs;
  }

  private resolve(
    swmrId: string,
    streamId: string,
    cursor: SwmrReadRequest["cursor"],
    timeoutMs: bigint | null,
  ): ReadOutput | null {
    if (cursor !== null && cursor.epoch < this.currentEpoch) {
      return this.response(swmrId, streamId, {
        snapshot: this.snapshot,
        deltas: this.snapshot === null ? [] : this.deltas,
        nextCursor: this.currentCursor(),
        state: "reset",
        resetReason: this.lastResetReason ?? "producer_requested",
        resetDetail: this.lastResetDetail,
      });
    }
    if (cursor !== null && cursor.epoch > this.currentEpoch) {
      return this.response(swmrId, streamId, {
        snapshot: this.snapshot,
        deltas: this.snapshot === null ? [] : this.deltas,
        nextCursor: this.currentCursor(),
        state: "reset",
        resetReason: "invalid_resume_seq",
      });
    }
    if (this.snapshot === null) return this.caughtUp(swmrId, streamId, null, timeoutMs);
    if (cursor === null) {
      return this.response(swmrId, streamId, {
        snapshot: this.snapshot,
        deltas: this.deltas,
        nextCursor: this.currentCursor(),
        state: "data",
      });
    }
    if (cursor.seq < this.snapshot.seq) {
      return this.response(swmrId, streamId, {
        snapshot: this.snapshot,
        deltas: this.deltas,
        nextCursor: this.currentCursor(),
        state: "reset",
        resetReason: "retention_exceeded",
      });
    }
    if (cursor.seq === this.head) {
      return this.caughtUp(
        swmrId,
        streamId,
        { seq: this.head, epoch: this.currentEpoch },
        timeoutMs,
      );
    }
    if (cursor.seq > this.head) {
      return this.response(swmrId, streamId, {
        snapshot: this.snapshot,
        deltas: this.deltas,
        nextCursor: this.currentCursor(),
        state: "reset",
        resetReason: "invalid_resume_seq",
      });
    }
    const offset = Number(cursor.seq - this.snapshot.seq);
    return this.response(swmrId, streamId, {
      deltas: this.deltas.slice(offset),
      nextCursor: this.currentCursor(),
      state: "data",
    });
  }

  private currentCursor(): SwmrReadResponse["next_cursor"] {
    return this.snapshot === null ? null : { seq: this.head, epoch: this.currentEpoch };
  }

  private caughtUp(
    swmrId: string,
    streamId: string,
    nextCursor: SwmrReadResponse["next_cursor"],
    timeoutMs: bigint | null,
  ): ReadOutput | null {
    if (this.closed) {
      return this.response(swmrId, streamId, {
        nextCursor,
        state: this.closeError === null ? "closed" : "failed",
        error: this.closeError,
      });
    }
    if (this.sealed) return this.response(swmrId, streamId, { nextCursor, state: "eof" });
    if (timeoutMs === 0n) return this.response(swmrId, streamId, { nextCursor, state: "would_block" });
    return null;
  }

  private response(
    swmrId: string,
    streamId: string,
    fields: {
      readonly snapshot?: SwmrSnapshot | null;
      readonly deltas?: readonly SwmrDelta[];
      readonly nextCursor?: SwmrReadResponse["next_cursor"];
      readonly state: SwmrReadResponse["state"];
      readonly resetReason?: SwmrResetReason | null;
      readonly error?: SwmrError | null;
      readonly resetDetail?: Uint8Array | null;
    },
  ): ReadOutput {
    return {
      type: "read_response",
      swmr_id: swmrId,
      stream_id: streamId,
      snapshot: fields.snapshot == null
        ? null
        : { seq: fields.snapshot.seq, payload: fields.snapshot.payload.slice() },
      deltas: (fields.deltas ?? []).map((delta) => ({
        base_seq: delta.base_seq,
        seq: delta.seq,
        payload: delta.payload.slice(),
      })),
      next_cursor: fields.nextCursor ?? null,
      state: fields.state,
      reset_reason: fields.resetReason ?? null,
      error: fields.error ?? null,
      reset_detail: fields.resetDetail?.slice() ?? null,
    };
  }

  private answerAllHeld(): SwmrOutput[] {
    const outputs: SwmrOutput[] = [];
    for (const streamId of this.order) {
      const held = this.streams.get(streamId);
      if (held === null || held === undefined) continue;
      const response = this.resolve(held.swmrId, streamId, held.cursor, held.timeoutMs);
      if (response === null) continue;
      if (held.timerToken !== null) outputs.push({ type: "cancel_timer", token: held.timerToken });
      outputs.push(response);
      this.streams.set(streamId, null);
    }
    return outputs;
  }

  private endStream(input: { readonly type: "end_stream" } & SwmrEndStream): SwmrOutput[] {
    if (!this.streams.has(input.stream_id)) return [];
    const held = this.streams.get(input.stream_id);
    this.streams.delete(input.stream_id);
    const index = this.order.indexOf(input.stream_id);
    if (index >= 0) this.order.splice(index, 1);
    const outputs: SwmrOutput[] = [];
    if (held?.timerToken !== null && held?.timerToken !== undefined) {
      outputs.push({ type: "cancel_timer", token: held.timerToken });
    }
    if (this.streams.size === 0 && this.stopWhen === "last_reader") {
      outputs.push({ type: "producer_stop", reason: "last_reader_gone" });
    }
    return outputs;
  }

  private timerExpired(input: { readonly type: "timer_expired" } & SwmrTimerExpired): SwmrOutput[] {
    for (const [streamId, held] of this.streams) {
      if (held === null || held.timerToken !== input.token) continue;
      this.streams.set(streamId, null);
      const response = this.resolve(held.swmrId, streamId, held.cursor, 0n);
      if (response === null) throw new Error("swmr probe unexpectedly held");
      return [response];
    }
    return [];
  }
}
