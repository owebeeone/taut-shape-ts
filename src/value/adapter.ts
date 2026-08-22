import { FrameError, type Frame } from "../framing.ts";
import type { EngineAdapter, EngineEffect } from "../runtime.ts";
import { ValueNode, type ValueInput, type ValueOutput } from "./engine.ts";

function integer(value: unknown): bigint {
  return BigInt(String(value));
}

export class ValueAdapter implements EngineAdapter<Frame, ValueInput, ValueOutput, Frame> {
  readonly shape = "value";
  private readonly node = new ValueNode();

  decodeInput(frame: Frame): ValueInput {
    const message = frame.native as Record<string, unknown>;
    if (frame.type === "set") {
      return {
        type: "set",
        origin: String(message.origin),
        seq: integer(message.seq),
        lamport: integer(message.lamport),
        prev: message.prev === null ? null : message.prev as Uint8Array,
        payload: message.payload as Uint8Array,
      };
    }
    if (frame.type === "read") {
      return {
        type: "read",
        value_id: String(message.value_id),
        stream_id: String(message.stream_id),
      };
    }
    throw new FrameError(`output-only tag ${frame.type} on the value input channel`);
  }

  dispatch(input: ValueInput): readonly ValueOutput[] {
    return this.node.handle(input);
  }

  encodeOutput(output: ValueOutput): EngineEffect<Frame> {
    if (output.type === "diagnostic") {
      return {
        frame: {
          type: output.type,
          native: { severity: output.severity, code: output.code },
        },
      };
    }
    return {
      frame: {
        type: output.type,
        native: {
          value_id: output.value_id,
          stream_id: output.stream_id,
          value: output.value,
          winner: output.winner === null
            ? null
            : {
                origin: output.winner.origin,
                seq: output.winner.seq,
                lamport: output.winner.lamport,
              },
          state: output.state,
        },
      },
    };
  }

  finish(): readonly ValueOutput[] {
    return [];
  }
}
