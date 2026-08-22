import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_atom.ir.json" with { type: "json" };
import { MessageFrameCodec, type Frame } from "../framing.ts";
import type { AtomWireMessage } from "./oracle.ts";

export const ATOM_SCHEMA = loadSchema(irJson);
export const ATOM_TYPE_TO_MESSAGE: Readonly<Record<string, string>> = {
  replace: "AtomReplace",
  seal: "AtomSeal",
  close: "AtomClose",
  read: "AtomReadRequest",
  end_stream: "AtomEndStream",
  timer_expired: "AtomTimerExpired",
  read_response: "AtomReadResponse",
  set_timer: "AtomSetTimer",
  cancel_timer: "AtomCancelTimer",
  producer_stop: "AtomProducerStop",
  diagnostic: "AtomDiagnostic",
};
export const ATOM_FRAME_CODEC = new MessageFrameCodec(
  ATOM_SCHEMA,
  "AtomMsgType",
  ATOM_TYPE_TO_MESSAGE,
);

export function atomFrameFromJson(message: AtomWireMessage): Frame {
  const schemaName = ATOM_TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown atom message ${message.type}`);
  const { type, ...fields } = message;
  return { type, native: fromJsonValue(ATOM_SCHEMA, schemaName, fields) };
}

export function atomFrameToJson(frame: Frame): AtomWireMessage {
  const schemaName = ATOM_TYPE_TO_MESSAGE[frame.type];
  if (schemaName === undefined) throw new Error(`unknown atom frame ${frame.type}`);
  return {
    type: frame.type,
    ...toJsonValue(ATOM_SCHEMA, schemaName, frame.native),
  } as AtomWireMessage;
}
