// GENERATED TypeScript; typescript-oneof-reference.1; descriptor=1; codec=1; owner=taut.typescript.foundation
import * as _taut from "../../../foundation/cjs/foundation.js";
if (typeof _taut.requireFoundation !== "function") throw new globalThis.Error("compatible TypeScript descriptor/codec foundation required; regenerate/rebind runtime");
_taut.requireFoundation();
export type StreamMsgType = "push" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export const StreamMsgTypeDescriptor = new _taut.EnumDescriptor("StreamMsgType", "shape_stream.StreamMsgType", {["push"]:0n,["seal"]:1n,["close"]:2n,["read"]:3n,["end_stream"]:4n,["timer_expired"]:5n,["read_response"]:6n,["set_timer"]:7n,["cancel_timer"]:8n,["producer_stop"]:9n,["diagnostic"]:10n}, {}, {["push"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}, "65fb668de57455877c323c8cfa8fd2af6824a98b977621b6898b5520de1e208c");
export type StreamState = "data" | "would_block" | "eof" | "closed" | "failed" | "dropped";
export const StreamStateDescriptor = new _taut.EnumDescriptor("StreamState", "shape_stream.StreamState", {["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["dropped"]:5n}, {}, {["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["dropped"]:{}}, "2c6b5bbea0f7001c0f95e6be543a9fce13a7261d1623f24be39a3be218108bcf");
export type StreamErrorCode = "unknown_stream" | "producer_error" | "internal" | "slow_consumer";
export const StreamErrorCodeDescriptor = new _taut.EnumDescriptor("StreamErrorCode", "shape_stream.StreamErrorCode", {["unknown_stream"]:0n,["producer_error"]:1n,["internal"]:2n,["slow_consumer"]:3n}, {}, {["unknown_stream"]:{},["producer_error"]:{},["internal"]:{},["slow_consumer"]:{}}, "bd54c822862a9ef3fb5cddf699f77b7d9a457170fe157f8f073dfd3bbd4f0e53");
export type StreamStopReason = "last_reader_gone" | "closed" | "failed";
export const StreamStopReasonDescriptor = new _taut.EnumDescriptor("StreamStopReason", "shape_stream.StreamStopReason", {["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n}, {}, {["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}, "6ee21cda017497886e5b48cd79fba9c3885683e9edb7fd08cd3dd7eef1477c0a");
export type StreamSeverity = "warn" | "error";
export const StreamSeverityDescriptor = new _taut.EnumDescriptor("StreamSeverity", "shape_stream.StreamSeverity", {["warn"]:0n,["error"]:1n}, {}, {["warn"]:{},["error"]:{}}, "26dc1fe47bbec0d4f1bcd55cfc338bf3b77b656a81d1d585794c8fb42ca72ea3");
export type StreamDiagCode = "push_after_terminal";
export const StreamDiagCodeDescriptor = new _taut.EnumDescriptor("StreamDiagCode", "shape_stream.StreamDiagCode", {["push_after_terminal"]:0n}, {}, {["push_after_terminal"]:{}}, "ecd7d7c9a46f36e923662bfc92c0ded0f2076375291fcff71e7075e9cb076365");
export interface StreamPosition {
  seq: bigint;
}
export type StreamPositionFields = StreamPosition & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamRecord {
  seq: bigint;
  payload: globalThis.Uint8Array;
}
export type StreamRecordFields = StreamRecord & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamError {
  code: StreamErrorCode;
  message: string | null;
}
export type StreamErrorFields = StreamError & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamPush {
  payload: globalThis.Uint8Array;
}
export type StreamPushFields = StreamPush & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamSeal {
}
export type StreamSealFields = StreamSeal & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamClose {
  error: StreamError | null;
}
export type StreamCloseFields = StreamClose & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamReadRequest {
  stream_id: string;
  max_records: bigint | null;
  max_bytes: bigint | null;
  timeout_ms: bigint | null;
}
export type StreamReadRequestFields = StreamReadRequest & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamEndStream {
  stream_id: string;
}
export type StreamEndStreamFields = StreamEndStream & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamTimerExpired {
  token: bigint;
}
export type StreamTimerExpiredFields = StreamTimerExpired & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamReadResponse {
  stream_id: string;
  records: globalThis.Array<StreamRecord>;
  next_position: StreamPosition;
  state: StreamState;
  error: StreamError | null;
}
export type StreamReadResponseFields = StreamReadResponse & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamSetTimer {
  token: bigint;
  ms: bigint;
}
export type StreamSetTimerFields = StreamSetTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamCancelTimer {
  token: bigint;
}
export type StreamCancelTimerFields = StreamCancelTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamProducerStop {
  reason: StreamStopReason;
}
export type StreamProducerStopFields = StreamProducerStop & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface StreamDiagnostic {
  severity: StreamSeverity;
  code: StreamDiagCode;
}
export type StreamDiagnosticFields = StreamDiagnostic & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export const StreamPositionDescriptor = new _taut.MessageDescriptor("StreamPosition", "shape_stream.StreamPosition", 1, [
  new _taut.FieldDescriptor("seq", "seq", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "b351be4c46f4db16a8c6e4a4719af622b622f85a978035f7afd9db71e8bf4b25");
export const StreamPositionBinding: _taut.MessageBinding<StreamPosition> = new _taut.MessageBinding<StreamPosition>(StreamPositionDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["seq"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamPosition => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamRecordDescriptor = new _taut.MessageDescriptor("StreamRecord", "shape_stream.StreamRecord", 1, [
  new _taut.FieldDescriptor("seq", "seq", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 2, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "194278943c777f556c7fe5fd1113135fe3ce8c9017b5431a83825a91b18ea154");
export const StreamRecordBinding: _taut.MessageBinding<StreamRecord> = new _taut.MessageBinding<StreamRecord>(StreamRecordDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["seq"];
    case 1: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamRecord => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamErrorDescriptor = new _taut.MessageDescriptor("StreamError", "shape_stream.StreamError", 1, [
  new _taut.FieldDescriptor("code", "code", 1, {kind:"enum", enum:()=>StreamErrorCodeDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("message", "message", 2, {kind:"str"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "08975276e527366816d3c2304059e2d7fbf2b35f6559a161a30b719aedde9695");
export const StreamErrorBinding: _taut.MessageBinding<StreamError> = new _taut.MessageBinding<StreamError>(StreamErrorDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["code"];
    case 1: return value["message"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamError => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamPushDescriptor = new _taut.MessageDescriptor("StreamPush", "shape_stream.StreamPush", 1, [
  new _taut.FieldDescriptor("payload", "payload", 1, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "e3cefcb4879a052d5e6c7c74249d3a2d7c8065ac3d0e3d4e27ae9fd3fc5bb54d");
export const StreamPushBinding: _taut.MessageBinding<StreamPush> = new _taut.MessageBinding<StreamPush>(StreamPushDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamPush => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamSealDescriptor = new _taut.MessageDescriptor("StreamSeal", "shape_stream.StreamSeal", 1, [
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "cdde41e8ce44a93f5efd3c7f719be53e316486046880033ff6243476e77565c0");
export const StreamSealBinding: _taut.MessageBinding<StreamSeal> = new _taut.MessageBinding<StreamSeal>(StreamSealDescriptor, (value, index) => {
  switch(index) {
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamSeal => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamCloseDescriptor = new _taut.MessageDescriptor("StreamClose", "shape_stream.StreamClose", 1, [
  new _taut.FieldDescriptor("error", "error", 1, {kind:"message", binding:()=>StreamErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "67a2cdd2a14ab5d0bf634e96327bf58dc00a1db5ba65e667c5eaf0eb39de7062");
export const StreamCloseBinding: _taut.MessageBinding<StreamClose> = new _taut.MessageBinding<StreamClose>(StreamCloseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamClose => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamReadRequestDescriptor = new _taut.MessageDescriptor("StreamReadRequest", "shape_stream.StreamReadRequest", 1, [
  new _taut.FieldDescriptor("stream_id", "stream_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("max_records", "max_records", 2, {kind:"int"}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("max_bytes", "max_bytes", 3, {kind:"int"}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("timeout_ms", "timeout_ms", 4, {kind:"int"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "f8be2a8928aa28c168a5ee96cd785fe4c2117d702522de8270b40462a70761b8");
export const StreamReadRequestBinding: _taut.MessageBinding<StreamReadRequest> = new _taut.MessageBinding<StreamReadRequest>(StreamReadRequestDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["stream_id"];
    case 1: return value["max_records"];
    case 2: return value["max_bytes"];
    case 3: return value["timeout_ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamReadRequest => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamEndStreamDescriptor = new _taut.MessageDescriptor("StreamEndStream", "shape_stream.StreamEndStream", 1, [
  new _taut.FieldDescriptor("stream_id", "stream_id", 1, {kind:"str"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "dc700b2671d66833304bbaabc8172c28fe6fb379ddad2592c95d30a590aa55c6");
export const StreamEndStreamBinding: _taut.MessageBinding<StreamEndStream> = new _taut.MessageBinding<StreamEndStream>(StreamEndStreamDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["stream_id"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamEndStream => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamTimerExpiredDescriptor = new _taut.MessageDescriptor("StreamTimerExpired", "shape_stream.StreamTimerExpired", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "0f9cf16dcf3cda4b9a573f4c70e4e24aaf4af04934c5fcd02963d5c3cc41a1c3");
export const StreamTimerExpiredBinding: _taut.MessageBinding<StreamTimerExpired> = new _taut.MessageBinding<StreamTimerExpired>(StreamTimerExpiredDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamTimerExpired => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamReadResponseDescriptor = new _taut.MessageDescriptor("StreamReadResponse", "shape_stream.StreamReadResponse", 1, [
  new _taut.FieldDescriptor("stream_id", "stream_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("records", "records", 2, {kind:"list", element:{kind:"message", binding:()=>StreamRecordBinding}}, "required", false, false, {}),
  new _taut.FieldDescriptor("next_position", "next_position", 3, {kind:"message", binding:()=>StreamPositionBinding}, "required", false, false, {}),
  new _taut.FieldDescriptor("state", "state", 4, {kind:"enum", enum:()=>StreamStateDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("error", "error", 5, {kind:"message", binding:()=>StreamErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "41da7bfdf43129fd78b5910e765a6beda124f6217299f082cc7208a247285f50");
export const StreamReadResponseBinding: _taut.MessageBinding<StreamReadResponse> = new _taut.MessageBinding<StreamReadResponse>(StreamReadResponseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["stream_id"];
    case 1: return value["records"];
    case 2: return value["next_position"];
    case 3: return value["state"];
    case 4: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamReadResponse => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamSetTimerDescriptor = new _taut.MessageDescriptor("StreamSetTimer", "shape_stream.StreamSetTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("ms", "ms", 2, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "1bbd011e190e17ca0ebbc7ae31d3a854ce6ac13163db8e0c3e34048605c7a565");
export const StreamSetTimerBinding: _taut.MessageBinding<StreamSetTimer> = new _taut.MessageBinding<StreamSetTimer>(StreamSetTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    case 1: return value["ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamSetTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamCancelTimerDescriptor = new _taut.MessageDescriptor("StreamCancelTimer", "shape_stream.StreamCancelTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "e40cb96cc8fcd1111cf66d7c4a60ac09a1f45736d640462174bdfd9ee6c7b1f5");
export const StreamCancelTimerBinding: _taut.MessageBinding<StreamCancelTimer> = new _taut.MessageBinding<StreamCancelTimer>(StreamCancelTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamCancelTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamProducerStopDescriptor = new _taut.MessageDescriptor("StreamProducerStop", "shape_stream.StreamProducerStop", 1, [
  new _taut.FieldDescriptor("reason", "reason", 1, {kind:"enum", enum:()=>StreamStopReasonDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "35cf2e4ff54d82b37e5999f351bd5395fc47deb7164bd362c1334d0446162813");
export const StreamProducerStopBinding: _taut.MessageBinding<StreamProducerStop> = new _taut.MessageBinding<StreamProducerStop>(StreamProducerStopDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["reason"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamProducerStop => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const StreamDiagnosticDescriptor = new _taut.MessageDescriptor("StreamDiagnostic", "shape_stream.StreamDiagnostic", 1, [
  new _taut.FieldDescriptor("severity", "severity", 1, {kind:"enum", enum:()=>StreamSeverityDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("code", "code", 2, {kind:"enum", enum:()=>StreamDiagCodeDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "f777f7840c0a0e0e52e439a305832df9c39dbbf783778bf3752d9e4e3afd0e2b");
export const StreamDiagnosticBinding: _taut.MessageBinding<StreamDiagnostic> = new _taut.MessageBinding<StreamDiagnostic>(StreamDiagnosticDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["severity"];
    case 1: return value["code"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is StreamDiagnostic => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SCHEMA_DESCRIPTOR = new _taut.SchemaDescriptor("shape_stream", 2, {["StreamPosition"]:StreamPositionDescriptor,["StreamRecord"]:StreamRecordDescriptor,["StreamError"]:StreamErrorDescriptor,["StreamPush"]:StreamPushDescriptor,["StreamSeal"]:StreamSealDescriptor,["StreamClose"]:StreamCloseDescriptor,["StreamReadRequest"]:StreamReadRequestDescriptor,["StreamEndStream"]:StreamEndStreamDescriptor,["StreamTimerExpired"]:StreamTimerExpiredDescriptor,["StreamReadResponse"]:StreamReadResponseDescriptor,["StreamSetTimer"]:StreamSetTimerDescriptor,["StreamCancelTimer"]:StreamCancelTimerDescriptor,["StreamProducerStop"]:StreamProducerStopDescriptor,["StreamDiagnostic"]:StreamDiagnosticDescriptor}, {["StreamMsgType"]:StreamMsgTypeDescriptor,["StreamState"]:StreamStateDescriptor,["StreamErrorCode"]:StreamErrorCodeDescriptor,["StreamStopReason"]:StreamStopReasonDescriptor,["StreamSeverity"]:StreamSeverityDescriptor,["StreamDiagCode"]:StreamDiagCodeDescriptor}, {}, {["max_depth"]:32,["max_encoded_len"]:null});
_taut.publish(SCHEMA_DESCRIPTOR, [StreamPositionBinding, StreamRecordBinding, StreamErrorBinding, StreamPushBinding, StreamSealBinding, StreamCloseBinding, StreamReadRequestBinding, StreamEndStreamBinding, StreamTimerExpiredBinding, StreamReadResponseBinding, StreamSetTimerBinding, StreamCancelTimerBinding, StreamProducerStopBinding, StreamDiagnosticBinding]);
export const CODEC_SCHEMA = new _taut.schema.SchemaIndex({["version"]:2,["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["enums"]:[{["name"]:"StreamMsgType",["options"]:{},["members"]:{["push"]:0n,["seal"]:1n,["close"]:2n,["read"]:3n,["end_stream"]:4n,["timer_expired"]:5n,["read_response"]:6n,["set_timer"]:7n,["cancel_timer"]:8n,["producer_stop"]:9n,["diagnostic"]:10n},["member_options"]:{["push"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}},{["name"]:"StreamState",["options"]:{},["members"]:{["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["dropped"]:5n},["member_options"]:{["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["dropped"]:{}}},{["name"]:"StreamErrorCode",["options"]:{},["members"]:{["unknown_stream"]:0n,["producer_error"]:1n,["internal"]:2n,["slow_consumer"]:3n},["member_options"]:{["unknown_stream"]:{},["producer_error"]:{},["internal"]:{},["slow_consumer"]:{}}},{["name"]:"StreamStopReason",["options"]:{},["members"]:{["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n},["member_options"]:{["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}},{["name"]:"StreamSeverity",["options"]:{},["members"]:{["warn"]:0n,["error"]:1n},["member_options"]:{["warn"]:{},["error"]:{}}},{["name"]:"StreamDiagCode",["options"]:{},["members"]:{["push_after_terminal"]:0n},["member_options"]:{["push_after_terminal"]:{}}}],["messages"]:[{["name"]:"StreamPosition",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamRecord",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamError",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"code",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"StreamErrorCode"},["optional"]:false,["transient"]:false},{["name"]:"message",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:true,["transient"]:false}]},{["name"]:"StreamPush",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"payload",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamSeal",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[]},{["name"]:"StreamClose",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"error",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"StreamError"},["optional"]:true,["transient"]:false}]},{["name"]:"StreamReadRequest",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"stream_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"max_records",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false},{["name"]:"max_bytes",["tag"]:3,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false},{["name"]:"timeout_ms",["tag"]:4,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false}]},{["name"]:"StreamEndStream",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"stream_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamTimerExpired",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamReadResponse",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"stream_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"records",["tag"]:2,["options"]:{},["type"]:{["k"]:"list",["elem"]:{["k"]:"msg",["name"]:"StreamRecord"}},["optional"]:false,["transient"]:false},{["name"]:"next_position",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"StreamPosition"},["optional"]:false,["transient"]:false},{["name"]:"state",["tag"]:4,["options"]:{},["type"]:{["k"]:"enum",["name"]:"StreamState"},["optional"]:false,["transient"]:false},{["name"]:"error",["tag"]:5,["options"]:{},["type"]:{["k"]:"msg",["name"]:"StreamError"},["optional"]:true,["transient"]:false}]},{["name"]:"StreamSetTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"ms",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamCancelTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamProducerStop",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"reason",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"StreamStopReason"},["optional"]:false,["transient"]:false}]},{["name"]:"StreamDiagnostic",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"severity",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"StreamSeverity"},["optional"]:false,["transient"]:false},{["name"]:"code",["tag"]:2,["options"]:{},["type"]:{["k"]:"enum",["name"]:"StreamDiagCode"},["optional"]:false,["transient"]:false}]}],["services"]:[]} as _taut.schema.Schema);
