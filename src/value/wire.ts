import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_value.ir.json" with { type: "json" };
import { MessageFrameCodec, type Frame } from "../framing.ts";
import type { ValueWireMessage } from "./oracle.ts";

export const VALUE_SCHEMA = loadSchema(irJson);
export const VALUE_TYPE_TO_MESSAGE: Readonly<Record<string, string>> = {
  set: "ValueSet",
  read: "ValueReadRequest",
  read_response: "ValueReadResponse",
  diagnostic: "ValueDiagnostic",
};
export const VALUE_FRAME_CODEC = new MessageFrameCodec(
  VALUE_SCHEMA,
  "ValueMsgType",
  VALUE_TYPE_TO_MESSAGE,
);

export function valueFrameFromJson(message: ValueWireMessage): Frame {
  const schemaName = VALUE_TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown value message ${message.type}`);
  const { type, ...fields } = message;
  return {
    type,
    native: fromJsonValue(VALUE_SCHEMA, schemaName, fields),
  };
}

export function valueFrameToJson(frame: Frame): ValueWireMessage {
  const schemaName = VALUE_TYPE_TO_MESSAGE[frame.type];
  if (schemaName === undefined) throw new Error(`unknown value frame ${frame.type}`);
  return {
    type: frame.type,
    ...toJsonValue(VALUE_SCHEMA, schemaName, frame.native),
  } as ValueWireMessage;
}
