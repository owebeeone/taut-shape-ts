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
} from "./messages.ts";
export { START } from "./messages.ts";

export { LogNode } from "./node.ts";
export type { LogNodeOptions, StopWhen } from "./node.ts";
