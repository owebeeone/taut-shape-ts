// GENERATED native TypeScript types — do not edit.
// Source: taut-shape/ir/shape_crdt.taut.py

export type CrdtMsgType = "apply" | "install_bootstrap" | "seal" | "close" | "read" | "read_response" | "diagnostic";
export type CrdtState = "data" | "empty" | "eof" | "closed" | "failed" | "bootstrap_required" | "invalid_cursor";
export type CrdtErrorCode = "unknown_crdt" | "producer_error" | "internal";
export type CrdtSeverity = "warn" | "error";
export type CrdtDiagCode = "apply_after_terminal" | "invalid_operation" | "equivocation" | "bootstrap_conflict" | "pending_bound_exceeded";

export interface CrdtClockEntry {
  origin: string;
  seq: bigint;
}

export interface CrdtClock {
  entries: CrdtClockEntry[];
}

export interface CrdtOp {
  origin: string;
  seq: bigint;
  deps: CrdtClock;
  payload: Uint8Array;
}

export interface CrdtBootstrap {
  clock: CrdtClock;
  state: Uint8Array;
}

export interface CrdtError {
  code: CrdtErrorCode;
  message: string | null;
}

export interface CrdtApply {
  op: CrdtOp;
}

export interface CrdtInstallBootstrap {
  bootstrap: CrdtBootstrap;
}

export interface CrdtSeal {
}

export interface CrdtClose {
  error: CrdtError | null;
}

export interface CrdtReadRequest {
  crdt_id: string;
  stream_id: string;
  cursor: CrdtClock | null;
}

export interface CrdtReadResponse {
  crdt_id: string;
  stream_id: string;
  bootstrap: CrdtBootstrap | null;
  ops: CrdtOp[];
  next_cursor: CrdtClock;
  state: CrdtState;
  error: CrdtError | null;
}

export interface CrdtDiagnostic {
  severity: CrdtSeverity;
  code: CrdtDiagCode;
  origin: string | null;
  seq: bigint | null;
}
