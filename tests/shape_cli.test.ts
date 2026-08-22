import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { SUPPORTED_ENGINE_SHAPES } from "../src/runtime.ts";

const CLI = fileURLToPath(new URL("../src/cli.ts", import.meta.url));

test("CLI advertises the exact implemented engine shapes", () => {
  assert.deepEqual(SUPPORTED_ENGINE_SHAPES, [
    "atom",
    "crdt",
    "log",
    "snapshot_delta",
    "stream",
    "swmr",
    "text_crdt",
    "value",
  ]);
});

test("unsupported shape exits before node or client data-channel startup", () => {
  for (const mode of ["node", "client"] as const) {
    const result = spawnSync(
      process.execPath,
      ["--experimental-strip-types", CLI, mode, "--shape", "window"],
      { encoding: "utf8", input: Buffer.from([1, 0, 0, 0, 99]) },
    );
    assert.equal(result.status, 2, `${mode} unsupported shape exit`);
    assert.equal(result.stdout, "", `${mode} did not start the data channel`);
    assert.match(result.stderr, /TAUT_SHAPE_UNSUPPORTED_SHAPE/);
    assert.match(result.stderr, /window/);
  }
});
