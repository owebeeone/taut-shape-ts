import { FrameError, type Frame } from "../framing.ts";
import type { EngineAdapter, EngineEffect } from "../runtime.ts";
import { requireEngineShape } from "../runtime.ts";
import { AtomNode, type AtomInput, type AtomNodeOptions, type AtomOutput } from "./engine.ts";

const INPUT_TYPES = new Set(["replace", "seal", "close", "read", "end_stream", "timer_expired"]);

export class AtomAdapter implements EngineAdapter<Frame, AtomInput, AtomOutput, Frame> {
  readonly shape = requireEngineShape("atom");
  private readonly node: AtomNode;

  constructor(options: AtomNodeOptions = {}) {
    this.node = new AtomNode(options);
  }

  decodeInput(frame: Frame): AtomInput {
    if (!INPUT_TYPES.has(frame.type)) {
      throw new FrameError(`output-only tag ${frame.type} on the atom input channel`);
    }
    return { type: frame.type, ...(frame.native as Record<string, unknown>) } as AtomInput;
  }

  dispatch(input: AtomInput): readonly AtomOutput[] {
    return this.node.handle(input);
  }

  encodeOutput(output: AtomOutput): EngineEffect<Frame> {
    const { type, ...native } = output;
    const frame = { type, native };
    switch (output.type) {
      case "set_timer":
        return { frame, timer: { kind: "set", token: output.token, delayMs: output.ms } };
      case "cancel_timer":
        return { frame, timer: { kind: "cancel", token: output.token } };
      case "producer_stop":
        return { frame, teardown: { reason: output.reason } };
      default:
        return { frame };
    }
  }

  finish(): readonly AtomOutput[] {
    return [];
  }
}
