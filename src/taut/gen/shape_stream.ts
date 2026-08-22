// GENERATED native TypeScript types — do not edit.
// Source: taut-shape/ir/shape_stream.taut.py

export type StreamMsgType = "push" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export type StreamState = "data" | "would_block" | "eof" | "closed" | "failed" | "dropped";
export type StreamErrorCode = "unknown_stream" | "producer_error" | "internal" | "slow_consumer";
export type StreamStopReason = "last_reader_gone" | "closed" | "failed";
export type StreamSeverity = "warn" | "error";
export type StreamDiagCode = "push_after_terminal";

export interface StreamPosition {
  seq: bigint;
}

export interface StreamRecord {
  seq: bigint;
  payload: Uint8Array;
}

export interface StreamError {
  code: StreamErrorCode;
  message: string | null;
}

export interface StreamPush {
  payload: Uint8Array;
}

export interface StreamSeal {
}

export interface StreamClose {
  error: StreamError | null;
}

export interface StreamReadRequest {
  stream_id: string;
  max_records: bigint | null;
  max_bytes: bigint | null;
  timeout_ms: bigint | null;
}

export interface StreamEndStream {
  stream_id: string;
}

export interface StreamTimerExpired {
  token: bigint;
}

export interface StreamReadResponse {
  stream_id: string;
  records: StreamRecord[];
  next_position: StreamPosition;
  state: StreamState;
  error: StreamError | null;
}

export interface StreamSetTimer {
  token: bigint;
  ms: bigint;
}

export interface StreamCancelTimer {
  token: bigint;
}

export interface StreamProducerStop {
  reason: StreamStopReason;
}

export interface StreamDiagnostic {
  severity: StreamSeverity;
  code: StreamDiagCode;
}
