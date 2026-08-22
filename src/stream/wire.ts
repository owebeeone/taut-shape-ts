import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_stream.ir.json" with { type: "json" };
import { MessageFrameCodec, type Frame } from "../framing.ts";
import type { StreamWireMessage } from "./oracle.ts";

export const STREAM_SCHEMA = loadSchema(irJson);
export const STREAM_TYPE_TO_MESSAGE: Readonly<Record<string, string>> = {
  push: "StreamPush",
  seal: "StreamSeal",
  close: "StreamClose",
  read: "StreamReadRequest",
  end_stream: "StreamEndStream",
  timer_expired: "StreamTimerExpired",
  read_response: "StreamReadResponse",
  set_timer: "StreamSetTimer",
  cancel_timer: "StreamCancelTimer",
  producer_stop: "StreamProducerStop",
  diagnostic: "StreamDiagnostic",
};
export const STREAM_FRAME_CODEC = new MessageFrameCodec(
  STREAM_SCHEMA,
  "StreamMsgType",
  STREAM_TYPE_TO_MESSAGE,
);

export function streamFrameFromJson(message: StreamWireMessage): Frame {
  const schemaName = STREAM_TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown stream message ${message.type}`);
  const { type, ...fields } = message;
  return { type, native: fromJsonValue(STREAM_SCHEMA, schemaName, fields) };
}

export function streamFrameToJson(frame: Frame): StreamWireMessage {
  const schemaName = STREAM_TYPE_TO_MESSAGE[frame.type];
  if (schemaName === undefined) throw new Error(`unknown stream frame ${frame.type}`);
  return {
    type: frame.type,
    ...toJsonValue(STREAM_SCHEMA, schemaName, frame.native),
  } as StreamWireMessage;
}
