import { FrameError, type Frame } from "../framing.ts";
import type { EngineAdapter, EngineEffect } from "../runtime.ts";
import { requireEngineShape } from "../runtime.ts";
import { SwmrNode, type SwmrInput, type SwmrNodeOptions, type SwmrOutput } from "./engine.ts";

const INPUT_TYPES = new Set([
  "snapshot_push",
  "delta_push",
  "reset",
  "seal",
  "close",
  "read",
  "end_stream",
  "timer_expired",
]);

export class SwmrAdapter implements EngineAdapter<Frame, SwmrInput, SwmrOutput, Frame> {
  readonly shape = requireEngineShape("swmr");
  private readonly node: SwmrNode;

  constructor(options: SwmrNodeOptions = {}) {
    this.node = new SwmrNode(options);
  }

  decodeInput(frame: Frame): SwmrInput {
    if (!INPUT_TYPES.has(frame.type)) {
      throw new FrameError(`output-only tag ${frame.type} on the swmr input channel`);
    }
    return { type: frame.type, ...(frame.native as Record<string, unknown>) } as SwmrInput;
  }

  dispatch(input: SwmrInput): readonly SwmrOutput[] {
    return this.node.handle(input);
  }

  encodeOutput(output: SwmrOutput): EngineEffect<Frame> {
    const { type, ...native } = output;
    const frame = { type, native };
    switch (output.type) {
      case "set_timer": return { frame, timer: { kind: "set", token: output.token, delayMs: output.ms } };
      case "cancel_timer": return { frame, timer: { kind: "cancel", token: output.token } };
      case "producer_stop": return { frame, teardown: { reason: output.reason } };
      default: return { frame };
    }
  }

  finish(): readonly SwmrOutput[] {
    return [];
  }
}
