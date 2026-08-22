import { FrameError, type Frame } from "../framing.ts";
import type { EngineAdapter, EngineEffect } from "../runtime.ts";
import { requireEngineShape } from "../runtime.ts";
import { StreamNode, type StreamInput, type StreamNodeOptions, type StreamOutput } from "./engine.ts";

const INPUT_TYPES = new Set(["push", "seal", "close", "read", "end_stream", "timer_expired"]);

export class StreamAdapter implements EngineAdapter<Frame, StreamInput, StreamOutput, Frame> {
  readonly shape = requireEngineShape("stream");
  private readonly node: StreamNode;

  constructor(options: StreamNodeOptions = {}) {
    this.node = new StreamNode(options);
  }

  decodeInput(frame: Frame): StreamInput {
    if (!INPUT_TYPES.has(frame.type)) {
      throw new FrameError(`output-only tag ${frame.type} on the stream input channel`);
    }
    return { type: frame.type, ...(frame.native as Record<string, unknown>) } as StreamInput;
  }

  dispatch(input: StreamInput): readonly StreamOutput[] {
    return this.node.handle(input);
  }

  encodeOutput(output: StreamOutput): EngineEffect<Frame> {
    const { type, ...native } = output;
    const frame = { type, native };
    switch (output.type) {
      case "set_timer": return { frame, timer: { kind: "set", token: output.token, delayMs: output.ms } };
      case "cancel_timer": return { frame, timer: { kind: "cancel", token: output.token } };
      case "producer_stop": return { frame, teardown: { reason: output.reason } };
      default: return { frame };
    }
  }

  finish(): readonly StreamOutput[] {
    return [];
  }
}
