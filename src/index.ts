// Public barrel. Phases 0–2: the message vocabulary + the pure engine. (The
// shell, stream sugar, service, and CLI land in Phases 3–4 per InitialPlan §5.)

export type {
  Cursor,
  LogRecord,
  LogError,
  LogInput,
  LogOutput,
  LogResponse,
  LogState,
  LogErrorCode,
  LogStopReason,
  LogSeverity,
  LogDiagCode,
} from "./log/messages.ts";
export { START } from "./log/messages.ts";

export { LogNode } from "./log/node.ts";
export type { LogNodeOptions, StopWhen } from "./log/node.ts";

export { ValueNode } from "./value/engine.ts";
export type { ValueInput, ValueOutput } from "./value/engine.ts";
export type {
  ValueDiagCode,
  ValueDiagnostic,
  ValueMsgType,
  ValueReadRequest,
  ValueReadResponse,
  ValueSet,
  ValueSeverity,
  ValueStamp,
  ValueState,
} from "./taut/gen/shape_value.ts";

export { AtomNode } from "./atom/engine.ts";
export type { AtomInput, AtomNodeOptions, AtomOutput } from "./atom/engine.ts";
export type {
  AtomCancelTimer,
  AtomClose,
  AtomDiagCode,
  AtomDiagnostic,
  AtomEndStream,
  AtomError,
  AtomErrorCode,
  AtomMsgType,
  AtomProducerStop,
  AtomReadRequest,
  AtomReadResponse,
  AtomReplace,
  AtomSeal,
  AtomSetTimer,
  AtomSeverity,
  AtomState,
  AtomStopReason,
  AtomTimerExpired,
  AtomValue,
  AtomVersion,
} from "./taut/gen/shape_atom.ts";

export { StreamNode } from "./stream/engine.ts";
export type { StreamInput, StreamNodeOptions, StreamOutput } from "./stream/engine.ts";
export type {
  StreamCancelTimer,
  StreamClose,
  StreamDiagCode,
  StreamDiagnostic,
  StreamEndStream,
  StreamError,
  StreamErrorCode,
  StreamMsgType,
  StreamPosition,
  StreamProducerStop,
  StreamPush,
  StreamReadRequest,
  StreamReadResponse,
  StreamRecord,
  StreamSeal,
  StreamSetTimer,
  StreamSeverity,
  StreamState,
  StreamStopReason,
  StreamTimerExpired,
} from "./taut/gen/shape_stream.ts";

export { SwmrNode } from "./swmr/engine.ts";
export type {
  SwmrInput,
  SwmrNodeOptions,
  SwmrOutput,
  SwmrRecoveryPolicy,
} from "./swmr/engine.ts";
export { SwmrAdapter } from "./swmr/adapter.ts";
export {
  SnapshotDeltaNode,
  projectSnapshotDeltaOutput,
} from "./snapshot_delta.ts";
export type {
  SnapshotDeltaNodeOptions,
  SnapshotDeltaOutput,
  SnapshotDeltaRefreshRequired,
} from "./snapshot_delta.ts";
export type {
  SwmrCancelTimer,
  SwmrClose,
  SwmrCursor,
  SwmrDelta,
  SwmrDeltaPush,
  SwmrDiagCode,
  SwmrDiagnostic,
  SwmrEndStream,
  SwmrError,
  SwmrErrorCode,
  SwmrMsgType,
  SwmrProducerStop,
  SwmrReadRequest,
  SwmrReadResponse,
  SwmrReset,
  SwmrResetReason,
  SwmrSeal,
  SwmrSetTimer,
  SwmrSeverity,
  SwmrSnapshot,
  SwmrSnapshotPush,
  SwmrState,
  SwmrStopReason,
  SwmrTimerExpired,
} from "./taut/gen/shape_swmr.ts";

export { CrdtNode } from "./crdt/engine.ts";
export type { CrdtInput, CrdtNodeOptions, CrdtOutput } from "./crdt/engine.ts";
export { encodeTextDelete, encodeTextInsert, projectText } from "./crdt/text.ts";
export type { TextProjection } from "./crdt/text.ts";
export type {
  CrdtApply,
  CrdtBootstrap,
  CrdtClock,
  CrdtClockEntry,
  CrdtClose,
  CrdtDiagCode,
  CrdtDiagnostic,
  CrdtError,
  CrdtErrorCode,
  CrdtInstallBootstrap,
  CrdtMsgType,
  CrdtOp,
  CrdtReadRequest,
  CrdtReadResponse,
  CrdtSeal,
  CrdtSeverity,
  CrdtState,
} from "./taut/gen/shape_crdt.ts";
