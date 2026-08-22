import type { StopWhen } from "./log/node.ts";
import type { SwmrResetReason } from "./taut/gen/shape_swmr.ts";
import {
  SwmrNode,
  type SwmrInput,
  type SwmrOutput,
  type SwmrRecoveryPolicy,
} from "./swmr/engine.ts";

export interface SnapshotDeltaRefreshRequired {
  readonly type: "refresh_required";
  readonly swmr_id: string;
  readonly stream_id: string;
  readonly reason: "retention_expired" | "invalid_cursor" | "source_changed";
}

export type SnapshotDeltaOutput = SwmrOutput | SnapshotDeltaRefreshRequired;

function refreshReason(
  reason: SwmrResetReason | null,
): SnapshotDeltaRefreshRequired["reason"] {
  if (reason === "retention_exceeded") return "retention_expired";
  if (reason === "invalid_resume_seq") return "invalid_cursor";
  return "source_changed";
}

export function projectSnapshotDeltaOutput(output: SwmrOutput): SnapshotDeltaOutput {
  if (output.type === "read_response" && output.state === "reset") {
    return {
      type: "refresh_required",
      swmr_id: output.swmr_id,
      stream_id: output.stream_id,
      reason: refreshReason(output.reset_reason),
    };
  }
  return output;
}

export interface SnapshotDeltaNodeOptions {
  readonly stopWhen?: StopWhen;
  readonly maxDeltas?: number;
}

/** Fixed expiry profile over one shared SWMR store/resolver. */
export class SnapshotDeltaNode {
  readonly recoveryPolicy: SwmrRecoveryPolicy = "expire";
  private readonly core: SwmrNode;

  constructor(options: SnapshotDeltaNodeOptions = {}) {
    const maxDeltas = options.maxDeltas ?? 64;
    if (!Number.isSafeInteger(maxDeltas) || maxDeltas <= 0) {
      throw new RangeError("snapshot_delta maxDeltas must be a positive safe integer");
    }
    this.core = new SwmrNode({
      stopWhen: options.stopWhen,
      maxDeltas,
      recoveryPolicy: this.recoveryPolicy,
    });
  }

  handle(input: SwmrInput): readonly SnapshotDeltaOutput[] {
    return this.core.handle(input).map(projectSnapshotDeltaOutput);
  }
}
