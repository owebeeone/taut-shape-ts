import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { SwmrNode } from "../src/swmr/engine.ts";
import {
  expectedSwmrOutput,
  swmrInput,
  swmrOutput,
  type SwmrWireMessage,
} from "../src/swmr/oracle.ts";

interface SwmrVector {
  readonly name: string;
  readonly node: {
    readonly stop_when: "last_reader" | "explicit_only";
    readonly max_deltas?: number;
  };
  readonly steps: readonly {
    readonly in: SwmrWireMessage;
    readonly out: readonly SwmrWireMessage[];
  }[];
}

const path = fileURLToPath(new URL("../../taut-shape/corpus/swmr.v1.json", import.meta.url));
const corpus = JSON.parse(readFileSync(path, "utf8")) as {
  shape: string;
  version: string;
  vectors: readonly SwmrVector[];
};

test("swmr corpus is pinned and complete", () => {
  assert.equal(corpus.shape, "swmr");
  assert.equal(corpus.version, "swmr.oracle/v1");
  assert.equal(corpus.vectors.length, 33);
});

for (const vector of corpus.vectors) {
  test(`swmr oracle vector: ${vector.name}`, () => {
    const node = new SwmrNode({
      stopWhen: vector.node.stop_when,
      maxDeltas: vector.node.max_deltas,
    });
    const actual = vector.steps.map((step) => ({
      in: step.in,
      out: node.handle(swmrInput(step.in)).map(swmrOutput),
    }));
    const expected = vector.steps.map((step) => ({
      in: step.in,
      out: step.out.map(expectedSwmrOutput),
    }));
    assert.deepEqual(actual, expected);
  });
}

test("swmr releases a large held set once in creation order", () => {
  const node = new SwmrNode();
  for (let index = 0; index < 2_000; index++) {
    assert.deepEqual(node.handle({
      type: "read",
      swmr_id: "swmr-A",
      stream_id: `s${String(index).padStart(4, "0")}`,
      cursor: null,
      timeout_ms: null,
    }), []);
  }
  const outputs = node.handle({
    type: "snapshot_push",
    writer_id: "writer-A",
    payload: new TextEncoder().encode("ready"),
  });
  assert.equal(outputs.length, 2_000);
  assert.deepEqual(
    outputs.filter((output) => output.type === "read_response").map((output) => output.stream_id),
    Array.from({ length: 2_000 }, (_, index) => `s${String(index).padStart(4, "0")}`),
  );
});
