import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { AtomNode } from "../src/atom/engine.ts";
import {
  atomInput,
  atomOutput,
  expectedAtomOutput,
  type AtomWireMessage,
} from "../src/atom/oracle.ts";

interface AtomVector {
  readonly name: string;
  readonly node: { readonly stop_when: "last_reader" | "explicit_only" };
  readonly steps: readonly {
    readonly in: AtomWireMessage;
    readonly out: readonly AtomWireMessage[];
  }[];
}

const path = fileURLToPath(new URL("../../taut-shape/corpus/atom.v1.json", import.meta.url));
const corpus = JSON.parse(readFileSync(path, "utf8")) as {
  shape: string;
  version: string;
  vectors: readonly AtomVector[];
};

test("atom corpus is pinned and complete", () => {
  assert.equal(corpus.shape, "atom");
  assert.equal(corpus.version, "atom.oracle/v1");
  assert.equal(corpus.vectors.length, 28);
});

for (const vector of corpus.vectors) {
  test(`atom oracle vector: ${vector.name}`, () => {
    const node = new AtomNode({ stopWhen: vector.node.stop_when });
    const actual = vector.steps.map((step) => ({
      in: step.in,
      out: node.handle(atomInput(step.in)).map(atomOutput),
    }));
    const expected = vector.steps.map((step) => ({
      in: step.in,
      out: step.out.map(expectedAtomOutput),
    }));
    assert.deepEqual(actual, expected);
  });
}

test("atom releases a large held set once in creation order", () => {
  const node = new AtomNode();
  for (let index = 0; index < 2_000; index++) {
    assert.deepEqual(node.handle({
      type: "read",
      atom_id: "atom-A",
      stream_id: `s${String(index).padStart(4, "0")}`,
      version: { version: 0n },
      timeout_ms: null,
    }), []);
  }
  const outputs = node.handle({ type: "replace", payload: new TextEncoder().encode("ready") });
  assert.equal(outputs.length, 2_000);
  assert.deepEqual(
    outputs.filter((output) => output.type === "read_response").map((output) => output.stream_id),
    Array.from({ length: 2_000 }, (_, index) => `s${String(index).padStart(4, "0")}`),
  );
});
