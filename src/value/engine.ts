import type {
  ValueDiagnostic,
  ValueReadRequest,
  ValueReadResponse,
  ValueSet,
} from "../taut/gen/shape_value.ts";

export type ValueInput =
  | ({ readonly type: "set" } & ValueSet)
  | ({ readonly type: "read" } & ValueReadRequest);

export type ValueOutput =
  | ({ readonly type: "read_response" } & ValueReadResponse)
  | ({ readonly type: "diagnostic" } & ValueDiagnostic);

function bytesEqual(left: Uint8Array | null, right: Uint8Array | null): boolean {
  if (left === null || right === null) return left === right;
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

function cloneBytes(value: Uint8Array | null): Uint8Array | null {
  return value === null ? null : value.slice();
}

/** Pure attributed LWW register implementing `value.oracle/v0`. */
export class ValueNode {
  private readonly ops = new Map<string, ValueSet>();

  handle(input: ValueInput): readonly ValueOutput[] {
    if (input.type === "set") return this.set(input);
    return [this.read(input)];
  }

  get size(): number {
    return this.ops.size;
  }

  private set(input: { readonly type: "set" } & ValueSet): readonly ValueOutput[] {
    const key = `${input.origin}\u0000${input.seq}`;
    const prior = this.ops.get(key);
    if (prior !== undefined) {
      if (!bytesEqual(prior.payload, input.payload) || !bytesEqual(prior.prev, input.prev)) {
        return [{ type: "diagnostic", severity: "error", code: "equivocation" }];
      }
      return [];
    }
    this.ops.set(key, {
      origin: input.origin,
      seq: input.seq,
      lamport: input.lamport,
      prev: cloneBytes(input.prev),
      payload: input.payload.slice(),
    });
    return [];
  }

  private read(request: { readonly type: "read" } & ValueReadRequest): ValueOutput {
    let winner: ValueSet | undefined;
    for (const op of this.ops.values()) {
      if (
        winner === undefined
        || op.lamport > winner.lamport
        || (op.lamport === winner.lamport && op.origin > winner.origin)
        || (op.lamport === winner.lamport && op.origin === winner.origin && op.seq > winner.seq)
      ) {
        winner = op;
      }
    }
    if (winner === undefined) {
      return {
        type: "read_response",
        value_id: request.value_id,
        stream_id: request.stream_id,
        value: null,
        winner: null,
        state: "empty",
      };
    }
    return {
      type: "read_response",
      value_id: request.value_id,
      stream_id: request.stream_id,
      value: winner.payload.slice(),
      winner: {
        origin: winner.origin,
        seq: winner.seq,
        lamport: winner.lamport,
      },
      state: "data",
    };
  }
}
