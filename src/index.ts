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
