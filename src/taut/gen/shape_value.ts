// GENERATED native TypeScript types — do not edit.
// Source: taut-shape/ir/shape_value.taut.py
// Schema sha256: 405278e2797ac5f0935b92c40b99a6c87b7edbfa288b640cca45c2c2ce1c3e8c
// Command: PYTHONPATH=../taut/src python3 -m taut.cli gen
//   ir/shape_value.taut.py -o <out> -l typescript --api-only

export type ValueMsgType = "set" | "read" | "read_response" | "diagnostic";
export type ValueState = "data" | "empty";
export type ValueSeverity = "warn" | "error";
export type ValueDiagCode = "equivocation";

export interface ValueStamp {
  origin: string;
  seq: bigint;
  lamport: bigint;
}

export interface ValueSet {
  origin: string;
  seq: bigint;
  lamport: bigint;
  prev: Uint8Array | null;
  payload: Uint8Array;
}

export interface ValueReadRequest {
  value_id: string;
  stream_id: string;
}

export interface ValueReadResponse {
  value_id: string;
  stream_id: string;
  value: Uint8Array | null;
  winner: ValueStamp | null;
  state: ValueState;
}

export interface ValueDiagnostic {
  severity: ValueSeverity;
  code: ValueDiagCode;
}
