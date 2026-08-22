import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_swmr.ir.json" with { type: "json" };
import { MessageFrameCodec, type Frame } from "../framing.ts";
import type { SwmrWireMessage } from "./oracle.ts";

export const SWMR_SCHEMA = loadSchema(irJson);
export const SWMR_TYPE_TO_MESSAGE: Readonly<Record<string, string>> = {
  snapshot_push: "SwmrSnapshotPush",
  delta_push: "SwmrDeltaPush",
  reset: "SwmrReset",
  seal: "SwmrSeal",
  close: "SwmrClose",
  read: "SwmrReadRequest",
  end_stream: "SwmrEndStream",
  timer_expired: "SwmrTimerExpired",
  read_response: "SwmrReadResponse",
  set_timer: "SwmrSetTimer",
  cancel_timer: "SwmrCancelTimer",
  producer_stop: "SwmrProducerStop",
  diagnostic: "SwmrDiagnostic",
};
export const SWMR_FRAME_CODEC = new MessageFrameCodec(
  SWMR_SCHEMA,
  "SwmrMsgType",
  SWMR_TYPE_TO_MESSAGE,
);

export function swmrFrameFromJson(message: SwmrWireMessage): Frame {
  const schemaName = SWMR_TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown swmr message ${message.type}`);
  const { type, ...fields } = message;
  return { type, native: fromJsonValue(SWMR_SCHEMA, schemaName, fields) };
}

export function swmrFrameToJson(frame: Frame): SwmrWireMessage {
  const schemaName = SWMR_TYPE_TO_MESSAGE[frame.type];
  if (schemaName === undefined) throw new Error(`unknown swmr frame ${frame.type}`);
  return {
    type: frame.type,
    ...toJsonValue(SWMR_SCHEMA, schemaName, frame.native),
  } as SwmrWireMessage;
}
