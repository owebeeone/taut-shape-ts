// Primary golden (Phase 2, S2.2): replay every committed oracle vector through
// LogNode.handle and assert the WHOLE observed output-message sequence exactly
// equals the expected sequence — normalized through the jsoncodec on both sides
// (§6.1). Never per-field assertions.
//
// RUNNER DEVIATION: the plan pins vitest, but offline `npm install` fails in this
// environment (no network, incomplete cache). Per the task's stated fallback we
// use node:test + native --experimental-strip-types, zero external deps. The
// engine and oracle loader are runner-agnostic; swapping back to vitest is a
// test-harness change only (import { test } from "vitest").

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { LogNode } from "../src/log/node.ts";
import {
  loadCorpus,
  toInput,
  fromOutput,
  expectedOutput,
  vectorLogId,
  type WireMsg,
} from "../src/log/oracle.ts";

const CORPUS_PATH = fileURLToPath(
  new URL("../../taut-shape/corpus/log.v0.json", import.meta.url),
);

const corpus = loadCorpus(JSON.parse(readFileSync(CORPUS_PATH, "utf8")));

test("corpus is the log shape at the pinned version", () => {
  assert.equal(corpus.shape, "log");
  assert.equal(corpus.version, "log.oracle/v0");
  assert.ok(corpus.vectors.length > 0);
});

for (const vector of corpus.vectors) {
  test(`oracle vector: ${vector.name}`, () => {
    const stopWhen = vector.node.stop_when === "last_reader" ? "last_reader" : "explicit_only";
    const node = new LogNode({ stopWhen });
    const logId = vectorLogId(vector);

    const observed: WireMsg[] = [];
    const expected: WireMsg[] = [];

    for (const step of vector.steps) {
      const outs = node.handle(toInput(step.in));
      for (const o of outs) observed.push(fromOutput(o, logId));
      for (const e of step.out) expected.push(expectedOutput(e));
    }

    // Whole-output equality: the entire observed sequence must match the entire
    // expected sequence, message-for-message, field-for-field (canonical form).
    assert.deepEqual(observed, expected, `vector ${vector.name} output sequence mismatch`);
  });
}
