import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CrdtNode } from "../src/crdt/engine.ts";
import { canonicalCrdt, crdtInput, crdtOutput, type CrdtWireMessage } from "../src/crdt/oracle.ts";
import { projectText } from "../src/crdt/text.ts";

const corpusDir = fileURLToPath(new URL("../../taut-shape/corpus/", import.meta.url));
const mailbox = JSON.parse(readFileSync(`${corpusDir}/crdt.v1.json`, "utf8"));
const convergence = JSON.parse(readFileSync(`${corpusDir}/crdt.convergence.v1.json`, "utf8"));
const text = JSON.parse(readFileSync(`${corpusDir}/text_crdt.profile.v1.json`, "utf8"));

for (const vector of mailbox.vectors) test(`CRDT oracle: ${vector.name}`, () => {
  const node = new CrdtNode({ maxPending: vector.node.max_pending ?? 1024 });
  const actual = vector.steps.map((step: { in: CrdtWireMessage }) => ({ in: step.in, out: node.handle(crdtInput(step.in)).map(crdtOutput) }));
  const expected = vector.steps.map((step: { in: CrdtWireMessage; out: CrdtWireMessage[] }) => ({ in: step.in, out: step.out.map(canonicalCrdt) }));
  assert.deepEqual(actual, expected);
});

function canonical(node: CrdtNode, diagnostics: CrdtWireMessage[], includeText: boolean) {
  const result: Record<string, unknown> = {
    clock: { entries: node.clock.entries.map((entry) => ({ origin: entry.origin, seq: String(entry.seq) })) },
    ops: node.operations.map((op) => ({ origin: op.origin, seq: String(op.seq), deps: { entries: op.deps.entries.map((entry) => ({ origin: entry.origin, seq: String(entry.seq) })) }, payload: Buffer.from(op.payload).toString("base64") })),
    diagnostics: [...new Set(diagnostics.map((row) => JSON.stringify([row.code, row.origin, row.seq])))].map((row) => JSON.parse(row)).sort(),
  };
  if (includeText) result.projection = projectText(node);
  return result;
}

for (const [suite, includeText] of [[convergence, false], [text, true]] as const) {
  test(`${suite.version} all replica orders converge`, () => {
    for (const scenario of suite.scenarios) for (const replica of scenario.replicas) {
      const node = new CrdtNode({ maxPending: scenario.max_pending });
      const diagnostics: CrdtWireMessage[] = [];
      if (scenario.bootstrap !== null) diagnostics.push(...node.handle(crdtInput({ type: "install_bootstrap", bootstrap: scenario.bootstrap })).map(crdtOutput));
      for (const index of replica.order) diagnostics.push(...node.handle(crdtInput({ type: "apply", op: scenario.ops[index] })).map(crdtOutput));
      assert.deepEqual(canonical(node, diagnostics, includeText), scenario.expect, `${scenario.name}/${replica.name}`);
    }
  });
}

test("CRDT reverse causal chain drains iteratively", () => {
  const node = new CrdtNode({ maxPending: 2000 });
  for (let seq = 2000; seq > 0; seq--) node.handle({ type: "apply", op: { origin: "a", seq: BigInt(seq), deps: { entries: [] }, payload: new Uint8Array([1]) } });
  assert.equal(node.clock.entries[0]?.seq, 2000n);
});
