// The stdin/stdout data channel: length-prefixed, tagged CBOR frames (S4.1).
// Byte-for-byte identical to taut-shape-rs `crates/taut-shape-tool/src/framing.rs`
// — that rs node mode is the shared reference. One frame on the wire is:
//
//   ┌────────────────┬──────────┬───────────────────────────┐
//   │ u32-LE length  │ tag byte │ CBOR body (`length-1` B)   │
//   └────────────────┴──────────┴───────────────────────────┘
//         4 bytes        1 byte           length-1 bytes
//
//   * length — u32-LE byte count of the tag byte PLUS the CBOR body (min 1).
//   * tag    — the selected shape's message-type enum value as a single byte.
//   * body   — the message's deterministic CBOR (vendored codec over the schema).
//
// A truncated tail (partial length or body at EOF) is tolerated: read returns a
// clean EOF, so a peer that dies mid-frame drains rather than errors. An unknown
// tag or undecodable body is a protocol error (the CLI maps it to exit 3).
//
// This module also owns the framing-concern conversions (rs node.rs S4.2): the
// generated wire structs are `snake_case`, `log_id`/`stream_id`-addressed; the
// engine's LogInput/LogOutput use idiomatic camelCase §A.1 core types. Native
// values here follow the vendored codec convention (ints = bigint, bytes =
// Uint8Array, enums = member-name strings, absent optional = null).

import { decode as cborDecode, encode as cborEncode } from "./taut/cbor.ts";
import * as codec from "./taut/codec.ts";
import { loadSchema, type SchemaIndex } from "./taut/schema.ts";
import { fromJsonValue, toJsonValue } from "./taut/jsoncodec.ts";
import irJson from "./taut/gen/shape_log.ir.json" with { type: "json" };
import type { Cursor, LogError, LogInput, LogOutput } from "./log/messages.ts";

export const SCHEMA: SchemaIndex = loadSchema(irJson);

/** `type` tag string (== LogMsgType member) -> schema message name (rs uses the
 *  generated struct directly; here the codec is name-driven). */
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
type Native = any;

/** A decoded frame: the message kind (its wire tag member-name) and native body. */
export interface Frame {
  readonly type: string; // LogMsgType member-name
  readonly native: Native; // the codec-decoded wire struct
}

/** An encoded message before its frame header and CBOR bytes are written. */
export interface FrameMessage {
  readonly type: string;
  readonly native: Native;
}

/** A selected shape's schema, message names, and one-byte tag registry. */
export class MessageFrameCodec {
  readonly schema: SchemaIndex;
  readonly typeToMessage: Readonly<Record<string, string>>;
  private readonly tag: Readonly<Record<string, number>>;
  private readonly tagInverse: Readonly<Record<number, string>>;

  constructor(
    schema: SchemaIndex,
    messageTypeEnum: string,
    typeToMessage: Readonly<Record<string, string>>,
  ) {
    this.schema = schema;
    this.typeToMessage = typeToMessage;
    this.tag = schema.enumDef(messageTypeEnum).members;
    this.tagInverse = Object.fromEntries(
      Object.entries(this.tag).map(([name, value]) => [value, name]),
    );
  }

  decode(tag: number, body: Uint8Array): Frame {
    const type = this.tagInverse[tag];
    if (type === undefined) throw new UnknownMessageTagError(tag);
    const message = this.typeToMessage[type];
    if (message === undefined) throw new UnknownMessageTagError(tag);
    try {
      return { type, native: codec.decode(this.schema, message, body) };
    } catch (error) {
      throw new FrameError(`malformed frame body: ${(error as Error).message}`);
    }
  }

  encode(type: string, native: Native): { readonly tag: number; readonly body: Uint8Array } {
    const tag = this.tag[type];
    const message = this.typeToMessage[type];
    if (tag === undefined || message === undefined) {
      throw new FrameError(`unknown message type ${type}`);
    }
    return { tag, body: codec.encode(this.schema, message, native) };
  }
}

export const LOG_FRAME_CODEC = new MessageFrameCodec(SCHEMA, "LogMsgType", TYPE_TO_MSG);

/** A malformed frame (unknown tag or undecodable body). Distinguished from a
 *  clean EOF so the caller can map it to exit 3 while EOF is exit 0. */
export class FrameError extends Error {
  readonly code: string;

  constructor(message: string, code = "TAUT_SHAPE_MALFORMED_MESSAGE") {
    super(message);
    this.name = "FrameError";
    this.code = code;
  }
}

export class UnknownMessageTagError extends FrameError {
  readonly tag: number;

  constructor(tag: number) {
    super(`unknown frame tag byte ${tag}`, "TAUT_SHAPE_UNKNOWN_TAG");
    this.name = "UnknownMessageTagError";
    this.tag = tag;
  }
}

// ── frame read/write over byte streams ───────────────────────────────────────

/** Reader over an in-memory byte queue fed incrementally from a stream. Frames
 *  arrive split across chunks, so we buffer and yield whole frames only. */
export class FrameDecoder {
  private buf: Uint8Array = new Uint8Array(0);
  private readonly frameCodec: MessageFrameCodec;

  constructor(frameCodec: MessageFrameCodec = LOG_FRAME_CODEC) {
    this.frameCodec = frameCodec;
  }

  /** Append a chunk. Returns the frames now fully available, in order. Throws
   *  FrameError on an unknown tag / undecodable body (caller => exit 3). */
  push(chunk: Uint8Array): Frame[] {
    const merged = new Uint8Array(this.buf.length + chunk.length);
    merged.set(this.buf, 0);
    merged.set(chunk, this.buf.length);
    this.buf = merged;
    const out: Frame[] = [];
    for (;;) {
      if (this.buf.length < 4) break; // incomplete length prefix
      const len =
        this.buf[0]! | (this.buf[1]! << 8) | (this.buf[2]! << 16) | (this.buf[3]! << 24);
      const total = 4 + len;
      if (len < 1) throw new FrameError(`bad frame length ${len} (min 1 for the tag byte)`);
      if (this.buf.length < total) break; // body not fully arrived yet
      const tagByte = this.buf[4]!;
      const body = this.buf.subarray(5, total);
      out.push(this.frameCodec.decode(tagByte, body));
      this.buf = this.buf.subarray(total);
    }
    return out;
  }

  /** Any bytes left after the last whole frame (a truncated tail at EOF is
   *  tolerated — the pump just exits 0). */
  get pending(): number {
    return this.buf.length;
  }
}

/** Encode one wire message (type + native body) into a full frame's bytes. */
export function encodeFrame(
  type: string,
  native: Native,
  frameCodec: MessageFrameCodec = LOG_FRAME_CODEC,
): Uint8Array {
  const { tag, body } = frameCodec.encode(type, native);
  const frame = new Uint8Array(4 + 1 + body.length);
  const len = body.length + 1; // tag byte + body
  frame[0] = len & 0xff;
  frame[1] = (len >>> 8) & 0xff;
  frame[2] = (len >>> 16) & 0xff;
  frame[3] = (len >>> 24) & 0xff;
  frame[4] = tag;
  frame.set(body, 5);
  return frame;
}

// ── native wire struct <-> engine LogInput (rs node.rs decode_input) ─────────

function cursorFrom(jv: Native): Cursor | undefined {
  return jv === null || jv === undefined ? undefined : { seq: Number(jv.seq) };
}
function optNum(jv: Native): number | undefined {
  return jv === null || jv === undefined ? undefined : Number(jv);
}
function errorFrom(jv: Native): LogError | undefined {
  if (jv === null || jv === undefined) return undefined;
  const message = jv.message === null || jv.message === undefined ? undefined : String(jv.message);
  return message === undefined ? { code: jv.code } : { code: jv.code, message };
}

/** The `log_id`/`stream_id` a Read frame carries, echoed back onto its response
 *  (rs node.rs `ReadEcho` — D3: log_id is a framing-layer echo the engine never
 *  sees). */
export interface ReadEcho {
  readonly logId: string;
  readonly streamId: string;
}

/** Extract the echo pair from a frame — only Read carries them. */
export function readEcho(frame: Frame): ReadEcho | undefined {
  if (frame.type !== "read") return undefined;
  return { logId: String(frame.native.log_id ?? ""), streamId: String(frame.native.stream_id) };
}

/** Native wire struct -> engine LogInput. Throws on an output-only tag arriving
 *  on the input side (rs => exit 3). */
export function frameToInput(frame: Frame): LogInput {
  const m = frame.native;
  switch (frame.type) {
    case "push":
      return { type: "push", payload: m.payload as Uint8Array };
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
      throw new FrameError(`output-only tag ${frame.type} on the input channel`);
  }
}

// ── engine LogOutput -> native wire struct (rs node.rs encode_output) ────────

/** Engine LogOutput -> `{ type, native }`. `logId` is re-attached to responses
 *  from the per-stream echo map (D3). */
export function outputToFrameMsg(out: LogOutput, logId: string): FrameMessage {
  switch (out.type) {
    case "read_response":
      return {
        type: "read_response",
        native: {
          log_id: logId,
          stream_id: out.streamId,
          records: out.records.map((r) => ({ seq: r.seq, payload: r.payload })),
          next_cursor: { seq: out.nextCursor.seq },
          state: out.state,
          error: out.error === undefined ? null : { code: out.error.code, message: out.error.message ?? null },
        },
      };
    case "set_timer":
      return { type: "set_timer", native: { token: out.token, ms: out.ms } };
    case "cancel_timer":
      return { type: "cancel_timer", native: { token: out.token } };
    case "producer_stop":
      return { type: "producer_stop", native: { reason: out.reason } };
    case "diagnostic":
      return { type: "diagnostic", native: { severity: out.severity, code: out.code } };
  }
}

// ── OOB transcript: jsoncodec form (§4 conventions, one JSON object per line) ─

/** Native wire struct -> canonical jsoncodec-form object (i64-as-string, base64
 *  bytes, enum names, absent-optional == null), `type`-tagged. This is the exact
 *  form the corpus stores and the interop driver compares. */
export function toTranscriptJson(type: string, native: Native): Record<string, unknown> {
  const jv = toJsonValue(SCHEMA, TYPE_TO_MSG[type]!, native);
  return { type, ...jv };
}

/** jsoncodec-form object (from a --script file) -> native wire struct, so it can
 *  be framed and fed to the engine identically to a decoded frame. */
export function fromTranscriptJson(msg: Record<string, unknown>): Frame {
  const type = String(msg.type);
  const name = TYPE_TO_MSG[type];
  if (name === undefined) throw new FrameError(`unknown message type ${type}`);
  const { type: _t, ...rest } = msg;
  const native = fromJsonValue(SCHEMA, name, rest);
  return { type, native };
}

// ── raw CBOR helpers (re-exported for symmetry / potential reuse) ────────────

export { cborDecode, cborEncode };
