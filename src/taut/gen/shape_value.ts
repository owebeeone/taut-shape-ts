// GENERATED TypeScript; typescript-oneof-reference.1; descriptor=1; codec=1; owner=taut.typescript.foundation
import * as _taut from "../../../foundation/cjs/foundation.js";
if (typeof _taut.requireFoundation !== "function") throw new globalThis.Error("compatible TypeScript descriptor/codec foundation required; regenerate/rebind runtime");
_taut.requireFoundation();
export type ValueMsgType = "set" | "read" | "read_response" | "diagnostic";
export const ValueMsgTypeDescriptor = new _taut.EnumDescriptor("ValueMsgType", "shape_value.ValueMsgType", {["set"]:0n,["read"]:1n,["read_response"]:2n,["diagnostic"]:3n}, {}, {["set"]:{},["read"]:{},["read_response"]:{},["diagnostic"]:{}}, "f7368136bca27637724b0f4fc36b0491ded8a628190c3032ac8bdb79702cc0bd");
export type ValueState = "data" | "empty";
export const ValueStateDescriptor = new _taut.EnumDescriptor("ValueState", "shape_value.ValueState", {["data"]:0n,["empty"]:1n}, {}, {["data"]:{},["empty"]:{}}, "0c667731fce4692a0ca8bcc72c40dd1538c550882e82e929233dc1e033be646a");
export type ValueSeverity = "warn" | "error";
export const ValueSeverityDescriptor = new _taut.EnumDescriptor("ValueSeverity", "shape_value.ValueSeverity", {["warn"]:0n,["error"]:1n}, {}, {["warn"]:{},["error"]:{}}, "21afca5ad2523212e5b875d07d3bdae736c77484f8c5449537ba3d112d128505");
export type ValueDiagCode = "equivocation";
export const ValueDiagCodeDescriptor = new _taut.EnumDescriptor("ValueDiagCode", "shape_value.ValueDiagCode", {["equivocation"]:0n}, {}, {["equivocation"]:{}}, "3e74d7fc07c0364e768d1f95cf25958a7ef2d3bd8b98bf8098dc21235f4d1dc2");
export interface ValueStamp {
  origin: string;
  seq: bigint;
  lamport: bigint;
}
export type ValueStampFields = ValueStamp & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface ValueSet {
  origin: string;
  seq: bigint;
  lamport: bigint;
  prev: globalThis.Uint8Array | null;
  payload: globalThis.Uint8Array;
}
export type ValueSetFields = ValueSet & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface ValueReadRequest {
  value_id: string;
  stream_id: string;
}
export type ValueReadRequestFields = ValueReadRequest & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface ValueReadResponse {
  value_id: string;
  stream_id: string;
  value: globalThis.Uint8Array | null;
  winner: ValueStamp | null;
  state: ValueState;
}
export type ValueReadResponseFields = ValueReadResponse & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface ValueDiagnostic {
  severity: ValueSeverity;
  code: ValueDiagCode;
}
export type ValueDiagnosticFields = ValueDiagnostic & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export const ValueStampDescriptor = new _taut.MessageDescriptor("ValueStamp", "shape_value.ValueStamp", 1, [
  new _taut.FieldDescriptor("origin", "origin", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("seq", "seq", 2, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("lamport", "lamport", 3, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "bf86d750dc6ae0dd1844bd56b3f0a9dda25babaf59d23429f01899ed1ea0c91d");
export const ValueStampBinding: _taut.MessageBinding<ValueStamp> = new _taut.MessageBinding<ValueStamp>(ValueStampDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["origin"];
    case 1: return value["seq"];
    case 2: return value["lamport"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is ValueStamp => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const ValueSetDescriptor = new _taut.MessageDescriptor("ValueSet", "shape_value.ValueSet", 1, [
  new _taut.FieldDescriptor("origin", "origin", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("seq", "seq", 2, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("lamport", "lamport", 3, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("prev", "prev", 4, {kind:"bytes"}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 5, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "c74dfb7102153408203fc8057234ee99057b28aa5f2ea66638a2c037290059d9");
export const ValueSetBinding: _taut.MessageBinding<ValueSet> = new _taut.MessageBinding<ValueSet>(ValueSetDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["origin"];
    case 1: return value["seq"];
    case 2: return value["lamport"];
    case 3: return value["prev"];
    case 4: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is ValueSet => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const ValueReadRequestDescriptor = new _taut.MessageDescriptor("ValueReadRequest", "shape_value.ValueReadRequest", 1, [
  new _taut.FieldDescriptor("value_id", "value_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "011f83c38b73a64296c755087faf61983e297636ce58e3640417c590e98186d7");
export const ValueReadRequestBinding: _taut.MessageBinding<ValueReadRequest> = new _taut.MessageBinding<ValueReadRequest>(ValueReadRequestDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["value_id"];
    case 1: return value["stream_id"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is ValueReadRequest => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const ValueReadResponseDescriptor = new _taut.MessageDescriptor("ValueReadResponse", "shape_value.ValueReadResponse", 1, [
  new _taut.FieldDescriptor("value_id", "value_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("value", "value", 3, {kind:"bytes"}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("winner", "winner", 4, {kind:"message", binding:()=>ValueStampBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("state", "state", 5, {kind:"enum", enum:()=>ValueStateDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "236e8cadb4fea8c9a00d88113ad10abf226b2c9997232a122628d65e782b0254");
export const ValueReadResponseBinding: _taut.MessageBinding<ValueReadResponse> = new _taut.MessageBinding<ValueReadResponse>(ValueReadResponseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["value_id"];
    case 1: return value["stream_id"];
    case 2: return value["value"];
    case 3: return value["winner"];
    case 4: return value["state"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is ValueReadResponse => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const ValueDiagnosticDescriptor = new _taut.MessageDescriptor("ValueDiagnostic", "shape_value.ValueDiagnostic", 1, [
  new _taut.FieldDescriptor("severity", "severity", 1, {kind:"enum", enum:()=>ValueSeverityDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("code", "code", 2, {kind:"enum", enum:()=>ValueDiagCodeDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "67d22fcd095b2a0c12353ef9bc765c790326395efd0228f635e1678af62d51b4");
export const ValueDiagnosticBinding: _taut.MessageBinding<ValueDiagnostic> = new _taut.MessageBinding<ValueDiagnostic>(ValueDiagnosticDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["severity"];
    case 1: return value["code"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is ValueDiagnostic => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SCHEMA_DESCRIPTOR = new _taut.SchemaDescriptor("shape_value", 2, {["ValueStamp"]:ValueStampDescriptor,["ValueSet"]:ValueSetDescriptor,["ValueReadRequest"]:ValueReadRequestDescriptor,["ValueReadResponse"]:ValueReadResponseDescriptor,["ValueDiagnostic"]:ValueDiagnosticDescriptor}, {["ValueMsgType"]:ValueMsgTypeDescriptor,["ValueState"]:ValueStateDescriptor,["ValueSeverity"]:ValueSeverityDescriptor,["ValueDiagCode"]:ValueDiagCodeDescriptor}, {}, {["max_depth"]:32,["max_encoded_len"]:null});
_taut.publish(SCHEMA_DESCRIPTOR, [ValueStampBinding, ValueSetBinding, ValueReadRequestBinding, ValueReadResponseBinding, ValueDiagnosticBinding]);
export const CODEC_SCHEMA = new _taut.schema.SchemaIndex({["version"]:2,["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["enums"]:[{["name"]:"ValueMsgType",["options"]:{},["members"]:{["set"]:0n,["read"]:1n,["read_response"]:2n,["diagnostic"]:3n},["member_options"]:{["set"]:{},["read"]:{},["read_response"]:{},["diagnostic"]:{}}},{["name"]:"ValueState",["options"]:{},["members"]:{["data"]:0n,["empty"]:1n},["member_options"]:{["data"]:{},["empty"]:{}}},{["name"]:"ValueSeverity",["options"]:{},["members"]:{["warn"]:0n,["error"]:1n},["member_options"]:{["warn"]:{},["error"]:{}}},{["name"]:"ValueDiagCode",["options"]:{},["members"]:{["equivocation"]:0n},["member_options"]:{["equivocation"]:{}}}],["messages"]:[{["name"]:"ValueStamp",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"origin",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"seq",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"lamport",["tag"]:3,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"ValueSet",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"origin",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"seq",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"lamport",["tag"]:3,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"prev",["tag"]:4,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:true,["transient"]:false},{["name"]:"payload",["tag"]:5,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"ValueReadRequest",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"value_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false}]},{["name"]:"ValueReadResponse",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"value_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"value",["tag"]:3,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:true,["transient"]:false},{["name"]:"winner",["tag"]:4,["options"]:{},["type"]:{["k"]:"msg",["name"]:"ValueStamp"},["optional"]:true,["transient"]:false},{["name"]:"state",["tag"]:5,["options"]:{},["type"]:{["k"]:"enum",["name"]:"ValueState"},["optional"]:false,["transient"]:false}]},{["name"]:"ValueDiagnostic",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"severity",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"ValueSeverity"},["optional"]:false,["transient"]:false},{["name"]:"code",["tag"]:2,["options"]:{},["type"]:{["k"]:"enum",["name"]:"ValueDiagCode"},["optional"]:false,["transient"]:false}]}],["services"]:[]} as _taut.schema.Schema);
