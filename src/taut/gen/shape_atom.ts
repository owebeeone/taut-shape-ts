// GENERATED native TypeScript types — do not edit.
// Source: taut-shape/ir/shape_atom.taut.py
// Regenerate with `tautc gen ... --api-only` and replace this file.

export type AtomMsgType = "replace" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export type AtomState = "data" | "would_block" | "eof" | "closed" | "failed";
export type AtomErrorCode = "unknown_atom" | "producer_error" | "internal";
export type AtomStopReason = "last_reader_gone" | "closed" | "failed";
export type AtomSeverity = "warn" | "error";
export type AtomDiagCode = "replace_after_terminal";

export interface AtomVersion {
  version: bigint;
}

export interface AtomValue {
  version: bigint;
  payload: Uint8Array;
}

export interface AtomError {
  code: AtomErrorCode;
  message: string | null;
}

export interface AtomReplace {
  payload: Uint8Array;
}

export interface AtomSeal {
}

export interface AtomClose {
  error: AtomError | null;
}

export interface AtomReadRequest {
  atom_id: string;
  stream_id: string;
  version: AtomVersion | null;
  timeout_ms: bigint | null;
}

export interface AtomEndStream {
  atom_id: string;
  stream_id: string;
}

export interface AtomTimerExpired {
  token: bigint;
}

export interface AtomReadResponse {
  atom_id: string;
  stream_id: string;
  value: AtomValue | null;
  next_version: AtomVersion;
  state: AtomState;
  error: AtomError | null;
}

export interface AtomSetTimer {
  token: bigint;
  ms: bigint;
}

export interface AtomCancelTimer {
  token: bigint;
}

export interface AtomProducerStop {
  reason: AtomStopReason;
}

export interface AtomDiagnostic {
  severity: AtomSeverity;
  code: AtomDiagCode;
}
