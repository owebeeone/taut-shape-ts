import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_value.ir.json" with { type: "json" };
import type { ValueInput, ValueOutput } from "./engine.ts";

const SCHEMA = loadSchema(irJson);
const TYPE_TO_MESSAGE: Record<string, string> = {
  set: "ValueSet",
  read: "ValueReadRequest",
  read_response: "ValueReadResponse",
  diagnostic: "ValueDiagnostic",
};

export interface ValueWireMessage {
  type: string;
  [key: string]: unknown;
}

function canonicalize(message: ValueWireMessage): ValueWireMessage {
  const schemaName = TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown value message ${message.type}`);
  const { type, ...fields } = message;
  return {
    type,
    ...toJsonValue(SCHEMA, schemaName, fromJsonValue(SCHEMA, schemaName, fields)),
  } as ValueWireMessage;
}

function decodeBytes(value: unknown): Uint8Array {
  const binary = atob(String(value));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBytes(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function valueInput(message: ValueWireMessage): ValueInput {
  const normalized = canonicalize(message);
  if (normalized.type === "set") {
    return {
      type: "set",
      origin: String(normalized.origin),
      seq: BigInt(String(normalized.seq)),
      lamport: BigInt(String(normalized.lamport)),
      prev: normalized.prev === null ? null : decodeBytes(normalized.prev),
      payload: decodeBytes(normalized.payload),
    };
  }
  if (normalized.type === "read") {
    return {
      type: "read",
      value_id: String(normalized.value_id),
      stream_id: String(normalized.stream_id),
    };
  }
  throw new Error(`not a value input: ${normalized.type}`);
}

export function valueOutput(output: ValueOutput): ValueWireMessage {
  if (output.type === "diagnostic") {
    return canonicalize({
      type: output.type,
      severity: output.severity,
      code: output.code,
    });
  }
  return canonicalize({
    type: output.type,
    value_id: output.value_id,
    stream_id: output.stream_id,
    value: output.value === null ? null : encodeBytes(output.value),
    winner: output.winner === null
      ? null
      : {
          origin: output.winner.origin,
          seq: String(output.winner.seq),
          lamport: String(output.winner.lamport),
        },
    state: output.state,
  });
}

export function expectedValueOutput(message: ValueWireMessage): ValueWireMessage {
  return canonicalize(message);
}
