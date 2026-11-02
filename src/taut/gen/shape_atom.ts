// GENERATED TypeScript; typescript-oneof-reference.1; descriptor=1; codec=1; owner=taut.typescript.foundation
import * as _taut from "../../../foundation/cjs/foundation.js";
if (typeof _taut.requireFoundation !== "function") throw new globalThis.Error("compatible TypeScript descriptor/codec foundation required; regenerate/rebind runtime");
_taut.requireFoundation();
export type AtomMsgType = "replace" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export const AtomMsgTypeDescriptor = new _taut.EnumDescriptor("AtomMsgType", "shape_atom.AtomMsgType", {["replace"]:0n,["seal"]:1n,["close"]:2n,["read"]:3n,["end_stream"]:4n,["timer_expired"]:5n,["read_response"]:6n,["set_timer"]:7n,["cancel_timer"]:8n,["producer_stop"]:9n,["diagnostic"]:10n}, {}, {["replace"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}, "b7d2dc3df58aafc972fee368603903c5d9aadc74eee75f2087543f409a78516b");
export type AtomState = "data" | "would_block" | "eof" | "closed" | "failed";
export const AtomStateDescriptor = new _taut.EnumDescriptor("AtomState", "shape_atom.AtomState", {["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n}, {}, {["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{}}, "2287bbfd23d8c141d802a3e28d74a344f71da2740ebdd6b4f4a4a80b81c89f91");
export type AtomErrorCode = "unknown_atom" | "producer_error" | "internal";
export const AtomErrorCodeDescriptor = new _taut.EnumDescriptor("AtomErrorCode", "shape_atom.AtomErrorCode", {["unknown_atom"]:0n,["producer_error"]:1n,["internal"]:2n}, {}, {["unknown_atom"]:{},["producer_error"]:{},["internal"]:{}}, "449381a43adb5fe5b273289a34fda6af5f4441bdbc77d0935ea98b2963f2a3e1");
export type AtomStopReason = "last_reader_gone" | "closed" | "failed";
export const AtomStopReasonDescriptor = new _taut.EnumDescriptor("AtomStopReason", "shape_atom.AtomStopReason", {["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n}, {}, {["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}, "abe31222fc8540e9f24e34385201eef1ea5a14d32cfe0bf87ce975a4626427a4");
export type AtomSeverity = "warn" | "error";
export const AtomSeverityDescriptor = new _taut.EnumDescriptor("AtomSeverity", "shape_atom.AtomSeverity", {["warn"]:0n,["error"]:1n}, {}, {["warn"]:{},["error"]:{}}, "c0487bdea37cb0dd13fdfecabf8a74f4d2dddbea2c6a5a0068c6348e4839449f");
export type AtomDiagCode = "replace_after_terminal";
export const AtomDiagCodeDescriptor = new _taut.EnumDescriptor("AtomDiagCode", "shape_atom.AtomDiagCode", {["replace_after_terminal"]:0n}, {}, {["replace_after_terminal"]:{}}, "2661770826cb1c6f34049a6cca19d441a77faf3e6f0c96e704ea78dec8db0a6f");
export interface AtomVersion {
  version: bigint;
}
export type AtomVersionFields = AtomVersion & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomValue {
  version: bigint;
  payload: globalThis.Uint8Array;
}
export type AtomValueFields = AtomValue & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomError {
  code: AtomErrorCode;
  message: string | null;
}
export type AtomErrorFields = AtomError & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomReplace {
  payload: globalThis.Uint8Array;
}
export type AtomReplaceFields = AtomReplace & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomSeal {
}
export type AtomSealFields = AtomSeal & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomClose {
  error: AtomError | null;
}
export type AtomCloseFields = AtomClose & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomReadRequest {
  atom_id: string;
  stream_id: string;
  version: AtomVersion | null;
  timeout_ms: bigint | null;
}
export type AtomReadRequestFields = AtomReadRequest & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomEndStream {
  atom_id: string;
  stream_id: string;
}
export type AtomEndStreamFields = AtomEndStream & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomTimerExpired {
  token: bigint;
}
export type AtomTimerExpiredFields = AtomTimerExpired & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomReadResponse {
  atom_id: string;
  stream_id: string;
  value: AtomValue | null;
  next_version: AtomVersion;
  state: AtomState;
  error: AtomError | null;
}
export type AtomReadResponseFields = AtomReadResponse & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomSetTimer {
  token: bigint;
  ms: bigint;
}
export type AtomSetTimerFields = AtomSetTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomCancelTimer {
  token: bigint;
}
export type AtomCancelTimerFields = AtomCancelTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomProducerStop {
  reason: AtomStopReason;
}
export type AtomProducerStopFields = AtomProducerStop & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface AtomDiagnostic {
  severity: AtomSeverity;
  code: AtomDiagCode;
}
export type AtomDiagnosticFields = AtomDiagnostic & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export const AtomVersionDescriptor = new _taut.MessageDescriptor("AtomVersion", "shape_atom.AtomVersion", 1, [
  new _taut.FieldDescriptor("version", "version", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "a47662941c2b4ed686ae53c4d6df8a28e2adc42b6fc2ca002558cf2d04691c74");
export const AtomVersionBinding: _taut.MessageBinding<AtomVersion> = new _taut.MessageBinding<AtomVersion>(AtomVersionDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["version"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomVersion => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomValueDescriptor = new _taut.MessageDescriptor("AtomValue", "shape_atom.AtomValue", 1, [
  new _taut.FieldDescriptor("version", "version", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 2, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "12a03c7553ede35a379c029b49246db0877b01962c3e376c0a1bc151ef97e3f8");
export const AtomValueBinding: _taut.MessageBinding<AtomValue> = new _taut.MessageBinding<AtomValue>(AtomValueDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["version"];
    case 1: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomValue => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomErrorDescriptor = new _taut.MessageDescriptor("AtomError", "shape_atom.AtomError", 1, [
  new _taut.FieldDescriptor("code", "code", 1, {kind:"enum", enum:()=>AtomErrorCodeDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("message", "message", 2, {kind:"str"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "185c16562b529b724f103e9c40dcfcd95e2bcd041a88c8de560779b80b406d41");
export const AtomErrorBinding: _taut.MessageBinding<AtomError> = new _taut.MessageBinding<AtomError>(AtomErrorDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["code"];
    case 1: return value["message"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomError => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomReplaceDescriptor = new _taut.MessageDescriptor("AtomReplace", "shape_atom.AtomReplace", 1, [
  new _taut.FieldDescriptor("payload", "payload", 1, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "066fb85e19a8aca451a8f292f48603c5d4951343b8a29bff1a1dbe298ff7f1c5");
export const AtomReplaceBinding: _taut.MessageBinding<AtomReplace> = new _taut.MessageBinding<AtomReplace>(AtomReplaceDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomReplace => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomSealDescriptor = new _taut.MessageDescriptor("AtomSeal", "shape_atom.AtomSeal", 1, [
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "82e20e76420b7e40c51a13ee2e08feaabf46ac42ca7a08221e7c700a916f428e");
export const AtomSealBinding: _taut.MessageBinding<AtomSeal> = new _taut.MessageBinding<AtomSeal>(AtomSealDescriptor, (value, index) => {
  switch(index) {
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomSeal => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomCloseDescriptor = new _taut.MessageDescriptor("AtomClose", "shape_atom.AtomClose", 1, [
  new _taut.FieldDescriptor("error", "error", 1, {kind:"message", binding:()=>AtomErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "37ab456e8ea2c40036f7cf32bf6dd75edca05951cd06f21f92785ed27ae79e94");
export const AtomCloseBinding: _taut.MessageBinding<AtomClose> = new _taut.MessageBinding<AtomClose>(AtomCloseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomClose => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomReadRequestDescriptor = new _taut.MessageDescriptor("AtomReadRequest", "shape_atom.AtomReadRequest", 1, [
  new _taut.FieldDescriptor("atom_id", "atom_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("version", "version", 3, {kind:"message", binding:()=>AtomVersionBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("timeout_ms", "timeout_ms", 4, {kind:"int"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "a2aa9dcaf92b32cb0e584144215136a402d1906ebfd4f2081a807df851c461ca");
export const AtomReadRequestBinding: _taut.MessageBinding<AtomReadRequest> = new _taut.MessageBinding<AtomReadRequest>(AtomReadRequestDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["atom_id"];
    case 1: return value["stream_id"];
    case 2: return value["version"];
    case 3: return value["timeout_ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomReadRequest => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomEndStreamDescriptor = new _taut.MessageDescriptor("AtomEndStream", "shape_atom.AtomEndStream", 1, [
  new _taut.FieldDescriptor("atom_id", "atom_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "284491afd1e710677ddf6bc7ec4a96f319e169b00e19063fbff526488d8b2919");
export const AtomEndStreamBinding: _taut.MessageBinding<AtomEndStream> = new _taut.MessageBinding<AtomEndStream>(AtomEndStreamDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["atom_id"];
    case 1: return value["stream_id"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomEndStream => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomTimerExpiredDescriptor = new _taut.MessageDescriptor("AtomTimerExpired", "shape_atom.AtomTimerExpired", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "c5ceb749e7f3a6ceed800d6e6e1f61cb5188b23a4af71f378a9f837cfb06de03");
export const AtomTimerExpiredBinding: _taut.MessageBinding<AtomTimerExpired> = new _taut.MessageBinding<AtomTimerExpired>(AtomTimerExpiredDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomTimerExpired => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomReadResponseDescriptor = new _taut.MessageDescriptor("AtomReadResponse", "shape_atom.AtomReadResponse", 1, [
  new _taut.FieldDescriptor("atom_id", "atom_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("value", "value", 3, {kind:"message", binding:()=>AtomValueBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("next_version", "next_version", 4, {kind:"message", binding:()=>AtomVersionBinding}, "required", false, false, {}),
  new _taut.FieldDescriptor("state", "state", 5, {kind:"enum", enum:()=>AtomStateDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("error", "error", 6, {kind:"message", binding:()=>AtomErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "d619cff3b97d9276ce5901e3a48e5de97137270c20453a40544f38365866f9c3");
export const AtomReadResponseBinding: _taut.MessageBinding<AtomReadResponse> = new _taut.MessageBinding<AtomReadResponse>(AtomReadResponseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["atom_id"];
    case 1: return value["stream_id"];
    case 2: return value["value"];
    case 3: return value["next_version"];
    case 4: return value["state"];
    case 5: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomReadResponse => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomSetTimerDescriptor = new _taut.MessageDescriptor("AtomSetTimer", "shape_atom.AtomSetTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("ms", "ms", 2, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "7fd5d5bbbc26592c072d34afbca26c94386d57a383ca25b87ac9269f7dd33997");
export const AtomSetTimerBinding: _taut.MessageBinding<AtomSetTimer> = new _taut.MessageBinding<AtomSetTimer>(AtomSetTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    case 1: return value["ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomSetTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomCancelTimerDescriptor = new _taut.MessageDescriptor("AtomCancelTimer", "shape_atom.AtomCancelTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "7d94261997fd0623c7b1b501a4e6ce376f3ccace83d04a725dd34934ef173926");
export const AtomCancelTimerBinding: _taut.MessageBinding<AtomCancelTimer> = new _taut.MessageBinding<AtomCancelTimer>(AtomCancelTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomCancelTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomProducerStopDescriptor = new _taut.MessageDescriptor("AtomProducerStop", "shape_atom.AtomProducerStop", 1, [
  new _taut.FieldDescriptor("reason", "reason", 1, {kind:"enum", enum:()=>AtomStopReasonDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "c2f5497dfde00fadcca793da4103ac7031e8ecf6acf4582ca0a992ed13f891ee");
export const AtomProducerStopBinding: _taut.MessageBinding<AtomProducerStop> = new _taut.MessageBinding<AtomProducerStop>(AtomProducerStopDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["reason"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomProducerStop => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const AtomDiagnosticDescriptor = new _taut.MessageDescriptor("AtomDiagnostic", "shape_atom.AtomDiagnostic", 1, [
  new _taut.FieldDescriptor("severity", "severity", 1, {kind:"enum", enum:()=>AtomSeverityDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("code", "code", 2, {kind:"enum", enum:()=>AtomDiagCodeDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "ecc4f747f14baf803b2ed7a4c40ebeb0c5a3dc92dfabd640f0490abc2ccb3af1");
export const AtomDiagnosticBinding: _taut.MessageBinding<AtomDiagnostic> = new _taut.MessageBinding<AtomDiagnostic>(AtomDiagnosticDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["severity"];
    case 1: return value["code"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is AtomDiagnostic => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SCHEMA_DESCRIPTOR = new _taut.SchemaDescriptor("shape_atom", 2, {["AtomVersion"]:AtomVersionDescriptor,["AtomValue"]:AtomValueDescriptor,["AtomError"]:AtomErrorDescriptor,["AtomReplace"]:AtomReplaceDescriptor,["AtomSeal"]:AtomSealDescriptor,["AtomClose"]:AtomCloseDescriptor,["AtomReadRequest"]:AtomReadRequestDescriptor,["AtomEndStream"]:AtomEndStreamDescriptor,["AtomTimerExpired"]:AtomTimerExpiredDescriptor,["AtomReadResponse"]:AtomReadResponseDescriptor,["AtomSetTimer"]:AtomSetTimerDescriptor,["AtomCancelTimer"]:AtomCancelTimerDescriptor,["AtomProducerStop"]:AtomProducerStopDescriptor,["AtomDiagnostic"]:AtomDiagnosticDescriptor}, {["AtomMsgType"]:AtomMsgTypeDescriptor,["AtomState"]:AtomStateDescriptor,["AtomErrorCode"]:AtomErrorCodeDescriptor,["AtomStopReason"]:AtomStopReasonDescriptor,["AtomSeverity"]:AtomSeverityDescriptor,["AtomDiagCode"]:AtomDiagCodeDescriptor}, {}, {["max_depth"]:32,["max_encoded_len"]:null});
_taut.publish(SCHEMA_DESCRIPTOR, [AtomVersionBinding, AtomValueBinding, AtomErrorBinding, AtomReplaceBinding, AtomSealBinding, AtomCloseBinding, AtomReadRequestBinding, AtomEndStreamBinding, AtomTimerExpiredBinding, AtomReadResponseBinding, AtomSetTimerBinding, AtomCancelTimerBinding, AtomProducerStopBinding, AtomDiagnosticBinding]);
export const CODEC_SCHEMA = new _taut.schema.SchemaIndex({["version"]:2,["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["enums"]:[{["name"]:"AtomMsgType",["options"]:{},["members"]:{["replace"]:0n,["seal"]:1n,["close"]:2n,["read"]:3n,["end_stream"]:4n,["timer_expired"]:5n,["read_response"]:6n,["set_timer"]:7n,["cancel_timer"]:8n,["producer_stop"]:9n,["diagnostic"]:10n},["member_options"]:{["replace"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}},{["name"]:"AtomState",["options"]:{},["members"]:{["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n},["member_options"]:{["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{}}},{["name"]:"AtomErrorCode",["options"]:{},["members"]:{["unknown_atom"]:0n,["producer_error"]:1n,["internal"]:2n},["member_options"]:{["unknown_atom"]:{},["producer_error"]:{},["internal"]:{}}},{["name"]:"AtomStopReason",["options"]:{},["members"]:{["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n},["member_options"]:{["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}},{["name"]:"AtomSeverity",["options"]:{},["members"]:{["warn"]:0n,["error"]:1n},["member_options"]:{["warn"]:{},["error"]:{}}},{["name"]:"AtomDiagCode",["options"]:{},["members"]:{["replace_after_terminal"]:0n},["member_options"]:{["replace_after_terminal"]:{}}}],["messages"]:[{["name"]:"AtomVersion",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"version",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomValue",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"version",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomError",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"code",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"AtomErrorCode"},["optional"]:false,["transient"]:false},{["name"]:"message",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:true,["transient"]:false}]},{["name"]:"AtomReplace",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"payload",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomSeal",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[]},{["name"]:"AtomClose",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"error",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"AtomError"},["optional"]:true,["transient"]:false}]},{["name"]:"AtomReadRequest",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"atom_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"version",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"AtomVersion"},["optional"]:true,["transient"]:false},{["name"]:"timeout_ms",["tag"]:4,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false}]},{["name"]:"AtomEndStream",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"atom_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomTimerExpired",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomReadResponse",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"atom_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"value",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"AtomValue"},["optional"]:true,["transient"]:false},{["name"]:"next_version",["tag"]:4,["options"]:{},["type"]:{["k"]:"msg",["name"]:"AtomVersion"},["optional"]:false,["transient"]:false},{["name"]:"state",["tag"]:5,["options"]:{},["type"]:{["k"]:"enum",["name"]:"AtomState"},["optional"]:false,["transient"]:false},{["name"]:"error",["tag"]:6,["options"]:{},["type"]:{["k"]:"msg",["name"]:"AtomError"},["optional"]:true,["transient"]:false}]},{["name"]:"AtomSetTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"ms",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomCancelTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomProducerStop",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"reason",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"AtomStopReason"},["optional"]:false,["transient"]:false}]},{["name"]:"AtomDiagnostic",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"severity",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"AtomSeverity"},["optional"]:false,["transient"]:false},{["name"]:"code",["tag"]:2,["options"]:{},["type"]:{["k"]:"enum",["name"]:"AtomDiagCode"},["optional"]:false,["transient"]:false}]}],["services"]:[]} as _taut.schema.Schema);
