// GENERATED — DO NOT EDIT (D17).
// Source: taut-shape/ir/shape_log.taut.py
// Produced by: (cd taut-shape && PYTHONPATH=../taut/src python3 -m taut.cli \
//   gen ir/shape_log.taut.py -o <out> -l typescript --api-only)
// Vendored as the types-only api.ts; the wire stays schema-driven via the
// exported shape_log.ir.json + the vendored codec.ts. Never hand-edited.

// GENERATED native TypeScript types — do not edit.

export type LogMsgType = "push" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "evict" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export type LogState = "data" | "would_block" | "eof" | "closed" | "failed" | "expired";
export type LogErrorCode = "unknown_log" | "producer_error" | "internal";
export type LogStopReason = "last_reader_gone" | "closed" | "failed";
export type LogSeverity = "warn" | "error";
export type LogDiagCode = "push_after_terminal";

export interface LogCursor {
  seq: number;
}

export interface LogRecord {
  seq: number;
  payload: Uint8Array;
}

export interface LogError {
  code: LogErrorCode;
  message: string | null;
}

export interface LogPush {
  payload: Uint8Array;
}

export interface LogSeal {
}

export interface LogClose {
  error: LogError | null;
}

export interface LogReadRequest {
  log_id: string;
  stream_id: string;
  cursor: LogCursor | null;
  max_records: number | null;
  max_bytes: number | null;
  timeout_ms: number | null;
}

export interface LogEndStream {
  log_id: string;
  stream_id: string;
}

export interface LogTimerExpired {
  token: number;
}

export interface LogEvict {
  up_to_seq: number;
}

export interface LogReadResponse {
  log_id: string;
  stream_id: string;
  records: LogRecord[];
  next_cursor: LogCursor;
  state: LogState;
  error: LogError | null;
}

export interface LogSetTimer {
  token: number;
  ms: number;
}

export interface LogCancelTimer {
  token: number;
}

export interface LogProducerStop {
  reason: LogStopReason;
}

export interface LogDiagnostic {
  severity: LogSeverity;
  code: LogDiagCode;
}

