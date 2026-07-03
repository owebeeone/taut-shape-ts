// Oracle-vector loader (Phase 2, §4 conventions). Parses the committed taut-shape
// corpus — pure (input message sequence) -> (expected output message sequence)
// pairs in jsoncodec form (`type`-tagged, snake_case fields, i64-as-string,
// base64 bytes, enum names, absent-optional == null) — into the engine's
// idiomatic LogInput/LogOutput values, and normalizes engine outputs back into
// that same jsoncodec form for whole-output equality.
//
// The `type` discriminator is the LogMsgType enum member name, mapping 1:1 to a
// schema message name (mirrors corpus/gen.py `_TYPE`). Normalization runs BOTH
// sides through the vendored jsoncodec so the comparison is against the canonical
// wire projection, never against JS object identity or field order.

import { loadSchema, type SchemaIndex } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import type { Cursor, LogError, LogInput, LogOutput } from "./messages.ts";
import irJson from "../taut/gen/shape_log.ir.json" with { type: "json" };

export const SCHEMA: SchemaIndex = loadSchema(irJson);

/** `type` discriminator (== LogMsgType member name) -> schema message name.
 *  Mirrors corpus/gen.py `_TYPE` (dropping the wire tag byte — irrelevant to the
 *  JSON-vector path). */
const TYPE_TO_MSG: Record<string, string> = {
  push: "LogPush",
  seal: "LogSeal",
  close: "LogClose",
  read: "LogReadRequest",
  end_stream: "LogEndStream",
  timer_expired: "LogTimerExpired",
  evict: "LogEvict",
  read_response: "LogReadResponse",
  set_timer: "LogSetTimer",
  cancel_timer: "LogCancelTimer",
  producer_stop: "LogProducerStop",
  diagnostic: "LogDiagnostic",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** Canonical jsoncodec form of a message: the `type`-tagged, JSON-safe object the
 *  corpus stores and gen.py round-trips. Both expected and observed outputs are
 *  reduced to this before comparison. */
export interface WireMsg {
  type: string;
  [k: string]: Json;
}

/** Round-trip a jsoncodec-form message through the schema (from_json_value ->
 *  to_json_value), producing the canonical projection. Idempotent for any value
 *  the schema fully describes; this is what makes both sides comparable
 *  regardless of key order or which optionals were spelled out. */
function canonicalize(msg: WireMsg): WireMsg {
  const name = TYPE_TO_MSG[msg.type];
  if (name === undefined) throw new Error(`unknown message type ${msg.type}`);
  const { type: _t, ...rest } = msg;
  const native = fromJsonValue(SCHEMA, name, rest);
  const jv = toJsonValue(SCHEMA, name, native);
  return { type: msg.type, ...jv };
}

// ── vector types ────────────────────────────────────────────────────────────

export interface Vector {
  readonly name: string;
  readonly comment?: string;
  readonly node: { readonly stop_when: string };
  readonly steps: readonly { readonly in: WireMsg; readonly out: readonly WireMsg[] }[];
}

export interface Corpus {
  readonly shape: string;
  readonly version: string;
  readonly vectors: readonly Vector[];
}

// ── jsoncodec (wire) form -> engine LogInput ─────────────────────────────────

function cursorFrom(jv: Json): Cursor | undefined {
  if (jv === null || jv === undefined) return undefined;
  return { seq: Number(jv.seq) };
}

function optNum(jv: Json): number | undefined {
  return jv === null || jv === undefined ? undefined : Number(jv);
}

function errorFrom(jv: Json): LogError | undefined {
  if (jv === null || jv === undefined) return undefined;
  const message = jv.message === null || jv.message === undefined ? undefined : String(jv.message);
  return message === undefined ? { code: jv.code } : { code: jv.code, message };
}

/** Convert one jsoncodec-form input message into the engine's LogInput.
 *  `log_id` is service-level (stripped here — the engine is per-log). */
export function toInput(msg: WireMsg): LogInput {
  const m = canonicalize(msg);
  switch (m.type) {
    case "push":
      return { type: "push", payload: base64ToBytes(m.payload) };
    case "seal":
      return { type: "seal" };
    case "close": {
      const error = errorFrom(m.error);
      return error === undefined ? { type: "close" } : { type: "close", error };
    }
    case "read": {
      const cursor = cursorFrom(m.cursor);
      const maxRecords = optNum(m.max_records);
      const maxBytes = optNum(m.max_bytes);
      const timeoutMs = optNum(m.timeout_ms);
      const read: {
        type: "read";
        streamId: string;
        cursor?: Cursor;
        maxRecords?: number;
        maxBytes?: number;
        timeoutMs?: number;
      } = { type: "read", streamId: String(m.stream_id) };
      if (cursor !== undefined) read.cursor = cursor;
      if (maxRecords !== undefined) read.maxRecords = maxRecords;
      if (maxBytes !== undefined) read.maxBytes = maxBytes;
      if (timeoutMs !== undefined) read.timeoutMs = timeoutMs;
      return read;
    }
    case "end_stream":
      return { type: "end_stream", streamId: String(m.stream_id) };
    case "timer_expired":
      return { type: "timer_expired", token: Number(m.token) };
    case "evict":
      return { type: "evict", upToSeq: Number(m.up_to_seq) };
    default:
      throw new Error(`not an input message type: ${m.type}`);
  }
}

function base64ToBytes(s: string): Uint8Array {
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64(b: Uint8Array): string {
  let binary = "";
  for (const byte of b) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// ── engine LogOutput -> jsoncodec (wire) form ────────────────────────────────

/** Convert one engine LogOutput back into canonical jsoncodec form for
 *  comparison. `logId` (service-level) is re-attached to responses so the shape
 *  matches the corpus, which carries it. */
export function fromOutput(out: LogOutput, logId: string): WireMsg {
  let raw: WireMsg;
  switch (out.type) {
    case "read_response":
      raw = {
        type: "read_response",
        log_id: logId,
        stream_id: out.streamId,
        records: out.records.map((r) => ({ seq: String(r.seq), payload: bytesToBase64(r.payload) })),
        next_cursor: { seq: String(out.nextCursor.seq) },
        state: out.state,
        error:
          out.error === undefined
            ? null
            : { code: out.error.code, message: out.error.message ?? null },
      };
      break;
    case "set_timer":
      raw = { type: "set_timer", token: String(out.token), ms: String(out.ms) };
      break;
    case "cancel_timer":
      raw = { type: "cancel_timer", token: String(out.token) };
      break;
    case "producer_stop":
      raw = { type: "producer_stop", reason: out.reason };
      break;
    case "diagnostic":
      raw = { type: "diagnostic", severity: out.severity, code: out.code };
      break;
  }
  return canonicalize(raw);
}

/** Canonicalize a corpus-supplied expected output (already jsoncodec form). */
export function expectedOutput(msg: WireMsg): WireMsg {
  return canonicalize(msg);
}

/** Load the committed corpus JSON (already parsed) into typed vectors. */
export function loadCorpus(json: unknown): Corpus {
  return json as Corpus;
}

/** The log_id a vector operates on (all v0 vectors are single-log). Falls back to
 *  the first log_id seen on any input/output, defaulting to "log-A". */
export function vectorLogId(v: Vector): string {
  for (const step of v.steps) {
    if (typeof step.in.log_id === "string") return step.in.log_id;
    for (const o of step.out) if (typeof o.log_id === "string") return o.log_id;
  }
  return "log-A";
}
