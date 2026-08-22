import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ValueNode } from "../src/value/engine.ts";
import {
  expectedValueOutput,
  valueInput,
  valueOutput,
  type ValueWireMessage,
} from "../src/value/oracle.ts";
import { ValueAdapter } from "../src/value/adapter.ts";
import { VALUE_FRAME_CODEC } from "../src/value/wire.ts";

interface ValueVector {
  readonly name: string;
  readonly steps: readonly {
    readonly in: ValueWireMessage;
    readonly out: readonly ValueWireMessage[];
  }[];
}

const path = fileURLToPath(new URL("../../taut-shape/corpus/value.v0.json", import.meta.url));
const corpus = JSON.parse(readFileSync(path, "utf8")) as {
  shape: string;
  version: string;
  vectors: readonly ValueVector[];
};

test("value corpus is pinned and complete", () => {
  assert.equal(corpus.shape, "value");
  assert.equal(corpus.version, "value.oracle/v0");
  assert.equal(corpus.vectors.length, 13);
});

test("value wire preserves the full signed i64 range", () => {
  const adapter = new ValueAdapter();
  const set = VALUE_FRAME_CODEC.encode("set", {
    origin: "extreme",
    seq: (1n << 63n) - 1n,
    lamport: -(1n << 63n),
    prev: null,
    payload: new Uint8Array([1]),
  });
  const decoded = VALUE_FRAME_CODEC.decode(set.tag, set.body);
  assert.equal(decoded.native.seq, (1n << 63n) - 1n);
  assert.equal(decoded.native.lamport, -(1n << 63n));

  assert.deepEqual(adapter.dispatch(adapter.decodeInput(decoded)), []);
  const [effect] = adapter.dispatch(adapter.decodeInput({
    type: "read",
    native: { value_id: "v", stream_id: "s" },
  })).map((output) => adapter.encodeOutput(output));
  const response = VALUE_FRAME_CODEC.encode(effect!.frame.type, effect!.frame.native);
  const roundTrip = VALUE_FRAME_CODEC.decode(response.tag, response.body);
  assert.equal(roundTrip.native.winner.seq, (1n << 63n) - 1n);
  assert.equal(roundTrip.native.winner.lamport, -(1n << 63n));
});

for (const vector of corpus.vectors) {
  test(`value oracle vector: ${vector.name}`, () => {
    const node = new ValueNode();
    const actual = vector.steps.map((step) => ({
      in: step.in,
      out: node.handle(valueInput(step.in)).map(valueOutput),
    }));
    const expected = vector.steps.map((step) => ({
      in: step.in,
      out: step.out.map(expectedValueOutput),
    }));
    assert.deepEqual(actual, expected);
  });
}
