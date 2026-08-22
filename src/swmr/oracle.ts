import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_swmr.ir.json" with { type: "json" };
import type { SwmrInput, SwmrOutput } from "./engine.ts";

const SCHEMA = loadSchema(irJson);
const TYPE_TO_MESSAGE: Record<string, string> = {
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

export interface SwmrWireMessage {
  type: string;
  [key: string]: unknown;
}

function canonicalize(message: SwmrWireMessage): SwmrWireMessage {
  const schemaName = TYPE_TO_MESSAGE[message.type];
  if (schemaName === undefined) throw new Error(`unknown swmr message ${message.type}`);
  const { type, ...fields } = message;
  return {
    type,
    ...toJsonValue(SCHEMA, schemaName, fromJsonValue(SCHEMA, schemaName, fields)),
  } as SwmrWireMessage;
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

function cursor(value: unknown): { seq: bigint; epoch: bigint } | null {
  if (value === null) return null;
  const native = value as Record<string, unknown>;
  return { seq: BigInt(String(native.seq)), epoch: BigInt(String(native.epoch)) };
}

function error(value: unknown): { code: "unknown_swmr" | "producer_error" | "internal"; message: string | null } | null {
  if (value === null) return null;
  const native = value as Record<string, unknown>;
  return {
    code: String(native.code) as "unknown_swmr" | "producer_error" | "internal",
    message: native.message === null ? null : String(native.message),
  };
}

export function swmrInput(message: SwmrWireMessage): SwmrInput {
  const m = canonicalize(message);
  switch (m.type) {
    case "snapshot_push": return { type: m.type, writer_id: String(m.writer_id), payload: decodeBytes(m.payload) };
    case "delta_push": return { type: m.type, writer_id: String(m.writer_id), payload: decodeBytes(m.payload) };
    case "reset": return {
      type: m.type,
      writer_id: String(m.writer_id),
      reason: String(m.reason) as "producer_requested" | "retention_exceeded" | "invalid_resume_seq",
      detail: m.detail === null ? null : decodeBytes(m.detail),
    };
    case "seal": return { type: m.type };
    case "close": return { type: m.type, error: error(m.error) };
    case "read": return {
      type: m.type,
      swmr_id: String(m.swmr_id),
      stream_id: String(m.stream_id),
      cursor: cursor(m.cursor),
      timeout_ms: m.timeout_ms === null ? null : BigInt(String(m.timeout_ms)),
    };
    case "end_stream": return { type: m.type, swmr_id: String(m.swmr_id), stream_id: String(m.stream_id) };
    case "timer_expired": return { type: m.type, token: BigInt(String(m.token)) };
    default: throw new Error(`not a swmr input: ${m.type}`);
  }
}

export function swmrOutput(output: SwmrOutput): SwmrWireMessage {
  switch (output.type) {
    case "read_response":
      return canonicalize({
        type: output.type,
        swmr_id: output.swmr_id,
        stream_id: output.stream_id,
        snapshot: output.snapshot === null
          ? null
          : { seq: String(output.snapshot.seq), payload: encodeBytes(output.snapshot.payload) },
        deltas: output.deltas.map((delta) => ({
          base_seq: String(delta.base_seq),
          seq: String(delta.seq),
          payload: encodeBytes(delta.payload),
        })),
        next_cursor: output.next_cursor === null
          ? null
          : { seq: String(output.next_cursor.seq), epoch: String(output.next_cursor.epoch) },
        state: output.state,
        reset_reason: output.reset_reason,
        error: output.error,
        reset_detail: output.reset_detail === null ? null : encodeBytes(output.reset_detail),
      });
    case "set_timer": return canonicalize({ type: output.type, token: String(output.token), ms: String(output.ms) });
    case "cancel_timer": return canonicalize({ type: output.type, token: String(output.token) });
    case "producer_stop": return canonicalize({ type: output.type, reason: output.reason });
    case "diagnostic": return canonicalize({ type: output.type, severity: output.severity, code: output.code });
  }
}

export function expectedSwmrOutput(message: SwmrWireMessage): SwmrWireMessage {
  return canonicalize(message);
}
