import type {
  AtomCancelTimer,
  AtomClose,
  AtomDiagnostic,
  AtomEndStream,
  AtomProducerStop,
  AtomReadRequest,
  AtomReadResponse,
  AtomReplace,
  AtomSeal,
  AtomSetTimer,
  AtomTimerExpired,
} from "../taut/gen/shape_atom.ts";
import type { StopWhen } from "../log/node.ts";

export type AtomInput =
  | ({ readonly type: "replace" } & AtomReplace)
  | ({ readonly type: "seal" } & AtomSeal)
  | ({ readonly type: "close" } & AtomClose)
  | ({ readonly type: "read" } & AtomReadRequest)
  | ({ readonly type: "end_stream" } & AtomEndStream)
  | ({ readonly type: "timer_expired" } & AtomTimerExpired);

export type AtomOutput =
  | ({ readonly type: "read_response" } & AtomReadResponse)
  | ({ readonly type: "set_timer" } & AtomSetTimer)
  | ({ readonly type: "cancel_timer" } & AtomCancelTimer)
  | ({ readonly type: "producer_stop" } & AtomProducerStop)
  | ({ readonly type: "diagnostic" } & AtomDiagnostic);

interface HeldRead {
  readonly atomId: string;
  readonly version: bigint;
  readonly timeoutMs: bigint | null;
  readonly timerToken: bigint | null;
}

export interface AtomNodeOptions {
  readonly stopWhen?: StopWhen;
}

/** Pure latest-state mailbox implementing `atom.oracle/v1`. */
export class AtomNode {
  readonly stopWhen: StopWhen;
  private currentVersion = 0n;
  private payload: Uint8Array | null = null;
  private sealed = false;
  private closed = false;
  private closeError: AtomClose["error"] = null;
  private readonly streams = new Map<string, HeldRead | null>();
  private readonly order: string[] = [];
  private nextToken = 1n;

  constructor(options: AtomNodeOptions = {}) {
    this.stopWhen = options.stopWhen ?? "last_reader";
  }

  handle(input: AtomInput): readonly AtomOutput[] {
    switch (input.type) {
      case "replace": return this.replace(input);
      case "seal": return this.seal();
      case "close": return this.close(input);
      case "read": return this.read(input);
      case "end_stream": return this.endStream(input);
      case "timer_expired": return this.timerExpired(input);
    }
  }

  get version(): bigint {
    return this.currentVersion;
  }

  private replace(input: { readonly type: "replace" } & AtomReplace): AtomOutput[] {
    if (this.sealed || this.closed) {
      return [{ type: "diagnostic", severity: "warn", code: "replace_after_terminal" }];
    }
    this.currentVersion += 1n;
    this.payload = input.payload.slice();
    return this.answerAllHeld();
  }

  private seal(): AtomOutput[] {
    if (this.sealed) return [];
    this.sealed = true;
    return this.answerAllHeld();
  }

  private close(input: { readonly type: "close" } & AtomClose): AtomOutput[] {
    if (this.closed) return [];
    this.closed = true;
    this.closeError = input.error === null
      ? null
      : { code: input.error.code, message: input.error.message };
    const outputs = this.answerAllHeld();
    outputs.push({
      type: "producer_stop",
      reason: this.closeError === null ? "closed" : "failed",
    });
    return outputs;
  }

  private ensureStream(streamId: string): void {
    if (!this.streams.has(streamId)) {
      this.streams.set(streamId, null);
      this.order.push(streamId);
    }
  }

  private read(input: { readonly type: "read" } & AtomReadRequest): AtomOutput[] {
    this.ensureStream(input.stream_id);
    const outputs: AtomOutput[] = [];
    const prior = this.streams.get(input.stream_id);
    if (prior?.timerToken !== null && prior?.timerToken !== undefined) {
      outputs.push({ type: "cancel_timer", token: prior.timerToken });
    }
    this.streams.set(input.stream_id, null);
    const version = input.version?.version ?? 0n;
    const response = this.resolve(input.atom_id, input.stream_id, version, input.timeout_ms);
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
      atomId: input.atom_id,
      version,
      timeoutMs: input.timeout_ms,
      timerToken,
    });
    return outputs;
  }

  private resolve(
    atomId: string,
    streamId: string,
    version: bigint,
    timeoutMs: bigint | null,
  ): AtomOutput | null {
    if (version < this.currentVersion) {
      if (this.payload === null) throw new Error("atom version advanced without a payload");
      return {
        type: "read_response",
        atom_id: atomId,
        stream_id: streamId,
        value: { version: this.currentVersion, payload: this.payload.slice() },
        next_version: { version: this.currentVersion },
        state: "data",
        error: null,
      };
    }
    if (this.closed) {
      return {
        type: "read_response",
        atom_id: atomId,
        stream_id: streamId,
        value: null,
        next_version: { version: this.currentVersion },
        state: this.closeError === null ? "closed" : "failed",
        error: this.closeError,
      };
    }
    if (this.sealed) {
      return {
        type: "read_response",
        atom_id: atomId,
        stream_id: streamId,
        value: null,
        next_version: { version: this.currentVersion },
        state: "eof",
        error: null,
      };
    }
    if (timeoutMs === 0n) {
      return {
        type: "read_response",
        atom_id: atomId,
        stream_id: streamId,
        value: null,
        next_version: { version: this.currentVersion },
        state: "would_block",
        error: null,
      };
    }
    return null;
  }

  private answerAllHeld(): AtomOutput[] {
    const outputs: AtomOutput[] = [];
    for (const streamId of this.order) {
      const held = this.streams.get(streamId);
      if (held === null || held === undefined) continue;
      const response = this.resolve(held.atomId, streamId, held.version, held.timeoutMs);
      if (response === null) continue;
      if (held.timerToken !== null) {
        outputs.push({ type: "cancel_timer", token: held.timerToken });
      }
      outputs.push(response);
      this.streams.set(streamId, null);
    }
    return outputs;
  }

  private endStream(input: { readonly type: "end_stream" } & AtomEndStream): AtomOutput[] {
    if (!this.streams.has(input.stream_id)) return [];
    const held = this.streams.get(input.stream_id);
    this.streams.delete(input.stream_id);
    const orderIndex = this.order.indexOf(input.stream_id);
    if (orderIndex >= 0) this.order.splice(orderIndex, 1);
    const outputs: AtomOutput[] = [];
    if (held?.timerToken !== null && held?.timerToken !== undefined) {
      outputs.push({ type: "cancel_timer", token: held.timerToken });
    }
    if (this.streams.size === 0 && this.stopWhen === "last_reader") {
      outputs.push({ type: "producer_stop", reason: "last_reader_gone" });
    }
    return outputs;
  }

  private timerExpired(input: { readonly type: "timer_expired" } & AtomTimerExpired): AtomOutput[] {
    for (const [streamId, held] of this.streams) {
      if (held === null || held.timerToken !== input.token) continue;
      this.streams.set(streamId, null);
      const response = this.resolve(held.atomId, streamId, held.version, 0n);
      if (response === null) throw new Error("atom probe unexpectedly held");
      return [response];
    }
    return [];
  }
}
