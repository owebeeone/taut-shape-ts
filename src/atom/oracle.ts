import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_atom.ir.json" with { type: "json" };
import type { AtomInput, AtomOutput } from "./engine.ts";

const SCHEMA = loadSchema(irJson);
const TYPE_TO_MESSAGE: Record<string, string> = {
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

export interface AtomWireMessage {
  type: string;
  [key: string]: unknown;
}

function canonicalize(message: AtomWireMessage): AtomWireMessage {
  const schemaName = TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown atom message ${message.type}`);
  const { type, ...fields } = message;
  return {
    type,
    ...toJsonValue(SCHEMA, schemaName, fromJsonValue(SCHEMA, schemaName, fields)),
  } as AtomWireMessage;
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

export function atomInput(message: AtomWireMessage): AtomInput {
  const m = canonicalize(message);
  switch (m.type) {
    case "replace":
      return { type: "replace", payload: decodeBytes(m.payload) };
    case "seal":
      return { type: "seal" };
    case "close": {
      const error = m.error as Record<string, unknown> | null;
      return {
        type: "close",
        error: error === null
          ? null
          : { code: String(error.code) as "unknown_atom" | "producer_error" | "internal", message: error.message === null ? null : String(error.message) },
      };
    }
    case "read": {
      const version = m.version as Record<string, unknown> | null;
      return {
        type: "read",
        atom_id: String(m.atom_id),
        stream_id: String(m.stream_id),
        version: version === null ? null : { version: BigInt(String(version.version)) },
        timeout_ms: m.timeout_ms === null ? null : BigInt(String(m.timeout_ms)),
      };
    }
    case "end_stream":
      return { type: "end_stream", atom_id: String(m.atom_id), stream_id: String(m.stream_id) };
    case "timer_expired":
      return { type: "timer_expired", token: BigInt(String(m.token)) };
    default:
      throw new Error(`not an atom input: ${m.type}`);
  }
}

export function atomOutput(output: AtomOutput): AtomWireMessage {
  switch (output.type) {
    case "read_response":
      return canonicalize({
        type: output.type,
        atom_id: output.atom_id,
        stream_id: output.stream_id,
        value: output.value === null
          ? null
          : { version: String(output.value.version), payload: encodeBytes(output.value.payload) },
        next_version: { version: String(output.next_version.version) },
        state: output.state,
        error: output.error,
      });
    case "set_timer":
      return canonicalize({ type: output.type, token: String(output.token), ms: String(output.ms) });
    case "cancel_timer":
      return canonicalize({ type: output.type, token: String(output.token) });
    case "producer_stop":
      return canonicalize({ type: output.type, reason: output.reason });
    case "diagnostic":
      return canonicalize({ type: output.type, severity: output.severity, code: output.code });
  }
}

export function expectedAtomOutput(message: AtomWireMessage): AtomWireMessage {
  return canonicalize(message);
}
