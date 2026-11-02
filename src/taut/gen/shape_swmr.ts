// GENERATED TypeScript; typescript-oneof-reference.1; descriptor=1; codec=1; owner=taut.typescript.foundation
import * as _taut from "../../../foundation/cjs/foundation.js";
if (typeof _taut.requireFoundation !== "function") throw new globalThis.Error("compatible TypeScript descriptor/codec foundation required; regenerate/rebind runtime");
_taut.requireFoundation();
export type SwmrMsgType = "snapshot_push" | "delta_push" | "reset" | "seal" | "close" | "read" | "end_stream" | "timer_expired" | "read_response" | "set_timer" | "cancel_timer" | "producer_stop" | "diagnostic";
export const SwmrMsgTypeDescriptor = new _taut.EnumDescriptor("SwmrMsgType", "shape_swmr.SwmrMsgType", {["snapshot_push"]:0n,["delta_push"]:1n,["reset"]:2n,["seal"]:3n,["close"]:4n,["read"]:5n,["end_stream"]:6n,["timer_expired"]:7n,["read_response"]:8n,["set_timer"]:9n,["cancel_timer"]:10n,["producer_stop"]:11n,["diagnostic"]:12n}, {}, {["snapshot_push"]:{},["delta_push"]:{},["reset"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}, "cdae1fa62506438fd2a922e8a22cff9b4b94403cd9f44d9ac5f39f492b2be2f2");
export type SwmrState = "data" | "would_block" | "eof" | "closed" | "failed" | "reset";
export const SwmrStateDescriptor = new _taut.EnumDescriptor("SwmrState", "shape_swmr.SwmrState", {["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["reset"]:5n}, {}, {["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["reset"]:{}}, "fc70beb746641bc7a9c7a2c3ea1e69d30fad2296c8a7f607df58f597060ca1ea");
export type SwmrErrorCode = "unknown_swmr" | "producer_error" | "internal";
export const SwmrErrorCodeDescriptor = new _taut.EnumDescriptor("SwmrErrorCode", "shape_swmr.SwmrErrorCode", {["unknown_swmr"]:0n,["producer_error"]:1n,["internal"]:2n}, {}, {["unknown_swmr"]:{},["producer_error"]:{},["internal"]:{}}, "f408f7e17493360a9928e14e08a60ce5c4c46736033d844a77bdab6f00c2adbf");
export type SwmrStopReason = "last_reader_gone" | "closed" | "failed";
export const SwmrStopReasonDescriptor = new _taut.EnumDescriptor("SwmrStopReason", "shape_swmr.SwmrStopReason", {["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n}, {}, {["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}, "7a7f928bb58c24cf5dae2ff82ffb5de18d0b77010376e8dd4c87dedccc8e4303");
export type SwmrResetReason = "producer_requested" | "retention_exceeded" | "invalid_resume_seq";
export const SwmrResetReasonDescriptor = new _taut.EnumDescriptor("SwmrResetReason", "shape_swmr.SwmrResetReason", {["producer_requested"]:0n,["retention_exceeded"]:1n,["invalid_resume_seq"]:2n}, {}, {["producer_requested"]:{},["retention_exceeded"]:{},["invalid_resume_seq"]:{}}, "ea2c9d7b1f88014006c99aa69dfd3b59d9bb9ede058e2552d0d6d71b632916d6");
export type SwmrSeverity = "warn" | "error";
export const SwmrSeverityDescriptor = new _taut.EnumDescriptor("SwmrSeverity", "shape_swmr.SwmrSeverity", {["warn"]:0n,["error"]:1n}, {}, {["warn"]:{},["error"]:{}}, "2ff1ffff30b45099c556562922a71e3981e0784ec44c12a7c7fe3ae8a80e3fd8");
export type SwmrDiagCode = "push_after_terminal" | "delta_before_snapshot" | "writer_conflict" | "retention_bound_exceeded";
export const SwmrDiagCodeDescriptor = new _taut.EnumDescriptor("SwmrDiagCode", "shape_swmr.SwmrDiagCode", {["push_after_terminal"]:0n,["delta_before_snapshot"]:1n,["writer_conflict"]:2n,["retention_bound_exceeded"]:3n}, {}, {["push_after_terminal"]:{},["delta_before_snapshot"]:{},["writer_conflict"]:{},["retention_bound_exceeded"]:{}}, "3f5ceeacb3a48d90861f4a7d8d6daf788c77f1b5081598676017a083b27be30e");
export interface SwmrCursor {
  seq: bigint;
  epoch: bigint;
}
export type SwmrCursorFields = SwmrCursor & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrSnapshot {
  seq: bigint;
  payload: globalThis.Uint8Array;
}
export type SwmrSnapshotFields = SwmrSnapshot & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrDelta {
  base_seq: bigint;
  seq: bigint;
  payload: globalThis.Uint8Array;
}
export type SwmrDeltaFields = SwmrDelta & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrError {
  code: SwmrErrorCode;
  message: string | null;
}
export type SwmrErrorFields = SwmrError & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrSnapshotPush {
  writer_id: string;
  payload: globalThis.Uint8Array;
}
export type SwmrSnapshotPushFields = SwmrSnapshotPush & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrDeltaPush {
  writer_id: string;
  payload: globalThis.Uint8Array;
}
export type SwmrDeltaPushFields = SwmrDeltaPush & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrReset {
  writer_id: string;
  reason: SwmrResetReason;
  detail: globalThis.Uint8Array | null;
}
export type SwmrResetFields = SwmrReset & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrSeal {
}
export type SwmrSealFields = SwmrSeal & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrClose {
  error: SwmrError | null;
}
export type SwmrCloseFields = SwmrClose & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrReadRequest {
  swmr_id: string;
  stream_id: string;
  cursor: SwmrCursor | null;
  timeout_ms: bigint | null;
}
export type SwmrReadRequestFields = SwmrReadRequest & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrEndStream {
  swmr_id: string;
  stream_id: string;
}
export type SwmrEndStreamFields = SwmrEndStream & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrTimerExpired {
  token: bigint;
}
export type SwmrTimerExpiredFields = SwmrTimerExpired & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrReadResponse {
  swmr_id: string;
  stream_id: string;
  snapshot: SwmrSnapshot | null;
  deltas: globalThis.Array<SwmrDelta>;
  next_cursor: SwmrCursor | null;
  state: SwmrState;
  reset_reason: SwmrResetReason | null;
  error: SwmrError | null;
  reset_detail: globalThis.Uint8Array | null;
}
export type SwmrReadResponseFields = SwmrReadResponse & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrSetTimer {
  token: bigint;
  ms: bigint;
}
export type SwmrSetTimerFields = SwmrSetTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrCancelTimer {
  token: bigint;
}
export type SwmrCancelTimerFields = SwmrCancelTimer & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrProducerStop {
  reason: SwmrStopReason;
}
export type SwmrProducerStopFields = SwmrProducerStop & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export interface SwmrDiagnostic {
  severity: SwmrSeverity;
  code: SwmrDiagCode;
}
export type SwmrDiagnosticFields = SwmrDiagnostic & { __unknown__?: globalThis.Map<_taut.MapKey, _taut.CborValue> };
export const SwmrCursorDescriptor = new _taut.MessageDescriptor("SwmrCursor", "shape_swmr.SwmrCursor", 1, [
  new _taut.FieldDescriptor("seq", "seq", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("epoch", "epoch", 2, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "d5dbc73336b9d321670af6e3ec61a8a0fa7c4b5ed424ade0632503371aa86ec9");
export const SwmrCursorBinding: _taut.MessageBinding<SwmrCursor> = new _taut.MessageBinding<SwmrCursor>(SwmrCursorDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["seq"];
    case 1: return value["epoch"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrCursor => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrSnapshotDescriptor = new _taut.MessageDescriptor("SwmrSnapshot", "shape_swmr.SwmrSnapshot", 1, [
  new _taut.FieldDescriptor("seq", "seq", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 2, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "6eccaba0265c62c95ed71571f6e8dc43bedba4fd6068f41162559f365419c2f5");
export const SwmrSnapshotBinding: _taut.MessageBinding<SwmrSnapshot> = new _taut.MessageBinding<SwmrSnapshot>(SwmrSnapshotDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["seq"];
    case 1: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrSnapshot => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrDeltaDescriptor = new _taut.MessageDescriptor("SwmrDelta", "shape_swmr.SwmrDelta", 1, [
  new _taut.FieldDescriptor("base_seq", "base_seq", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("seq", "seq", 2, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 3, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "1b8877a41d904f0a9a46e30a11238e2aa58bd24cf8a93114f6c19fe37c8a09e7");
export const SwmrDeltaBinding: _taut.MessageBinding<SwmrDelta> = new _taut.MessageBinding<SwmrDelta>(SwmrDeltaDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["base_seq"];
    case 1: return value["seq"];
    case 2: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrDelta => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrErrorDescriptor = new _taut.MessageDescriptor("SwmrError", "shape_swmr.SwmrError", 1, [
  new _taut.FieldDescriptor("code", "code", 1, {kind:"enum", enum:()=>SwmrErrorCodeDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("message", "message", 2, {kind:"str"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "4ded4fed9179982493dc9e51246462961cdd762460569bd87908530197097b5e");
export const SwmrErrorBinding: _taut.MessageBinding<SwmrError> = new _taut.MessageBinding<SwmrError>(SwmrErrorDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["code"];
    case 1: return value["message"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrError => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrSnapshotPushDescriptor = new _taut.MessageDescriptor("SwmrSnapshotPush", "shape_swmr.SwmrSnapshotPush", 1, [
  new _taut.FieldDescriptor("writer_id", "writer_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 2, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "5fd182479fafb8abd0ab309878cecc09b8ba0087a130d5c7206e9017bc5d916b");
export const SwmrSnapshotPushBinding: _taut.MessageBinding<SwmrSnapshotPush> = new _taut.MessageBinding<SwmrSnapshotPush>(SwmrSnapshotPushDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["writer_id"];
    case 1: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrSnapshotPush => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrDeltaPushDescriptor = new _taut.MessageDescriptor("SwmrDeltaPush", "shape_swmr.SwmrDeltaPush", 1, [
  new _taut.FieldDescriptor("writer_id", "writer_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("payload", "payload", 2, {kind:"bytes"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "a3880ede5fb59910849ddabf62c65bdecc999a4f62f51854ddaa2bb0738ef71d");
export const SwmrDeltaPushBinding: _taut.MessageBinding<SwmrDeltaPush> = new _taut.MessageBinding<SwmrDeltaPush>(SwmrDeltaPushDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["writer_id"];
    case 1: return value["payload"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrDeltaPush => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrResetDescriptor = new _taut.MessageDescriptor("SwmrReset", "shape_swmr.SwmrReset", 1, [
  new _taut.FieldDescriptor("writer_id", "writer_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("reason", "reason", 2, {kind:"enum", enum:()=>SwmrResetReasonDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("detail", "detail", 3, {kind:"bytes"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "ba450ecf585cf0c62d5c2a6492b54612a4b883a209c2624b26f1de9e7588b6ab");
export const SwmrResetBinding: _taut.MessageBinding<SwmrReset> = new _taut.MessageBinding<SwmrReset>(SwmrResetDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["writer_id"];
    case 1: return value["reason"];
    case 2: return value["detail"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrReset => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrSealDescriptor = new _taut.MessageDescriptor("SwmrSeal", "shape_swmr.SwmrSeal", 1, [
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "4efac150bfe0949d05fd8d0f284345f8199ae4f0a50206c4d176e325c3e67388");
export const SwmrSealBinding: _taut.MessageBinding<SwmrSeal> = new _taut.MessageBinding<SwmrSeal>(SwmrSealDescriptor, (value, index) => {
  switch(index) {
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrSeal => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrCloseDescriptor = new _taut.MessageDescriptor("SwmrClose", "shape_swmr.SwmrClose", 1, [
  new _taut.FieldDescriptor("error", "error", 1, {kind:"message", binding:()=>SwmrErrorBinding}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "5331ff15101419b7829ec26b361046e65a084215bdb19ba35b88f3b3eb3f2ce3");
export const SwmrCloseBinding: _taut.MessageBinding<SwmrClose> = new _taut.MessageBinding<SwmrClose>(SwmrCloseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["error"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrClose => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrReadRequestDescriptor = new _taut.MessageDescriptor("SwmrReadRequest", "shape_swmr.SwmrReadRequest", 1, [
  new _taut.FieldDescriptor("swmr_id", "swmr_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("cursor", "cursor", 3, {kind:"message", binding:()=>SwmrCursorBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("timeout_ms", "timeout_ms", 4, {kind:"int"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "8926b3e5946cb9a80ab115e2e9257adc0c621bb906057e26b38ba37f8783982e");
export const SwmrReadRequestBinding: _taut.MessageBinding<SwmrReadRequest> = new _taut.MessageBinding<SwmrReadRequest>(SwmrReadRequestDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["swmr_id"];
    case 1: return value["stream_id"];
    case 2: return value["cursor"];
    case 3: return value["timeout_ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrReadRequest => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrEndStreamDescriptor = new _taut.MessageDescriptor("SwmrEndStream", "shape_swmr.SwmrEndStream", 1, [
  new _taut.FieldDescriptor("swmr_id", "swmr_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "72d5cbf532ddccd6dd78f9c92522553ee69474f8ccd34c95b3f386db781f73f1");
export const SwmrEndStreamBinding: _taut.MessageBinding<SwmrEndStream> = new _taut.MessageBinding<SwmrEndStream>(SwmrEndStreamDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["swmr_id"];
    case 1: return value["stream_id"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrEndStream => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrTimerExpiredDescriptor = new _taut.MessageDescriptor("SwmrTimerExpired", "shape_swmr.SwmrTimerExpired", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "47a59ac11db9cc8d13394c9d12977f73636eebde261ed9328d36e744c4be8df5");
export const SwmrTimerExpiredBinding: _taut.MessageBinding<SwmrTimerExpired> = new _taut.MessageBinding<SwmrTimerExpired>(SwmrTimerExpiredDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrTimerExpired => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrReadResponseDescriptor = new _taut.MessageDescriptor("SwmrReadResponse", "shape_swmr.SwmrReadResponse", 1, [
  new _taut.FieldDescriptor("swmr_id", "swmr_id", 1, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("stream_id", "stream_id", 2, {kind:"str"}, "required", false, false, {}),
  new _taut.FieldDescriptor("snapshot", "snapshot", 3, {kind:"message", binding:()=>SwmrSnapshotBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("deltas", "deltas", 4, {kind:"list", element:{kind:"message", binding:()=>SwmrDeltaBinding}}, "required", false, false, {}),
  new _taut.FieldDescriptor("next_cursor", "next_cursor", 5, {kind:"message", binding:()=>SwmrCursorBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("state", "state", 6, {kind:"enum", enum:()=>SwmrStateDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("reset_reason", "reset_reason", 7, {kind:"enum", enum:()=>SwmrResetReasonDescriptor}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("error", "error", 8, {kind:"message", binding:()=>SwmrErrorBinding}, "nullable", false, false, {}),
  new _taut.FieldDescriptor("reset_detail", "reset_detail", 9, {kind:"bytes"}, "nullable", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "dcc05d2abe4be870cb390ca31547e8121763fbe1c3f4c8664461bf1fd3e4d5e1");
export const SwmrReadResponseBinding: _taut.MessageBinding<SwmrReadResponse> = new _taut.MessageBinding<SwmrReadResponse>(SwmrReadResponseDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["swmr_id"];
    case 1: return value["stream_id"];
    case 2: return value["snapshot"];
    case 3: return value["deltas"];
    case 4: return value["next_cursor"];
    case 5: return value["state"];
    case 6: return value["reset_reason"];
    case 7: return value["error"];
    case 8: return value["reset_detail"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrReadResponse => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrSetTimerDescriptor = new _taut.MessageDescriptor("SwmrSetTimer", "shape_swmr.SwmrSetTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
  new _taut.FieldDescriptor("ms", "ms", 2, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "36a13a61edd862f29f3b9ab5e1c51d3ff42e960c0504a19918eae578c11c77fc");
export const SwmrSetTimerBinding: _taut.MessageBinding<SwmrSetTimer> = new _taut.MessageBinding<SwmrSetTimer>(SwmrSetTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    case 1: return value["ms"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrSetTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrCancelTimerDescriptor = new _taut.MessageDescriptor("SwmrCancelTimer", "shape_swmr.SwmrCancelTimer", 1, [
  new _taut.FieldDescriptor("token", "token", 1, {kind:"int"}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "5b650077db6bca4f49fe8eec4d4fd6be4af35cd48c7f4201810b740a57e49b14");
export const SwmrCancelTimerBinding: _taut.MessageBinding<SwmrCancelTimer> = new _taut.MessageBinding<SwmrCancelTimer>(SwmrCancelTimerDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["token"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrCancelTimer => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrProducerStopDescriptor = new _taut.MessageDescriptor("SwmrProducerStop", "shape_swmr.SwmrProducerStop", 1, [
  new _taut.FieldDescriptor("reason", "reason", 1, {kind:"enum", enum:()=>SwmrStopReasonDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "7534f7d37b2cf8df0074acb461ad581fceebf70a12545423ef50eaf307498d9b");
export const SwmrProducerStopBinding: _taut.MessageBinding<SwmrProducerStop> = new _taut.MessageBinding<SwmrProducerStop>(SwmrProducerStopDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["reason"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrProducerStop => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SwmrDiagnosticDescriptor = new _taut.MessageDescriptor("SwmrDiagnostic", "shape_swmr.SwmrDiagnostic", 1, [
  new _taut.FieldDescriptor("severity", "severity", 1, {kind:"enum", enum:()=>SwmrSeverityDescriptor}, "required", false, false, {}),
  new _taut.FieldDescriptor("code", "code", 2, {kind:"enum", enum:()=>SwmrDiagCodeDescriptor}, "required", false, false, {}),
], [
], [], [], [], null, {}, {["max_depth"]:32,["max_encoded_len"]:null}, "24f1c9c1f4350b198478da54f430cd7dbd76c622b55fcfba4464aa0f0591599a");
export const SwmrDiagnosticBinding: _taut.MessageBinding<SwmrDiagnostic> = new _taut.MessageBinding<SwmrDiagnostic>(SwmrDiagnosticDescriptor, (value, index) => {
  switch(index) {
    case 0: return value["severity"];
    case 1: return value["code"];
    default: throw new _taut.ConfigurationError("invalid/virtual typed field access");
  }
}, (value:unknown): value is SwmrDiagnostic => value !== null && typeof value === "object" && !globalThis.Array.isArray(value) && !(value instanceof globalThis.Map) && !(value instanceof globalThis.Uint8Array));
export const SCHEMA_DESCRIPTOR = new _taut.SchemaDescriptor("shape_swmr", 2, {["SwmrCursor"]:SwmrCursorDescriptor,["SwmrSnapshot"]:SwmrSnapshotDescriptor,["SwmrDelta"]:SwmrDeltaDescriptor,["SwmrError"]:SwmrErrorDescriptor,["SwmrSnapshotPush"]:SwmrSnapshotPushDescriptor,["SwmrDeltaPush"]:SwmrDeltaPushDescriptor,["SwmrReset"]:SwmrResetDescriptor,["SwmrSeal"]:SwmrSealDescriptor,["SwmrClose"]:SwmrCloseDescriptor,["SwmrReadRequest"]:SwmrReadRequestDescriptor,["SwmrEndStream"]:SwmrEndStreamDescriptor,["SwmrTimerExpired"]:SwmrTimerExpiredDescriptor,["SwmrReadResponse"]:SwmrReadResponseDescriptor,["SwmrSetTimer"]:SwmrSetTimerDescriptor,["SwmrCancelTimer"]:SwmrCancelTimerDescriptor,["SwmrProducerStop"]:SwmrProducerStopDescriptor,["SwmrDiagnostic"]:SwmrDiagnosticDescriptor}, {["SwmrMsgType"]:SwmrMsgTypeDescriptor,["SwmrState"]:SwmrStateDescriptor,["SwmrErrorCode"]:SwmrErrorCodeDescriptor,["SwmrStopReason"]:SwmrStopReasonDescriptor,["SwmrResetReason"]:SwmrResetReasonDescriptor,["SwmrSeverity"]:SwmrSeverityDescriptor,["SwmrDiagCode"]:SwmrDiagCodeDescriptor}, {}, {["max_depth"]:32,["max_encoded_len"]:null});
_taut.publish(SCHEMA_DESCRIPTOR, [SwmrCursorBinding, SwmrSnapshotBinding, SwmrDeltaBinding, SwmrErrorBinding, SwmrSnapshotPushBinding, SwmrDeltaPushBinding, SwmrResetBinding, SwmrSealBinding, SwmrCloseBinding, SwmrReadRequestBinding, SwmrEndStreamBinding, SwmrTimerExpiredBinding, SwmrReadResponseBinding, SwmrSetTimerBinding, SwmrCancelTimerBinding, SwmrProducerStopBinding, SwmrDiagnosticBinding]);
export const CODEC_SCHEMA = new _taut.schema.SchemaIndex({["version"]:2,["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["enums"]:[{["name"]:"SwmrMsgType",["options"]:{},["members"]:{["snapshot_push"]:0n,["delta_push"]:1n,["reset"]:2n,["seal"]:3n,["close"]:4n,["read"]:5n,["end_stream"]:6n,["timer_expired"]:7n,["read_response"]:8n,["set_timer"]:9n,["cancel_timer"]:10n,["producer_stop"]:11n,["diagnostic"]:12n},["member_options"]:{["snapshot_push"]:{},["delta_push"]:{},["reset"]:{},["seal"]:{},["close"]:{},["read"]:{},["end_stream"]:{},["timer_expired"]:{},["read_response"]:{},["set_timer"]:{},["cancel_timer"]:{},["producer_stop"]:{},["diagnostic"]:{}}},{["name"]:"SwmrState",["options"]:{},["members"]:{["data"]:0n,["would_block"]:1n,["eof"]:2n,["closed"]:3n,["failed"]:4n,["reset"]:5n},["member_options"]:{["data"]:{},["would_block"]:{},["eof"]:{},["closed"]:{},["failed"]:{},["reset"]:{}}},{["name"]:"SwmrErrorCode",["options"]:{},["members"]:{["unknown_swmr"]:0n,["producer_error"]:1n,["internal"]:2n},["member_options"]:{["unknown_swmr"]:{},["producer_error"]:{},["internal"]:{}}},{["name"]:"SwmrStopReason",["options"]:{},["members"]:{["last_reader_gone"]:0n,["closed"]:1n,["failed"]:2n},["member_options"]:{["last_reader_gone"]:{},["closed"]:{},["failed"]:{}}},{["name"]:"SwmrResetReason",["options"]:{},["members"]:{["producer_requested"]:0n,["retention_exceeded"]:1n,["invalid_resume_seq"]:2n},["member_options"]:{["producer_requested"]:{},["retention_exceeded"]:{},["invalid_resume_seq"]:{}}},{["name"]:"SwmrSeverity",["options"]:{},["members"]:{["warn"]:0n,["error"]:1n},["member_options"]:{["warn"]:{},["error"]:{}}},{["name"]:"SwmrDiagCode",["options"]:{},["members"]:{["push_after_terminal"]:0n,["delta_before_snapshot"]:1n,["writer_conflict"]:2n,["retention_bound_exceeded"]:3n},["member_options"]:{["push_after_terminal"]:{},["delta_before_snapshot"]:{},["writer_conflict"]:{},["retention_bound_exceeded"]:{}}}],["messages"]:[{["name"]:"SwmrCursor",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"epoch",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrSnapshot",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrDelta",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"base_seq",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"seq",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:3,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrError",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"code",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"SwmrErrorCode"},["optional"]:false,["transient"]:false},{["name"]:"message",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:true,["transient"]:false}]},{["name"]:"SwmrSnapshotPush",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"writer_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrDeltaPush",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"writer_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"payload",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrReset",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"writer_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"reason",["tag"]:2,["options"]:{},["type"]:{["k"]:"enum",["name"]:"SwmrResetReason"},["optional"]:false,["transient"]:false},{["name"]:"detail",["tag"]:3,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:true,["transient"]:false}]},{["name"]:"SwmrSeal",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[]},{["name"]:"SwmrClose",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"error",["tag"]:1,["options"]:{},["type"]:{["k"]:"msg",["name"]:"SwmrError"},["optional"]:true,["transient"]:false}]},{["name"]:"SwmrReadRequest",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"swmr_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"cursor",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"SwmrCursor"},["optional"]:true,["transient"]:false},{["name"]:"timeout_ms",["tag"]:4,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:true,["transient"]:false}]},{["name"]:"SwmrEndStream",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"swmr_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrTimerExpired",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrReadResponse",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"swmr_id",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"stream_id",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"str"},["optional"]:false,["transient"]:false},{["name"]:"snapshot",["tag"]:3,["options"]:{},["type"]:{["k"]:"msg",["name"]:"SwmrSnapshot"},["optional"]:true,["transient"]:false},{["name"]:"deltas",["tag"]:4,["options"]:{},["type"]:{["k"]:"list",["elem"]:{["k"]:"msg",["name"]:"SwmrDelta"}},["optional"]:false,["transient"]:false},{["name"]:"next_cursor",["tag"]:5,["options"]:{},["type"]:{["k"]:"msg",["name"]:"SwmrCursor"},["optional"]:true,["transient"]:false},{["name"]:"state",["tag"]:6,["options"]:{},["type"]:{["k"]:"enum",["name"]:"SwmrState"},["optional"]:false,["transient"]:false},{["name"]:"reset_reason",["tag"]:7,["options"]:{},["type"]:{["k"]:"enum",["name"]:"SwmrResetReason"},["optional"]:true,["transient"]:false},{["name"]:"error",["tag"]:8,["options"]:{},["type"]:{["k"]:"msg",["name"]:"SwmrError"},["optional"]:true,["transient"]:false},{["name"]:"reset_detail",["tag"]:9,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"bytes"},["optional"]:true,["transient"]:false}]},{["name"]:"SwmrSetTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false},{["name"]:"ms",["tag"]:2,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrCancelTimer",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"token",["tag"]:1,["options"]:{},["type"]:{["k"]:"scalar",["scalar"]:"int"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrProducerStop",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"reason",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"SwmrStopReason"},["optional"]:false,["transient"]:false}]},{["name"]:"SwmrDiagnostic",["options"]:{},["effective"]:{["max_depth"]:32,["max_encoded_len"]:null},["fields"]:[{["name"]:"severity",["tag"]:1,["options"]:{},["type"]:{["k"]:"enum",["name"]:"SwmrSeverity"},["optional"]:false,["transient"]:false},{["name"]:"code",["tag"]:2,["options"]:{},["type"]:{["k"]:"enum",["name"]:"SwmrDiagCode"},["optional"]:false,["transient"]:false}]}],["services"]:[]} as _taut.schema.Schema);
