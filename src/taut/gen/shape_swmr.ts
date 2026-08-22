// GENERATED native TypeScript types — do not edit.
// Source: taut-shape/ir/shape_swmr.taut.py

export type SwmrMsgType = "snapshot_push" | "delta_push" | "reset" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export type SwmrState = "data" | "would_block" | "eof" | "closed" | "failed" | "reset";
export type SwmrErrorCode = "unknown_swmr" | "producer_error" | "internal";
export type SwmrStopReason = "last_reader_gone" | "closed" | "failed";
export type SwmrResetReason = "producer_requested" | "retention_exceeded" | "invalid_resume_seq";
export type SwmrSeverity = "warn" | "error";
export type SwmrDiagCode = "push_after_terminal" | "delta_before_snapshot" | "writer_conflict" | "retention_bound_exceeded";

export interface SwmrCursor {
  seq: bigint;
  epoch: bigint;
}

export interface SwmrSnapshot {
  seq: bigint;
  payload: Uint8Array;
}

export interface SwmrDelta {
  base_seq: bigint;
  seq: bigint;
  payload: Uint8Array;
}

export interface SwmrError {
  code: SwmrErrorCode;
  message: string | null;
}

export interface SwmrSnapshotPush {
  writer_id: string;
  payload: Uint8Array;
}

export interface SwmrDeltaPush {
  writer_id: string;
  payload: Uint8Array;
}

export interface SwmrReset {
  writer_id: string;
  reason: SwmrResetReason;
  detail: Uint8Array | null;
}

export interface SwmrSeal {
}

export interface SwmrClose {
  error: SwmrError | null;
}

export interface SwmrReadRequest {
  swmr_id: string;
  stream_id: string;
  cursor: SwmrCursor | null;
  timeout_ms: bigint | null;
}

export interface SwmrEndStream {
  swmr_id: string;
  stream_id: string;
}

export interface SwmrTimerExpired {
  token: bigint;
}

export interface SwmrReadResponse {
  swmr_id: string;
  stream_id: string;
  snapshot: SwmrSnapshot | null;
  deltas: SwmrDelta[];
  next_cursor: SwmrCursor | null;
  state: SwmrState;
  reset_reason: SwmrResetReason | null;
  error: SwmrError | null;
  reset_detail: Uint8Array | null;
}

export interface SwmrSetTimer {
  token: bigint;
  ms: bigint;
}

export interface SwmrCancelTimer {
  token: bigint;
}

export interface SwmrProducerStop {
  reason: SwmrStopReason;
}

export interface SwmrDiagnostic {
  severity: SwmrSeverity;
  code: SwmrDiagCode;
}
