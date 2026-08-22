// CLI self-pair over pipes (Phase 4, S4.1/S4.2, TautShapeOracle §7). Spawns the
// TS `node` mode and the TS `client` mode as two subprocesses with CROSSED pipes
// — client stdout -> node stdin, node stdout -> client stdin, both drained
// concurrently — exactly the interop-matrix wiring. A --script drives the
// producer deterministically (no clock, no timeout_ms). Asserts the client's OOB
// transcript (jsoncodec form) and clean exit on both sides.
//
// This is the ts<->ts baseline of the interop matrix; the same framing bytes are
// what the rs/py peers speak, so a green self-pair is the precondition for a
// green cross-language pairing.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../src/cli.ts", import.meta.url));

interface PairResult {
  clientExit: number | null;
  nodeExit: number | null;
  transcript: Record<string, unknown>[];
}

/** Run one node<->client pairing over crossed pipes with the given producer
 *  script and client flags. Resolves once both processes exit. */
function selfPair(
  script: unknown,
  nodeArgs: string[],
  clientArgs: string[],
): Promise<PairResult> {
  const dir = mkdtempSync(join(tmpdir(), "taut-shape-cli-"));
  const scriptPath = join(dir, "script.json");
  writeFileSync(scriptPath, JSON.stringify(script));

  const strip = "--experimental-strip-types";
  const node = spawn(
    process.execPath,
    [strip, CLI, "node", ...nodeArgs, "--script", scriptPath],
    { stdio: ["pipe", "pipe", "inherit"] },
  );
  const client = spawn(process.execPath, [strip, CLI, "client", ...clientArgs], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Crossed pipes — the data channel under test.
  client.stdout.pipe(node.stdin);
  node.stdout.pipe(client.stdin);

  let stderr = "";
  client.stderr.on("data", (d) => (stderr += d));

  return new Promise((resolve, reject) => {
    let clientExit: number | null = null;
    let nodeExit: number | null = null;
    let done = 0;
    const finish = () => {
      if (++done < 2) return;
      const transcript = stderr
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .map((l) => JSON.parse(l) as Record<string, unknown>);
      resolve({ clientExit, nodeExit, transcript });
    };
    client.on("error", reject);
    node.on("error", reject);
    client.on("exit", (code) => {
      clientExit = code;
      // Client is done reading; close the node's input so it drains to EOF.
      node.stdin.end();
      finish();
    });
    node.on("exit", (code) => {
      nodeExit = code;
      finish();
    });
  });
}

test("self-pair: push/push/seal releases the held read, client reaches eof", async () => {
  const script = [
    {
      after_frames: 1, // after the client's first (held) read
      inputs: [
        { type: "push", payload: Buffer.from("hello").toString("base64") },
        { type: "push", payload: Buffer.from("world").toString("base64") },
        { type: "seal" },
      ],
    },
  ];
  const { clientExit, nodeExit, transcript } = await selfPair(
    script,
    ["--shape", "log", "--stop-when", "last_reader"],
    ["--shape", "log", "--stream-id", "s1", "--from", "0", "--max-records", "10"],
  );

  assert.equal(clientExit, 0, "client exits 0");
  assert.equal(nodeExit, 0, "node exits 0");

  const responses = transcript.filter((m) => m.type === "read_response");
  // Two data responses (one per push released the held read), then eof.
  assert.equal(responses.length, 3);
  assert.equal(responses[0]!.state, "data");
  assert.deepEqual(responses[0]!.records, [{ seq: "1", payload: Buffer.from("hello").toString("base64") }]);
  assert.equal(responses[1]!.state, "data");
  assert.deepEqual(responses[1]!.records, [{ seq: "2", payload: Buffer.from("world").toString("base64") }]);
  assert.equal(responses[2]!.state, "eof");

  const final = transcript.find((m) => m.type === "client_final");
  assert.equal(final?.state, "eof");
  assert.equal(final?.cursor, "2");
});

test("self-pair: close(error) => failed terminal reaches the client", async () => {
  const script = [
    {
      after_frames: 1,
      inputs: [
        { type: "push", payload: Buffer.from("one").toString("base64") },
        { type: "close", error: { code: "producer_error", message: "boom" } },
      ],
    },
  ];
  const { clientExit, nodeExit, transcript } = await selfPair(
    script,
    ["--stop-when", "last_reader"],
    ["--stream-id", "s1", "--from", "0"],
  );

  assert.equal(clientExit, 0);
  assert.equal(nodeExit, 0);
  const responses = transcript.filter((m) => m.type === "read_response");
  // First push releases the held read (data: seq 1); next read hits the closed
  // terminal => failed with the producer error echoed through.
  assert.equal(responses[0]!.state, "data");
  const failed = responses.at(-1)!;
  assert.equal(failed.state, "failed");
  assert.deepEqual(failed.error, { code: "producer_error", message: "boom" });
  assert.equal(transcript.find((m) => m.type === "client_final")?.state, "failed");
});
