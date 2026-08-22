import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  SnapshotDeltaNode,
  type SnapshotDeltaOutput,
} from "../src/snapshot_delta.ts";
import {
  swmrInput,
  swmrOutput,
  type SwmrWireMessage,
} from "../src/swmr/oracle.ts";

interface Vector {
  name: string;
  node: { stop_when: "last_reader" | "explicit_only"; max_deltas: number };
  steps: { in: SwmrWireMessage; out: SwmrWireMessage[] }[];
}

const path = new URL("../../taut-shape/corpus/snapshot_delta.profile.v1.json", import.meta.url);
const corpus = JSON.parse(readFileSync(path, "utf8")) as {
  shape: string;
  core: string;
  version: string;
  vectors: Vector[];
};

function outputJson(output: SnapshotDeltaOutput): SwmrWireMessage {
  if (output.type === "refresh_required") return { ...output };
  return swmrOutput(output);
}

test("snapshot_delta profile corpus is pinned", () => {
  assert.deepEqual(
    [corpus.shape, corpus.core, corpus.version, corpus.vectors.length],
    ["snapshot_delta", "swmr", "snapshot_delta.profile/v1", 4],
  );
});

for (const vector of corpus.vectors) {
  test(`snapshot_delta profile vector: ${vector.name}`, () => {
    const node = new SnapshotDeltaNode({
      stopWhen: vector.node.stop_when,
      maxDeltas: vector.node.max_deltas,
    });
    assert.equal(node.recoveryPolicy, "expire");
    for (const step of vector.steps) {
      assert.deepEqual(node.handle(swmrInput(step.in)).map(outputJson), step.out);
    }
  });
}
