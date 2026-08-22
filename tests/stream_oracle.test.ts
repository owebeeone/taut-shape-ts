import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { StreamNode } from "../src/stream/engine.ts";
import {
  expectedStreamOutput,
  streamInput,
  streamOutput,
  type StreamWireMessage,
} from "../src/stream/oracle.ts";

interface StreamVector {
  readonly name: string;
  readonly node: {
    readonly capacity_records: number;
    readonly stop_when: "last_reader" | "explicit_only";
  };
  readonly steps: readonly {
    readonly in: StreamWireMessage;
    readonly out: readonly StreamWireMessage[];
  }[];
}

const path = fileURLToPath(new URL("../../taut-shape/corpus/stream.v1.json", import.meta.url));
const corpus = JSON.parse(readFileSync(path, "utf8")) as {
  shape: string;
  version: string;
  vectors: readonly StreamVector[];
};

test("stream corpus is pinned and complete", () => {
  assert.equal(corpus.shape, "stream");
  assert.equal(corpus.version, "stream.oracle/v1");
  assert.equal(corpus.vectors.length, 28);
});

for (const vector of corpus.vectors) {
  test(`stream oracle vector: ${vector.name}`, () => {
    const node = new StreamNode({
      capacityRecords: vector.node.capacity_records,
      stopWhen: vector.node.stop_when,
    });
    const actual = vector.steps.map((step) => ({
      in: step.in,
      out: node.handle(streamInput(step.in)).map(streamOutput),
    }));
    const expected = vector.steps.map((step) => ({
      in: step.in,
      out: step.out.map(expectedStreamOutput),
    }));
    assert.deepEqual(actual, expected);
  });
}

test("stream capacity must be positive", () => {
  assert.throws(() => new StreamNode({ capacityRecords: 0 }), /positive/);
});

test("stream releases a large held set once in creation order", () => {
  const node = new StreamNode();
  for (let index = 0; index < 2_000; index++) {
    assert.deepEqual(node.handle({
      type: "read",
      stream_id: `s${String(index).padStart(4, "0")}`,
      max_records: null,
      max_bytes: null,
      timeout_ms: null,
    }), []);
  }
  const outputs = node.handle({ type: "push", payload: new TextEncoder().encode("ready") });
  assert.equal(outputs.length, 2_000);
  assert.deepEqual(
    outputs.filter((output) => output.type === "read_response").map((output) => output.stream_id),
    Array.from({ length: 2_000 }, (_, index) => `s${String(index).padStart(4, "0")}`),
  );
});
