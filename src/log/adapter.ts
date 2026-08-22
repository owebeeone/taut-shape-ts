/** `log.v0` implementation of the shape-neutral engine adapter contract. */

import {
  type Frame,
  type FrameMessage,
  frameToInput,
  outputToFrameMsg,
  readEcho,
} from "../framing.ts";
import {
  type EngineAdapter,
  type EngineEffect,
  requireEngineShape,
} from "../runtime.ts";
import type { LogInput, LogOutput } from "./messages.ts";
import { LogNode, type LogNodeOptions } from "./node.ts";

export class LogAdapter implements EngineAdapter<Frame, LogInput, LogOutput, FrameMessage> {
  readonly shape = requireEngineShape("log");
  private readonly node: LogNode;
  private readonly streamLogIds = new Map<string, string>();

  constructor(config: LogNodeOptions) {
    this.node = new LogNode(config);
  }

  decodeInput(frame: Frame): LogInput {
    const echo = readEcho(frame);
    if (echo !== undefined) this.streamLogIds.set(echo.streamId, echo.logId);
    return frameToInput(frame);
  }

  dispatch(input: LogInput): readonly LogOutput[] {
    return this.node.handle(input);
  }

  encodeOutput(output: LogOutput): EngineEffect<FrameMessage> {
    const logId = output.type === "read_response"
      ? (this.streamLogIds.get(output.streamId) ?? "")
      : "";
    const frame = outputToFrameMsg(output, logId);
    switch (output.type) {
      case "set_timer":
        return {
          frame,
          timer: { kind: "set", token: output.token, delayMs: output.ms },
        };
      case "cancel_timer":
        return { frame, timer: { kind: "cancel", token: output.token } };
      case "producer_stop":
        return { frame, teardown: { reason: output.reason } };
      default:
        return { frame };
    }
  }

  finish(): readonly LogOutput[] {
    return [];
  }
}
