// The message vocabulary (shared §3.1–§3.3, D17). HAND-WRITTEN per D17: only the
// LogInput/LogOutput discriminated-union wrappers and the small value types the
// engine needs at its idiomatic surface. The underlying data types are declared
// in taut and generated (src/taut/gen/shape_log.ts); this file layers the
// closed message vocabulary over them.
//
// Naming (§4 conventions): `type` tags and state/reason/code strings are the
// canonical WIRE spellings (snake_case — the LogMsgType/LogState/... enum member
// names, D13); property names are idiomatic camelCase. The oracle loader and CBOR
// service layer own the fixed camelCase<->snake_case field mapping.

import type { LogState, LogErrorCode, LogStopReason, LogSeverity, LogDiagCode } from "./taut/gen/shape_log.ts";

// Re-export the generated state/enum families so consumers import them from the
// public barrel rather than reaching into the generated module.
export type { LogState, LogErrorCode, LogStopReason, LogSeverity, LogDiagCode };

/** An ordered position in one single-origin log. On EVERY response. (D8) */
export interface Cursor {
  readonly seq: number; // records strictly AFTER this seq are unseen
}

/** The start-of-log cursor. First record is seq = 1; empty log head = 0. (D8) */
export const START: Cursor = { seq: 0 };

/** One append. `payload` is the method's append-type message already
 *  taut-encoded (the glade `Op.payload` pattern) — opaque to the log engine. (D11) */
export interface LogRecord {
  readonly seq: number; // assigned by the engine; monotonic from 1 (D8)
  readonly payload: Uint8Array; // the taut-encoded append-type message (D17); opaque here
}

/** Error payload on failed responses / service-level routing. NEVER thrown.
 *  `unknown_log` is service-level only (§4.8); the node engine attaches only
 *  `producer_error`/`internal` to `failed` responses (shared §3.1). */
export interface LogError {
  readonly code: LogErrorCode;
  readonly message?: string;
}

// ── Input messages (shared §3.2) ────────────────────────────────────────────

export type LogInput =
  // Producer-side (node-local, unaddressed)
  | { readonly type: "push"; readonly payload: Uint8Array }
  | { readonly type: "seal" } // idempotent
  | { readonly type: "close"; readonly error?: LogError } // idempotent; error ⇒ failed (D12)
  // Stream-side (addressed by streamId — D3)
  | {
      readonly type: "read";
      readonly streamId: string; // first use implicitly creates the session entry (D4)
      readonly cursor?: Cursor; // absent ⇒ START (D8)
      readonly maxRecords?: number;
      readonly maxBytes?: number; // raw payload bytes only (D10)
      readonly timeoutMs?: number; // absent = hold; 0 = probe; >0 = hold + timer (D14)
    }
  | { readonly type: "end_stream"; readonly streamId: string } // unknown id = no-op (D4)
  // Environment
  | { readonly type: "timer_expired"; readonly token: number } // late/canceled = no-op
  | { readonly type: "evict"; readonly upToSeq: number }; // raises the floor (D7)

// ── Output messages (shared §3.3) ───────────────────────────────────────────

export type LogResponse = {
  readonly type: "read_response"; // addressed (D3)
  readonly streamId: string;
  readonly records: readonly LogRecord[];
  readonly nextCursor: Cursor; // ALWAYS present, even when records is empty
  readonly state: LogState;
  readonly error?: LogError; // attached when state = "failed"
};

export type LogOutput =
  | LogResponse
  | { readonly type: "set_timer"; readonly token: number; readonly ms: number }
  | { readonly type: "cancel_timer"; readonly token: number } // tokens monotonic from 1 (D16)
  | {
      readonly type: "producer_stop"; // on Close, and on ≥1→0 readers under stop_when=last_reader (D6)
      readonly reason: LogStopReason;
    }
  | {
      readonly type: "diagnostic"; // engine warning, code only, no free text (D18)
      readonly severity: LogSeverity;
      readonly code: LogDiagCode; // v0's only case: push_after_terminal (D19)
    };
