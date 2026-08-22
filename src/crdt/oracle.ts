import { loadSchema } from "../taut/schema.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import irJson from "../taut/gen/shape_crdt.ir.json" with { type: "json" };
import type { CrdtInput, CrdtOutput } from "./engine.ts";

const SCHEMA = loadSchema(irJson);
const NAMES: Record<string, string> = { apply: "CrdtApply", install_bootstrap: "CrdtInstallBootstrap", seal: "CrdtSeal", close: "CrdtClose", read: "CrdtReadRequest", read_response: "CrdtReadResponse", diagnostic: "CrdtDiagnostic" };
export interface CrdtWireMessage { type: string; [key: string]: unknown; }
function normalized(message: CrdtWireMessage): CrdtWireMessage {
  const name = NAMES[message.type]; if (name === undefined) throw new Error(`unknown CRDT message ${message.type}`);
  const { type, ...fields } = message;
  return { type, ...toJsonValue(SCHEMA, name, fromJsonValue(SCHEMA, name, fields)) };
}
function bytes(value: unknown): Uint8Array { return Uint8Array.from(atob(String(value)), (char) => char.charCodeAt(0)); }
function b64(value: Uint8Array): string { let binary = ""; for (const byte of value) binary += String.fromCharCode(byte); return btoa(binary); }
function clock(value: unknown) { return { entries: (value as { entries: { origin: unknown; seq: unknown }[] }).entries.map((entry) => ({ origin: String(entry.origin), seq: BigInt(String(entry.seq)) })) }; }
function op(value: unknown) { const row = value as Record<string, unknown>; return { origin: String(row.origin), seq: BigInt(String(row.seq)), deps: clock(row.deps), payload: bytes(row.payload) }; }
function bootstrap(value: unknown) { const row = value as Record<string, unknown>; return { clock: clock(row.clock), state: bytes(row.state) }; }
export function crdtInput(message: CrdtWireMessage): CrdtInput {
  const row = normalized(message);
  switch (row.type) {
    case "apply": return { type: "apply", op: op(row.op) };
    case "install_bootstrap": return { type: "install_bootstrap", bootstrap: bootstrap(row.bootstrap) };
    case "seal": return { type: "seal" };
    case "close": { const error = row.error as null | { code: "unknown_crdt" | "producer_error" | "internal"; message: string | null }; return { type: "close", error }; }
    case "read": return { type: "read", crdt_id: String(row.crdt_id), stream_id: String(row.stream_id), cursor: row.cursor === null ? null : clock(row.cursor) };
    default: throw new Error(`not a CRDT input: ${row.type}`);
  }
}
function clockWire(value: { entries: readonly { origin: string; seq: bigint }[] }) { return { entries: value.entries.map((entry) => ({ origin: entry.origin, seq: String(entry.seq) })) }; }
function opWire(value: { origin: string; seq: bigint; deps: { entries: readonly { origin: string; seq: bigint }[] }; payload: Uint8Array }) { return { origin: value.origin, seq: String(value.seq), deps: clockWire(value.deps), payload: b64(value.payload) }; }
export function crdtOutput(output: CrdtOutput): CrdtWireMessage {
  if (output.type === "diagnostic") return normalized({ type: output.type, severity: output.severity, code: output.code, origin: output.origin, seq: output.seq === null ? null : String(output.seq) });
  return normalized({ type: output.type, crdt_id: output.crdt_id, stream_id: output.stream_id, bootstrap: output.bootstrap === null ? null : { clock: clockWire(output.bootstrap.clock), state: b64(output.bootstrap.state) }, ops: output.ops.map(opWire), next_cursor: clockWire(output.next_cursor), state: output.state, error: output.error });
}
export function canonicalCrdt(message: CrdtWireMessage): CrdtWireMessage { return normalized(message); }
