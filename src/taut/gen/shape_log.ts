// GENERATED TypeScript; typescript-oneof-reference.1; descriptor=1; codec=1; owner=taut.typescript.foundation
import * as _taut from "../../../foundation/cjs/foundation.js";
if (typeof _taut.requireFoundation !== "function") throw new globalThis.Error("compatible TypeScript descriptor/codec foundation required; regenerate/rebind runtime");
_taut.requireFoundation();
export type LogMsgType = "push" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "evict" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export const LogMsgTypeDescriptor = new _taut.EnumDescriptor("LogMsgType", "shape_log.LogMsgType", {["push"]:0n,["seal"]:1n,["close"]:2n,["read"]:3n,["end_stream"]:4n,["timer_expired"]:5n,["evict"]:6n,["read_response"]:7n,["set_timer"]:8n,["cancel_timer"]:9n,["producer_stop"]:10n,["diagnostic"]:11n}, {}, {["push"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["evict"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}, "e36eb2f21e5fc54d9ed310b989720b43443b73e4fee8219c3000b4562108071c");
export type LogState = "data" | "would_block" | "eof" | "closed" | "failed" | "expired";
export const LogStateDescriptor = new _taut.EnumDescriptor("LogState", "shape_log.LogState", {["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["expired"]:5n}, {}, {["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["expired"]:{}}, "aeb72f31d9e878a1dc15d7afd543e381b22f6a314dfda56f87a7f8002fa76c87");
export type LogErrorCode = "unknown_log" | "producer_error" | "internal";
export const LogErrorCodeDescriptor = new _taut.EnumDescriptor("LogErrorCode", "shape_log.LogErrorCode", {["unknown_log"]:0n,["producer_error"]:1n,["internal"]:2n}, {}, {["unknown_log"]:{},["producer_error"]:{},["internal"]:{}}, "01362ff2dc397c94918a76291b6a7733bf12b74e42bff460d7b3313324337f39");
export type LogStopReason = "last_reader_gone" | "closed" | "failed";
export const LogStopReasonDescriptor = new _taut.EnumDescriptor("LogStopReason", "shape_log.LogStopReason", {["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n}, {}, {["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}, "d20533f9a56aebe6dbd064ecdbec800fcdec26d754529b6c4194ffa4446c2c3b");
export type LogSeverity = "warn" | "error";
export const LogSeverityDescriptor = new _taut.EnumDescriptor("LogSeverity", "shape_log.LogSeverity", {["warn"]:0n,["error"]:1n}, {}, {["warn"]:{},["error"]:{}}, "f9fc5607b32b0579589396ae0ffe9f4d761685bf61819c5b834e39d8543f2909");
export type LogDiagCode = "push_after_terminal";
export const LogDiagCodeDescriptor = new _taut.EnumDescriptor("LogDiagCode", "shape_log.LogDiagCode", {["push_after_terminal"]:0n}, {}, {["push_after_terminal"]:{}}, "045aae670820365ac3b99f1129a8480620a07421e86201205c15189c1fce64a4");
export interface LogCursor {
  seq: bigint;
}
export type LogCursorFields = LogCursor & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogRecord {
  seq: bigint;
  payload: globalThis.Uint8Array;
}
export type LogRecordFields = LogRecord & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogError {
  code: LogErrorCode;
  message: string | null;
}
export type LogErrorFields = LogError & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogPush {
  payload: globalThis.Uint8Array;
}
export type LogPushFields = LogPush & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogSeal {
}
export type LogSealFields = LogSeal & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogClose {
  error: LogError | null;
}
export type LogCloseFields = LogClose & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogReadRequest {
  log_id: string;
  stream_id: string;
  cursor: LogCursor | null;
  max_records: bigint | null;
  max_bytes: bigint | null;
  timeout_ms: bigint | null;
}
export type LogReadRequestFields = LogReadRequest & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogEndStream {
  log_id: string;
  stream_id: string;
}
export type LogEndStreamFields = LogEndStream & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogTimerExpired {
  token: bigint;
}
export type LogTimerExpiredFields = LogTimerExpired & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogEvict {
  up_to_seq: bigint;
}
export type LogEvictFields = LogEvict & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogReadResponse {
  log_id: string;
  stream_id: string;
  records: globalThis.Array<LogRecord>;
  next_cursor: LogCursor;
  state: LogState;
  error: LogError | null;
}
export type LogReadResponseFields = LogReadResponse & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogSetTimer {
  token: bigint;
  ms: bigint;
}
export type LogSetTimerFields = LogSetTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogCancelTimer {
  token: bigint;
}
export type LogCancelTimerFields = LogCancelTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogProducerStop {
  reason: LogStopReason;
}
export type LogProducerStopFields = LogProducerStop & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface LogDiagnostic {
  severity: LogSeverity;
  code: LogDiagCode;
}
export type LogDiagnosticFields = LogDiagnostic & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export const LogCursorDescriptor = new _taut.MessageDescriptor("LogCursor", "shape_log.LogCursor", 1, [
  new _taut.FieldDescriptor("seq", "seq", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "ca42424831d2e76be9cc9779b29d583d9ff9f69b4502e9ba6b83dc595293f753");
export const LogCursorBinding: _taut.MessageBinding<LogCursor> = new _taut.MessageBinding<LogCursor>(LogCursorDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["seq"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogCursor => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogRecordDescriptor = new _taut.MessageDescriptor("LogRecord", "shape_log.LogRecord", 1, [
  new _taut.FieldDescriptor("seq", "seq", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 2, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "133e7a8468f638f54941579b745245254d7fd6fac20ce2d7f07331c094b8ae2e");
export const LogRecordBinding: _taut.MessageBinding<LogRecord> = new _taut.MessageBinding<LogRecord>(LogRecordDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["seq"];
    case 1: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogRecord => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogErrorDescriptor = new _taut.MessageDescriptor("LogError", "shape_log.LogError", 1, [
  new _taut.FieldDescriptor("code", "code", 1, {kind:"enum", enum:()=>LogErrorCodeDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("message", "message", 2, {kind:"str"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "5345f0185ee2c32ec1b3818e74899ec2018eda58e082e1b9e2eb6551aa52ccc7");
export const LogErrorBinding: _taut.MessageBinding<LogError> = new _taut.MessageBinding<LogError>(LogErrorDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["code"];
    case 1: return value["message"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogError => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogPushDescriptor = new _taut.MessageDescriptor("LogPush", "shape_log.LogPush", 1, [
  new _taut.FieldDescriptor("payload", "payload", 1, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "201f229f9e49cfeeb6dbfb3bcbdd6e7e7f23bee49b70015ded18bbda83a43930");
export const LogPushBinding: _taut.MessageBinding<LogPush> = new _taut.MessageBinding<LogPush>(LogPushDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogPush => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogSealDescriptor = new _taut.MessageDescriptor("LogSeal", "shape_log.LogSeal", 1, [
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "eaa0007ca62230bd0b5c39a4596a6bde0cbde7dbc2120f115706de58ff553524");
export const LogSealBinding: _taut.MessageBinding<LogSeal> = new _taut.MessageBinding<LogSeal>(LogSealDescriptor, (value, index) => {
  switch(index) {
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogSeal => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogCloseDescriptor = new _taut.MessageDescriptor("LogClose", "shape_log.LogClose", 1, [
  new _taut.FieldDescriptor("error", "error", 1, {kind:"message", binding:()=>LogErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "844977e162ca116a46cf28ba0a3bb909ed2a46aeb50b695338ec7546dddb533a");
export const LogCloseBinding: _taut.MessageBinding<LogClose> = new _taut.MessageBinding<LogClose>(LogCloseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogClose => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogReadRequestDescriptor = new _taut.MessageDescriptor("LogReadRequest", "shape_log.LogReadRequest", 1, [
  new _taut.FieldDescriptor("log_id", "log_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("cursor", "cursor", 3, {kind:"message", binding:()=>LogCursorBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("max_records", "max_records", 4, {kind:"int"}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("max_bytes", "max_bytes", 5, {kind:"int"}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("timeout_ms", "timeout_ms", 6, {kind:"int"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "bffee92e13fa0161cf1f0f2946b313b4a727d9ad31f6f73f49480055395549fc");
export const LogReadRequestBinding: _taut.MessageBinding<LogReadRequest> = new _taut.MessageBinding<LogReadRequest>(LogReadRequestDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["log_id"];
    case 1: return value["stream_id"];
    case 2: return value["cursor"];
    case 3: return value["max_records"];
    case 4: return value["max_bytes"];
    case 5: return value["timeout_ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogReadRequest => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogEndStreamDescriptor = new _taut.MessageDescriptor("LogEndStream", "shape_log.LogEndStream", 1, [
  new _taut.FieldDescriptor("log_id", "log_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "5e9ed738808e9eca19705106b9c47230fbecee8b3a0f474dcde27f0d59409061");
export const LogEndStreamBinding: _taut.MessageBinding<LogEndStream> = new _taut.MessageBinding<LogEndStream>(LogEndStreamDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["log_id"];
    case 1: return value["stream_id"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogEndStream => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogTimerExpiredDescriptor = new _taut.MessageDescriptor("LogTimerExpired", "shape_log.LogTimerExpired", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "de6a544e2b3dfc67b1a146bf1817d98a5713b4ee9ded6903eb7aa3f8b0896142");
export const LogTimerExpiredBinding: _taut.MessageBinding<LogTimerExpired> = new _taut.MessageBinding<LogTimerExpired>(LogTimerExpiredDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogTimerExpired => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogEvictDescriptor = new _taut.MessageDescriptor("LogEvict", "shape_log.LogEvict", 1, [
  new _taut.FieldDescriptor("up_to_seq", "up_to_seq", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "fa6fce658ec2f818b32b7e28739e8bb8dedcf91110c71afc4f40a6cf8d3d6675");
export const LogEvictBinding: _taut.MessageBinding<LogEvict> = new _taut.MessageBinding<LogEvict>(LogEvictDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["up_to_seq"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogEvict => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogReadResponseDescriptor = new _taut.MessageDescriptor("LogReadResponse", "shape_log.LogReadResponse", 1, [
  new _taut.FieldDescriptor("log_id", "log_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("records", "records", 3, {kind:"list", element:{kind:"message", binding:()=>LogRecordBinding}}, "required", false, false, {}),
  new _taut.FieldDescriptor("next_cursor", "next_cursor", 4, {kind:"message", binding:()=>LogCursorBinding}, "required", false, false, {}),
  new _taut.FieldDescriptor("state", "state", 5, {kind:"enum", enum:()=>LogStateDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("error", "error", 6, {kind:"message", binding:()=>LogErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "b0377d22fa0e5eb9ab84872b64665455a3512d551d5b588fa92fad7ae449736a");
export const LogReadResponseBinding: _taut.MessageBinding<LogReadResponse> = new _taut.MessageBinding<LogReadResponse>(LogReadResponseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["log_id"];
    case 1: return value["stream_id"];
    case 2: return value["records"];
    case 3: return value["next_cursor"];
    case 4: return value["state"];
    case 5: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogReadResponse => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogSetTimerDescriptor = new _taut.MessageDescriptor("LogSetTimer", "shape_log.LogSetTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("ms", "ms", 2, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "9acff76f5d6dc8692d79a7fa517cf469732d461c759daa3f52b8af781a56a9f0");
export const LogSetTimerBinding: _taut.MessageBinding<LogSetTimer> = new _taut.MessageBinding<LogSetTimer>(LogSetTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    case 1: return value["ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogSetTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogCancelTimerDescriptor = new _taut.MessageDescriptor("LogCancelTimer", "shape_log.LogCancelTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "bd54e64b98ac4a4160e9c5043a030f042ddf834961201e85cc72e9e22c7f9dd4");
export const LogCancelTimerBinding: _taut.MessageBinding<LogCancelTimer> = new _taut.MessageBinding<LogCancelTimer>(LogCancelTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogCancelTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogProducerStopDescriptor = new _taut.MessageDescriptor("LogProducerStop", "shape_log.LogProducerStop", 1, [
  new _taut.FieldDescriptor("reason", "reason", 1, {kind:"enum", enum:()=>LogStopReasonDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "554de81ecfe1f106467722524381fd81817a8e2a0390dcef3dfdb2bfe8c1db8b");
export const LogProducerStopBinding: _taut.MessageBinding<LogProducerStop> = new _taut.MessageBinding<LogProducerStop>(LogProducerStopDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["reason"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogProducerStop => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const LogDiagnosticDescriptor = new _taut.MessageDescriptor("LogDiagnostic", "shape_log.LogDiagnostic", 1, [
  new _taut.FieldDescriptor("severity", "severity", 1, {kind:"enum", enum:()=>LogSeverityDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("code", "code", 2, {kind:"enum", enum:()=>LogDiagCodeDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "e79951402213bcc1ac9f6a446e913909f031628a8bebb34fb88843379683a561");
export const LogDiagnosticBinding: _taut.MessageBinding<LogDiagnostic> = new _taut.MessageBinding<LogDiagnostic>(LogDiagnosticDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["severity"];
    case 1: return value["code"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is LogDiagnostic => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SCHEMA_DESCRIPTOR = new _taut.SchemaDescriptor("shape_log", 2, {["LogCursor"]:LogCursorDescriptor,["LogRecord"]:LogRecordDescriptor,["LogError"]:LogErrorDescriptor,["LogPush"]:LogPushDescriptor,["LogSeal"]:LogSealDescriptor,["LogClose"]:LogCloseDescriptor,["LogReadRequest"]:LogReadRequestDescriptor,["LogEndStream"]:LogEndStreamDescriptor,["LogTimerExpired"]:LogTimerExpiredDescriptor,["LogEvict"]:LogEvictDescriptor,["LogReadResponse"]:LogReadResponseDescriptor,["LogSetTimer"]:LogSetTimerDescriptor,["LogCancelTimer"]:LogCancelTimerDescriptor,["LogProducerStop"]:LogProducerStopDescriptor,["LogDiagnostic"]:LogDiagnosticDescriptor}, {["LogMsgType"]:LogMsgTypeDescriptor,["LogState"]:LogStateDescriptor,["LogErrorCode"]:LogErrorCodeDescriptor,["LogStopReason"]:LogStopReasonDescriptor,["LogSeverity"]:LogSeverityDescriptor,["LogDiagCode"]:LogDiagCodeDescriptor}, {}, {["max_depth"]:32,["max_encoded_len"]:null});
_taut.publish(SCHEMA_DESCRIPTOR, [LogCursorBinding, LogRecordBinding, LogErrorBinding, LogPushBinding, LogSealBinding, LogCloseBinding, LogReadRequestBinding, LogEndStreamBinding, LogTimerExpiredBinding, LogEvictBinding, LogReadResponseBinding, LogSetTimerBinding, LogCancelTimerBinding, LogProducerStopBinding, LogDiagnosticBinding]);
export const CODEC_SCHEMA = new _taut.schema.SchemaIndex({["version"]:2,["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["enums"]:[{["name"]:"LogMsgType",["options"]:{},["members"]:{["push"]:0n,["seal"]:1n,["close"]:2n,["read"]:3n,["end_stream"]:4n,["timer_expired"]:5n,["evict"]:6n,["read_response"]:7n,["set_timer"]:8n,["cancel_timer"]:9n,["producer_stop"]:10n,["diagnostic"]:11n},["member_options"]:{["push"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["evict"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}},{["name"]:"LogState",["options"]:{},["members"]:{["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["expired"]:5n},["member_options"]:{["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["expired"]:{}}},{["name"]:"LogErrorCode",["options"]:{},["members"]:{["unknown_log"]:0n,["producer_error"]:1n,["internal"]:2n},["member_options"]:{["unknown_log"]:{},["producer_error"]:{},["internal"]:{}}},{["name"]:"LogStopReason",["options"]:{},["members"]:{["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n},["member_options"]:{["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}},{["name"]:"LogSeverity",["options"]:{},["members"]:{["warn"]:0n,["error"]:1n},["member_options"]:{["warn"]:{},["error"]:{}}},{["name"]:"LogDiagCode",["options"]:{},["members"]:{["push_after_terminal"]:0n},["member_options"]:{["push_after_terminal"]:{}}}],["messages"]:[{["name"]:"LogCursor",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"LogRecord",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"LogError",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"code",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"LogErrorCode"},["optional"]:false,["transient"]:false},{["name"]:"message",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:true,["transient"]:false}]},{["name"]:"LogPush",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"payload",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"LogSeal",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[]},{["name"]:"LogClose",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"error",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"LogError"},["optional"]:true,["transient"]:false}]},{["name"]:"LogReadRequest",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"log_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"cursor",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"LogCursor"},["optional"]:true,["transient"]:false},{["name"]:"max_records",["tag"]:4,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false},{["name"]:"max_bytes",["tag"]:5,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false},{["name"]:"timeout_ms",["tag"]:6,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false}]},{["name"]:"LogEndStream",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"log_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false}]},{["name"]:"LogTimerExpired",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"LogEvict",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"up_to_seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"LogReadResponse",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"log_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"records",["tag"]:3,["options"]:{},["type"]:{["k"]:"list",["elem"]:{["k"]:"msg",["name"]:"LogRecord"}},["optional"]:false,["transient"]:false},{["name"]:"next_cursor",["tag"]:4,["options"]:{},["type"]:{["k"]:"msg",["name"]:"LogCursor"},["optional"]:false,["transient"]:false},{["name"]:"state",["tag"]:5,["options"]:{},["type"]:{["k"]:"enum",["name"]:"LogState"},["optional"]:false,["transient"]:false},{["name"]:"error",["tag"]:6,["options"]:{},["type"]:{["k"]:"msg",["name"]:"LogError"},["optional"]:true,["transient"]:false}]},{["name"]:"LogSetTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"ms",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"LogCancelTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"LogProducerStop",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"reason",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"LogStopReason"},["optional"]:false,["transient"]:false}]},{["name"]:"LogDiagnostic",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"severity",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"LogSeverity"},["optional"]:false,["transient"]:false},{["name"]:"code",["tag"]:2,["options"]:{},["type"]:{["k"]:"enum",["name"]:"LogDiagCode"},["optional"]:false,["transient"]:false}]}],["services"]:[]} as _taut.schema.Schema);
