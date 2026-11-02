// GENERATED TypeScript; typescript-oneof-reference.1; descriptor=1; codec=1; owner=taut.typescript.foundation
import * as _taut from "../../../foundation/cjs/foundation.js";
if (typeof _taut.requireFoundation !== "function") throw new globalThis.Error("compatible TypeScript descriptor/codec foundation required; regenerate/rebind runtime");
if (!_taut.Foundation || typeof _taut.Foundation !== "object" || _taut.Foundation.owner !== "taut.typescript.foundation" || _taut.Foundation.descriptorContract !== 1 || _taut.Foundation.codecContract !== 1 || !globalThis.Array.isArray(_taut.Foundation.capabilities) || ["codec.v1", "descriptors.v1", "oneof.v1"].some(c => !_taut.Foundation.capabilities.includes(c))) throw new globalThis.Error("selected TypeScript foundation lacks a valid owner token (incompatible owner/contracts); regenerate/rebind owner");
if (_taut.requireFoundation(_taut) !== _taut.Foundation) throw new _taut.ConfigurationError("selected TypeScript foundation lacks namespace-checked guard support; regenerate/rebind owner");
export type CrdtMsgType = "apply" | "install_bootstrap" | "seal" | "close" | "read" | "read_response" | "diagnostic";
export const CrdtMsgTypeDescriptor = new _taut.EnumDescriptor("CrdtMsgType", "shape_crdt.CrdtMsgType", {["apply"]:0n,["install_bootstrap"]:1n,["seal"]:2n,["close"]:3n,["read"]:4n,["read_response"]:5n,["diagnostic"]:6n}, {}, {["apply"]:{},["install_bootstrap"]:{},["seal"]:{},["close"]:{},["read"]:{},["read_response"]:{},["diagnostic"]:{}}, "9fe1d2722430b703fd7a56b44270714eca18f773bbbe01b2801aadacf3fe4fce");
export type CrdtState = "data" | "empty" | "eof" | "closed" | "failed" | "bootstrap_required" | "invalid_cursor";
export const CrdtStateDescriptor = new _taut.EnumDescriptor("CrdtState", "shape_crdt.CrdtState", {["data"]:0n,["empty"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["bootstrap_required"]:5n,["invalid_cursor"]:6n}, {}, {["data"]:{},["empty"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["bootstrap_required"]:{},["invalid_cursor"]:{}}, "30fde9df83a7463cc74f9dc09539e1b8dab34c0945cdd77b7a4fa8349394b0ac");
export type CrdtErrorCode = "unknown_crdt" | "producer_error" | "internal";
export const CrdtErrorCodeDescriptor = new _taut.EnumDescriptor("CrdtErrorCode", "shape_crdt.CrdtErrorCode", {["unknown_crdt"]:0n,["producer_error"]:1n,["internal"]:2n}, {}, {["unknown_crdt"]:{},["producer_error"]:{},["internal"]:{}}, "86a4f236cb87eb83061bb4f4f2458fde7e619c4925df13789bb5bbb2a866b1eb");
export type CrdtSeverity = "warn" | "error";
export const CrdtSeverityDescriptor = new _taut.EnumDescriptor("CrdtSeverity", "shape_crdt.CrdtSeverity", {["warn"]:0n,["error"]:1n}, {}, {["warn"]:{},["error"]:{}}, "dbb2960a58391603244a6ed756472b29787f69d6c8864f25845e3baae77d531e");
export type CrdtDiagCode = "apply_after_terminal" | "invalid_operation" | "equivocation" | "bootstrap_conflict" | "pending_bound_exceeded";
export const CrdtDiagCodeDescriptor = new _taut.EnumDescriptor("CrdtDiagCode", "shape_crdt.CrdtDiagCode", {["apply_after_terminal"]:0n,["invalid_operation"]:1n,["equivocation"]:2n,["bootstrap_conflict"]:3n,["pending_bound_exceeded"]:4n}, {}, {["apply_after_terminal"]:{},["invalid_operation"]:{},["equivocation"]:{},["bootstrap_conflict"]:{},["pending_bound_exceeded"]:{}}, "0f82455aed77b504987a8186dfcaad9a0ed86d0c102acd1f6247bc5e18c9e99e");
export interface CrdtClockEntry {
  origin: string;
  seq: bigint;
}
export type CrdtClockEntryFields = CrdtClockEntry & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtClock {
  entries: globalThis.Array<CrdtClockEntry>;
}
export type CrdtClockFields = CrdtClock & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtOp {
  origin: string;
  seq: bigint;
  deps: CrdtClock;
  payload: globalThis.Uint8Array;
}
export type CrdtOpFields = CrdtOp & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtBootstrap {
  clock: CrdtClock;
  state: globalThis.Uint8Array;
}
export type CrdtBootstrapFields = CrdtBootstrap & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtError {
  code: CrdtErrorCode;
  message: string | null;
}
export type CrdtErrorFields = CrdtError & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtApply {
  op: CrdtOp;
}
export type CrdtApplyFields = CrdtApply & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtInstallBootstrap {
  bootstrap: CrdtBootstrap;
}
export type CrdtInstallBootstrapFields = CrdtInstallBootstrap & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtSeal {
}
export type CrdtSealFields = CrdtSeal & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtClose {
  error: CrdtError | null;
}
export type CrdtCloseFields = CrdtClose & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtReadRequest {
  crdt_id: string;
  stream_id: string;
  cursor: CrdtClock | null;
}
export type CrdtReadRequestFields = CrdtReadRequest & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtReadResponse {
  crdt_id: string;
  stream_id: string;
  bootstrap: CrdtBootstrap | null;
  ops: globalThis.Array<CrdtOp>;
  next_cursor: CrdtClock;
  state: CrdtState;
  error: CrdtError | null;
}
export type CrdtReadResponseFields = CrdtReadResponse & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface CrdtDiagnostic {
  severity: CrdtSeverity;
  code: CrdtDiagCode;
  origin: string | null;
  seq: bigint | null;
}
export type CrdtDiagnosticFields = CrdtDiagnostic & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export const CrdtClockEntryDescriptor = new _taut.MessageDescriptor("CrdtClockEntry", "shape_crdt.CrdtClockEntry", 1, [
  new _taut.FieldDescriptor("origin", "origin", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("seq", "seq", 2, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "255f029eeed1e7e3162575e1afaef52c1b2aa523907d4e95c0ec176107ca0722");
export const CrdtClockEntryBinding: _taut.MessageBinding<CrdtClockEntry> = new _taut.MessageBinding<CrdtClockEntry>(CrdtClockEntryDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["origin"];
    case 1: return value["seq"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtClockEntry => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtClockDescriptor = new _taut.MessageDescriptor("CrdtClock", "shape_crdt.CrdtClock", 1, [
  new _taut.FieldDescriptor("entries", "entries", 1, {kind:"list", element:{kind:"message", binding:()=>CrdtClockEntryBinding}}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "c1b42b93f39cd7f666d644fd3a66fd0f4af9a14b3377d83a5b897abd0889c258");
export const CrdtClockBinding: _taut.MessageBinding<CrdtClock> = new _taut.MessageBinding<CrdtClock>(CrdtClockDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["entries"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtClock => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtOpDescriptor = new _taut.MessageDescriptor("CrdtOp", "shape_crdt.CrdtOp", 1, [
  new _taut.FieldDescriptor("origin", "origin", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("seq", "seq", 2, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("deps", "deps", 3, {kind:"message", binding:()=>CrdtClockBinding}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 4, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "a44136efbc7419bebd1a376453b8619ed45bbaed0c34acb4eed3e00922af9884");
export const CrdtOpBinding: _taut.MessageBinding<CrdtOp> = new _taut.MessageBinding<CrdtOp>(CrdtOpDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["origin"];
    case 1: return value["seq"];
    case 2: return value["deps"];
    case 3: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtOp => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtBootstrapDescriptor = new _taut.MessageDescriptor("CrdtBootstrap", "shape_crdt.CrdtBootstrap", 1, [
  new _taut.FieldDescriptor("clock", "clock", 1, {kind:"message", binding:()=>CrdtClockBinding}, "required", false, false, {}),
  new _taut.FieldDescriptor("state", "state", 2, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "4bee875db19a19e6acf8653cb21cb4b8dc95ba4ae8ef89e7bc5d82e1d4fef43d");
export const CrdtBootstrapBinding: _taut.MessageBinding<CrdtBootstrap> = new _taut.MessageBinding<CrdtBootstrap>(CrdtBootstrapDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["clock"];
    case 1: return value["state"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtBootstrap => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtErrorDescriptor = new _taut.MessageDescriptor("CrdtError", "shape_crdt.CrdtError", 1, [
  new _taut.FieldDescriptor("code", "code", 1, {kind:"enum", enum:()=>CrdtErrorCodeDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("message", "message", 2, {kind:"str"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "5ae23da83305f829500fa0fd6e298d1124dda1f86258bf94737d8edbe191fea7");
export const CrdtErrorBinding: _taut.MessageBinding<CrdtError> = new _taut.MessageBinding<CrdtError>(CrdtErrorDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["code"];
    case 1: return value["message"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtError => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtApplyDescriptor = new _taut.MessageDescriptor("CrdtApply", "shape_crdt.CrdtApply", 1, [
  new _taut.FieldDescriptor("op", "op", 1, {kind:"message", binding:()=>CrdtOpBinding}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "3f45278ef05289105019fa6ac3c01c4600e9b19a25b403cf19ef6a8ce9bed5ba");
export const CrdtApplyBinding: _taut.MessageBinding<CrdtApply> = new _taut.MessageBinding<CrdtApply>(CrdtApplyDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["op"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtApply => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtInstallBootstrapDescriptor = new _taut.MessageDescriptor("CrdtInstallBootstrap", "shape_crdt.CrdtInstallBootstrap", 1, [
  new _taut.FieldDescriptor("bootstrap", "bootstrap", 1, {kind:"message", binding:()=>CrdtBootstrapBinding}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "ffe0f4d232ba5107f1e49504732560ed5daa51bffea1af38d69730d9cf9a1b0f");
export const CrdtInstallBootstrapBinding: _taut.MessageBinding<CrdtInstallBootstrap> = new _taut.MessageBinding<CrdtInstallBootstrap>(CrdtInstallBootstrapDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["bootstrap"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtInstallBootstrap => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtSealDescriptor = new _taut.MessageDescriptor("CrdtSeal", "shape_crdt.CrdtSeal", 1, [
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "82501a6c88ace49f6ab500825c8023136a6261a3aab0cff24dddd5bd95d66920");
export const CrdtSealBinding: _taut.MessageBinding<CrdtSeal> = new _taut.MessageBinding<CrdtSeal>(CrdtSealDescriptor, (value, index) => {
  switch(index) {
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtSeal => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtCloseDescriptor = new _taut.MessageDescriptor("CrdtClose", "shape_crdt.CrdtClose", 1, [
  new _taut.FieldDescriptor("error", "error", 1, {kind:"message", binding:()=>CrdtErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "87e8460dcb1b369b21ca3e614a0b7d88a09677207d577453205d12ac06b0623a");
export const CrdtCloseBinding: _taut.MessageBinding<CrdtClose> = new _taut.MessageBinding<CrdtClose>(CrdtCloseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtClose => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtReadRequestDescriptor = new _taut.MessageDescriptor("CrdtReadRequest", "shape_crdt.CrdtReadRequest", 1, [
  new _taut.FieldDescriptor("crdt_id", "crdt_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("cursor", "cursor", 3, {kind:"message", binding:()=>CrdtClockBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "632e8671a825a9a7ab531d774a68c840deca97bd2a9d7d72b014b59b64e97d55");
export const CrdtReadRequestBinding: _taut.MessageBinding<CrdtReadRequest> = new _taut.MessageBinding<CrdtReadRequest>(CrdtReadRequestDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["crdt_id"];
    case 1: return value["stream_id"];
    case 2: return value["cursor"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtReadRequest => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtReadResponseDescriptor = new _taut.MessageDescriptor("CrdtReadResponse", "shape_crdt.CrdtReadResponse", 1, [
  new _taut.FieldDescriptor("crdt_id", "crdt_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("bootstrap", "bootstrap", 3, {kind:"message", binding:()=>CrdtBootstrapBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("ops", "ops", 4, {kind:"list", element:{kind:"message", binding:()=>CrdtOpBinding}}, "required", false, false, {}),
  new _taut.FieldDescriptor("next_cursor", "next_cursor", 5, {kind:"message", binding:()=>CrdtClockBinding}, "required", false, false, {}),
  new _taut.FieldDescriptor("state", "state", 6, {kind:"enum", enum:()=>CrdtStateDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("error", "error", 7, {kind:"message", binding:()=>CrdtErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "3aa33cfc9ed6d81f31a13cbb87e05c566301285465234163506166aad06c10fa");
export const CrdtReadResponseBinding: _taut.MessageBinding<CrdtReadResponse> = new _taut.MessageBinding<CrdtReadResponse>(CrdtReadResponseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["crdt_id"];
    case 1: return value["stream_id"];
    case 2: return value["bootstrap"];
    case 3: return value["ops"];
    case 4: return value["next_cursor"];
    case 5: return value["state"];
    case 6: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtReadResponse => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const CrdtDiagnosticDescriptor = new _taut.MessageDescriptor("CrdtDiagnostic", "shape_crdt.CrdtDiagnostic", 1, [
  new _taut.FieldDescriptor("severity", "severity", 1, {kind:"enum", enum:()=>CrdtSeverityDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("code", "code", 2, {kind:"enum", enum:()=>CrdtDiagCodeDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("origin", "origin", 3, {kind:"str"}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("seq", "seq", 4, {kind:"int"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "14a8d855b1fe6e01bb67fbc3236edead3351dd5fa429a40e59270da8c1ed247d");
export const CrdtDiagnosticBinding: _taut.MessageBinding<CrdtDiagnostic> = new _taut.MessageBinding<CrdtDiagnostic>(CrdtDiagnosticDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["severity"];
    case 1: return value["code"];
    case 2: return value["origin"];
    case 3: return value["seq"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is CrdtDiagnostic => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SCHEMA_DESCRIPTOR = new _taut.SchemaDescriptor("shape_crdt", 2, {["CrdtClockEntry"]:CrdtClockEntryDescriptor,["CrdtClock"]:CrdtClockDescriptor,["CrdtOp"]:CrdtOpDescriptor,["CrdtBootstrap"]:CrdtBootstrapDescriptor,["CrdtError"]:CrdtErrorDescriptor,["CrdtApply"]:CrdtApplyDescriptor,["CrdtInstallBootstrap"]:CrdtInstallBootstrapDescriptor,["CrdtSeal"]:CrdtSealDescriptor,["CrdtClose"]:CrdtCloseDescriptor,["CrdtReadRequest"]:CrdtReadRequestDescriptor,["CrdtReadResponse"]:CrdtReadResponseDescriptor,["CrdtDiagnostic"]:CrdtDiagnosticDescriptor}, {["CrdtMsgType"]:CrdtMsgTypeDescriptor,["CrdtState"]:CrdtStateDescriptor,["CrdtErrorCode"]:CrdtErrorCodeDescriptor,["CrdtSeverity"]:CrdtSeverityDescriptor,["CrdtDiagCode"]:CrdtDiagCodeDescriptor}, {}, {["max_depth"]:32,["max_encoded_len"]:null});
_taut.publish(SCHEMA_DESCRIPTOR, [CrdtClockEntryBinding, CrdtClockBinding, CrdtOpBinding, CrdtBootstrapBinding, CrdtErrorBinding, CrdtApplyBinding, CrdtInstallBootstrapBinding, CrdtSealBinding, CrdtCloseBinding, CrdtReadRequestBinding, CrdtReadResponseBinding, CrdtDiagnosticBinding]);
export const CODEC_SCHEMA = new _taut.schema.SchemaIndex({["version"]:2,["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["enums"]:[{["name"]:"CrdtMsgType",["options"]:{},["members"]:{["apply"]:0n,["install_bootstrap"]:1n,["seal"]:2n,["close"]:3n,["read"]:4n,["read_response"]:5n,["diagnostic"]:6n},["member_options"]:{["apply"]:{},["install_bootstrap"]:{},["seal"]:{},["close"]:{},["read"]:{},["read_response"]:{},["diagnostic"]:{}}},{["name"]:"CrdtState",["options"]:{},["members"]:{["data"]:0n,["empty"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["bootstrap_required"]:5n,["invalid_cursor"]:6n},["member_options"]:{["data"]:{},["empty"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["bootstrap_required"]:{},["invalid_cursor"]:{}}},{["name"]:"CrdtErrorCode",["options"]:{},["members"]:{["unknown_crdt"]:0n,["producer_error"]:1n,["internal"]:2n},["member_options"]:{["unknown_crdt"]:{},["producer_error"]:{},["internal"]:{}}},{["name"]:"CrdtSeverity",["options"]:{},["members"]:{["warn"]:0n,["error"]:1n},["member_options"]:{["warn"]:{},["error"]:{}}},{["name"]:"CrdtDiagCode",["options"]:{},["members"]:{["apply_after_terminal"]:0n,["invalid_operation"]:1n,["equivocation"]:2n,["bootstrap_conflict"]:3n,["pending_bound_exceeded"]:4n},["member_options"]:{["apply_after_terminal"]:{},["invalid_operation"]:{},["equivocation"]:{},["bootstrap_conflict"]:{},["pending_bound_exceeded"]:{}}}],["messages"]:[{["name"]:"CrdtClockEntry",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"origin",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"seq",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"CrdtClock",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"entries",["tag"]:1,["options"]:{},["type"]:{["k"]:"list",["elem"]:{["k"]:"msg",["name"]:"CrdtClockEntry"}},["optional"]:false,["transient"]:false}]},{["name"]:"CrdtOp",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"origin",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"seq",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"deps",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtClock"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:4,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"CrdtBootstrap",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"clock",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtClock"},["optional"]:false,["transient"]:false},{["name"]:"state",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"CrdtError",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"code",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"CrdtErrorCode"},["optional"]:false,["transient"]:false},{["name"]:"message",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:true,["transient"]:false}]},{["name"]:"CrdtApply",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"op",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtOp"},["optional"]:false,["transient"]:false}]},{["name"]:"CrdtInstallBootstrap",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"bootstrap",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtBootstrap"},["optional"]:false,["transient"]:false}]},{["name"]:"CrdtSeal",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[]},{["name"]:"CrdtClose",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"error",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtError"},["optional"]:true,["transient"]:false}]},{["name"]:"CrdtReadRequest",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"crdt_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"cursor",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtClock"},["optional"]:true,["transient"]:false}]},{["name"]:"CrdtReadResponse",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"crdt_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"bootstrap",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtBootstrap"},["optional"]:true,["transient"]:false},{["name"]:"ops",["tag"]:4,["options"]:{},["type"]:{["k"]:"list",["elem"]:{["k"]:"msg",["name"]:"CrdtOp"}},["optional"]:false,["transient"]:false},{["name"]:"next_cursor",["tag"]:5,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtClock"},["optional"]:false,["transient"]:false},{["name"]:"state",["tag"]:6,["options"]:{},["type"]:{["k"]:"enum",["name"]:"CrdtState"},["optional"]:false,["transient"]:false},{["name"]:"error",["tag"]:7,["options"]:{},["type"]:{["k"]:"msg",["name"]:"CrdtError"},["optional"]:true,["transient"]:false}]},{["name"]:"CrdtDiagnostic",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"severity",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"CrdtSeverity"},["optional"]:false,["transient"]:false},{["name"]:"code",["tag"]:2,["options"]:{},["type"]:{["k"]:"enum",["name"]:"CrdtDiagCode"},["optional"]:false,["transient"]:false},{["name"]:"origin",["tag"]:3,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:true,["transient"]:false},{["name"]:"seq",["tag"]:4,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false}]}],["services"]:[]} as _taut.schema.Schema);
