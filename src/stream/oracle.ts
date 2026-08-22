import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_stream.ir.json" with { type: "json" };
import type { StreamInput, StreamOutput } from "./engine.ts";

const SCHEMA = loadSchema(irJson);
const TYPE_TO_MESSAGE: Record<string, string> = {
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

export interface StreamWireMessage {
  type: string;
  [key: string]: unknown;
}

function canonicalize(message: StreamWireMessage): StreamWireMessage {
  const schemaName = TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown stream message ${message.type}`);
  const { type, ...fields } = message;
  return {
    type,
    ...toJsonValue(SCHEMA, schemaName, fromJsonValue(SCHEMA, schemaName, fields)),
  } as StreamWireMessage;
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

function optionalInteger(value: unknown): bigint | null {
  return value === null ? null : BigInt(String(value));
}

export function streamInput(message: StreamWireMessage): StreamInput {
  const m = canonicalize(message);
  switch (m.type) {
    case "push": return { type: "push", payload: decodeBytes(m.payload) };
    case "seal": return { type: "seal" };
    case "close": {
      const error = m.error as Record<string, unknown> | null;
      return {
        type: "close",
        error: error === null ? null : {
          code: String(error.code) as "unknown_stream" | "producer_error" | "internal" | "slow_consumer",
          message: error.message === null ? null : String(error.message),
        },
      };
    }
    case "read":
      return {
        type: "read",
        stream_id: String(m.stream_id),
        max_records: optionalInteger(m.max_records),
        max_bytes: optionalInteger(m.max_bytes),
        timeout_ms: optionalInteger(m.timeout_ms),
      };
    case "end_stream": return { type: "end_stream", stream_id: String(m.stream_id) };
    case "timer_expired": return { type: "timer_expired", token: BigInt(String(m.token)) };
    default: throw new Error(`not a stream input: ${m.type}`);
  }
}

export function streamOutput(output: StreamOutput): StreamWireMessage {
  switch (output.type) {
    case "read_response":
      return canonicalize({
        type: output.type,
        stream_id: output.stream_id,
        records: output.records.map((record) => ({ seq: String(record.seq), payload: encodeBytes(record.payload) })),
        next_position: { seq: String(output.next_position.seq) },
        state: output.state,
        error: output.error,
      });
    case "set_timer": return canonicalize({ type: output.type, token: String(output.token), ms: String(output.ms) });
    case "cancel_timer": return canonicalize({ type: output.type, token: String(output.token) });
    case "producer_stop": return canonicalize({ type: output.type, reason: output.reason });
    case "diagnostic": return canonicalize({ type: output.type, severity: output.severity, code: output.code });
  }
}

export function expectedStreamOutput(message: StreamWireMessage): StreamWireMessage {
  return canonicalize(message);
}
