import type {
  StreamCancelTimer,
  StreamClose,
  StreamDiagnostic,
  StreamEndStream,
  StreamProducerStop,
  StreamPush,
  StreamReadRequest,
  StreamReadResponse,
  StreamRecord,
  StreamSeal,
  StreamSetTimer,
  StreamTimerExpired,
} from "../taut/gen/shape_stream.ts";
import type { StopWhen } from "../log/node.ts";

export type StreamInput =
  | ({ readonly type: "push" } & StreamPush)
  | ({ readonly type: "seal" } & StreamSeal)
  | ({ readonly type: "close" } & StreamClose)
  | ({ readonly type: "read" } & StreamReadRequest)
  | ({ readonly type: "end_stream" } & StreamEndStream)
  | ({ readonly type: "timer_expired" } & StreamTimerExpired);

export type StreamOutput =
  | ({ readonly type: "read_response" } & StreamReadResponse)
  | ({ readonly type: "set_timer" } & StreamSetTimer)
  | ({ readonly type: "cancel_timer" } & StreamCancelTimer)
  | ({ readonly type: "producer_stop" } & StreamProducerStop)
  | ({ readonly type: "diagnostic" } & StreamDiagnostic);

type StreamReadOutput = { readonly type: "read_response" } & StreamReadResponse;

interface HeldRead {
  readonly maxRecords: bigint | null;
  readonly maxBytes: bigint | null;
  readonly timeoutMs: bigint | null;
  readonly timerToken: bigint | null;
}

interface Reader {
  cursor: bigint;
  held: HeldRead | null;
}

export interface StreamNodeOptions {
  readonly capacityRecords?: number;
  readonly stopWhen?: StopWhen;
}

/** Pure bounded live-only ring implementing `stream.oracle/v1`. */
export class StreamNode {
  readonly capacityRecords: number;
  readonly stopWhen: StopWhen;
  private currentHead = 0n;
  private readonly payloads = new Map<bigint, Uint8Array>();
  private sealed = false;
  private closed = false;
  private closeError: StreamClose["error"] = null;
  private readonly readers = new Map<string, Reader>();
  private readonly order: string[] = [];
  private nextToken = 1n;

  constructor(options: StreamNodeOptions = {}) {
    this.capacityRecords = options.capacityRecords ?? 64;
    if (!Number.isSafeInteger(this.capacityRecords) || this.capacityRecords <= 0) {
      throw new RangeError("capacityRecords must be a positive safe integer");
    }
    this.stopWhen = options.stopWhen ?? "last_reader";
  }

  handle(input: StreamInput): readonly StreamOutput[] {
    switch (input.type) {
      case "push": return this.push(input);
      case "seal": return this.seal();
      case "close": return this.close(input);
      case "read": return this.read(input);
      case "end_stream": return this.endStream(input);
      case "timer_expired": return this.timerExpired(input);
    }
  }

  get head(): bigint {
    return this.currentHead;
  }

  get floor(): bigint {
    return this.currentHead === 0n
      ? 1n
      : this.currentHead - BigInt(this.payloads.size) + 1n;
  }

  private push(input: { readonly type: "push" } & StreamPush): StreamOutput[] {
    if (this.sealed || this.closed) {
      return [{ type: "diagnostic", severity: "warn", code: "push_after_terminal" }];
    }
    this.currentHead += 1n;
    this.payloads.set(this.currentHead, input.payload.slice());
    if (this.payloads.size > this.capacityRecords) {
      this.payloads.delete(this.currentHead - BigInt(this.capacityRecords));
    }
    return this.answerAllHeld();
  }

  private seal(): StreamOutput[] {
    if (this.sealed || this.closed) return [];
    this.sealed = true;
    return this.answerAllHeld();
  }

  private close(input: { readonly type: "close" } & StreamClose): StreamOutput[] {
    if (this.closed) return [];
    this.closed = true;
    this.closeError = input.error === null
      ? null
      : { code: input.error.code, message: input.error.message };
    const outputs = this.answerAllHeld();
    outputs.push({ type: "producer_stop", reason: this.closeError === null ? "closed" : "failed" });
    return outputs;
  }

  private ensureReader(streamId: string): Reader {
    let reader = this.readers.get(streamId);
    if (reader === undefined) {
      reader = { cursor: this.currentHead, held: null };
      this.readers.set(streamId, reader);
      this.order.push(streamId);
    }
    return reader;
  }

  private read(input: { readonly type: "read" } & StreamReadRequest): StreamOutput[] {
    const reader = this.ensureReader(input.stream_id);
    const outputs: StreamOutput[] = [];
    if (reader.held?.timerToken !== null && reader.held?.timerToken !== undefined) {
      outputs.push({ type: "cancel_timer", token: reader.held.timerToken });
    }
    reader.held = null;
    const response = this.resolve(
      input.stream_id,
      reader,
      input.max_records,
      input.max_bytes,
      input.timeout_ms,
    );
    if (response !== null) {
      outputs.push(response);
      if (response.state === "dropped") outputs.push(...this.removeReader(input.stream_id));
      return outputs;
    }
    let timerToken: bigint | null = null;
    if (input.timeout_ms !== null && input.timeout_ms > 0n) {
      timerToken = this.nextToken++;
      outputs.push({ type: "set_timer", token: timerToken, ms: input.timeout_ms });
    }
    reader.held = {
      maxRecords: input.max_records,
      maxBytes: input.max_bytes,
      timeoutMs: input.timeout_ms,
      timerToken,
    };
    return outputs;
  }

  private resolve(
    streamId: string,
    reader: Reader,
    maxRecords: bigint | null,
    maxBytes: bigint | null,
    timeoutMs: bigint | null,
  ): StreamReadOutput | null {
    if (reader.cursor < this.floor - 1n) {
      return this.response(
        streamId,
        [],
        this.currentHead,
        "dropped",
        { code: "slow_consumer", message: null },
      );
    }
    const records: StreamRecord[] = [];
    let used = 0n;
    for (let seq = reader.cursor + 1n; seq <= this.currentHead; seq += 1n) {
      const payload = this.payloads.get(seq);
      if (payload === undefined) continue;
      if (maxRecords !== null && maxRecords > 0n && BigInt(records.length) >= maxRecords) break;
      const payloadSize = BigInt(payload.byteLength);
      if (maxBytes !== null && maxBytes >= 0n && records.length > 0 && used + payloadSize > maxBytes) break;
      records.push({ seq, payload: payload.slice() });
      used += payloadSize;
    }
    if (records.length > 0) {
      const last = records.at(-1);
      if (last === undefined) throw new Error("stream selected records without a final record");
      reader.cursor = last.seq;
      return this.response(streamId, records, reader.cursor, "data", null);
    }
    if (this.closed) {
      return this.response(
        streamId,
        [],
        reader.cursor,
        this.closeError === null ? "closed" : "failed",
        this.closeError,
      );
    }
    if (this.sealed) return this.response(streamId, [], reader.cursor, "eof", null);
    if (timeoutMs === 0n) return this.response(streamId, [], reader.cursor, "would_block", null);
    return null;
  }

  private response(
    streamId: string,
    records: StreamRecord[],
    position: bigint,
    state: StreamReadResponse["state"],
    error: StreamReadResponse["error"],
  ): StreamReadOutput {
    return {
      type: "read_response",
      stream_id: streamId,
      records,
      next_position: { seq: position },
      state,
      error,
    };
  }

  private answerAllHeld(): StreamOutput[] {
    const outputs: StreamOutput[] = [];
    for (const streamId of [...this.order]) {
      const reader = this.readers.get(streamId);
      if (reader === undefined || reader.held === null) continue;
      const held = reader.held;
      const response = this.resolve(
        streamId,
        reader,
        held.maxRecords,
        held.maxBytes,
        held.timeoutMs,
      );
      if (response === null) continue;
      if (held.timerToken !== null) outputs.push({ type: "cancel_timer", token: held.timerToken });
      reader.held = null;
      outputs.push(response);
      if (response.type === "read_response" && response.state === "dropped") {
        outputs.push(...this.removeReader(streamId));
      }
    }
    return outputs;
  }

  private removeReader(streamId: string): StreamOutput[] {
    if (!this.readers.delete(streamId)) return [];
    const index = this.order.indexOf(streamId);
    if (index >= 0) this.order.splice(index, 1);
    return this.readers.size === 0 && this.stopWhen === "last_reader"
      ? [{ type: "producer_stop", reason: "last_reader_gone" }]
      : [];
  }

  private endStream(input: { readonly type: "end_stream" } & StreamEndStream): StreamOutput[] {
    const reader = this.readers.get(input.stream_id);
    if (reader === undefined) return [];
    const outputs: StreamOutput[] = [];
    if (reader.held?.timerToken !== null && reader.held?.timerToken !== undefined) {
      outputs.push({ type: "cancel_timer", token: reader.held.timerToken });
    }
    outputs.push(...this.removeReader(input.stream_id));
    return outputs;
  }

  private timerExpired(input: { readonly type: "timer_expired" } & StreamTimerExpired): StreamOutput[] {
    for (const streamId of this.order) {
      const reader = this.readers.get(streamId);
      if (reader === undefined || reader.held === null || reader.held.timerToken !== input.token) continue;
      const held = reader.held;
      reader.held = null;
      const response = this.resolve(streamId, reader, held.maxRecords, held.maxBytes, 0n);
      if (response === null) throw new Error("stream probe unexpectedly held");
      return [response];
    }
    return [];
  }
}
