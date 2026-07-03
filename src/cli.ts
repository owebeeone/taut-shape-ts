#!/usr/bin/env -S node --experimental-strip-types
// taut-shape-tool (TS) — the conformance/interop CLI. Modes: `node` (run a
// LogNode behind the stdin/stdout framing) and `client` (the reading cursor
// loop). Byte-for-byte matched to taut-shape-rs `crates/taut-shape-tool` — the
// rs node mode is the shared reference (S4.1/S4.2, TautShapeOracle §7).
//
// Data channel (both modes): u32-LE length + 1 tag byte + CBOR body (framing.ts).
// Control/result channel: OOB JSONL on stderr (client's observed transcript).
//
// Run:  node --experimental-strip-types src/cli.ts <node|client> [opts]
//
// Exit codes: 0 = clean EOF / normal completion; 2 = usage error; 3 = a
// malformed or unknown input frame.

import { readFileSync } from "node:fs";
import process from "node:process";

import { LogNode, type StopWhen } from "./log/node.ts";
import {
  FrameDecoder,
  FrameError,
  type Frame,
  encodeFrame,
  frameToInput,
  fromTranscriptJson,
  outputToFrameMsg,
  readEcho,
  toTranscriptJson,
} from "./framing.ts";

const USAGE = `taut-shape-tool (ts) — Taut log-shape conformance/interop CLI

USAGE:
    taut-shape-tool <MODE> [OPTIONS]

MODES:
    node      Run a LogNode behind the stdin/stdout framing
    client    Run the reading side (the cursor loop) against a node

node OPTIONS:
    --stop-when <last_reader|explicit>   ProducerStop policy (default: last_reader)
    --script <FILE>                      producer script: JSON array of
                                         {after_frames: k, inputs: [<jsoncodec msgs>]};
                                         inputs are injected after the k-th client
                                         frame has been processed, in order.

client OPTIONS:
    --stream-id <S>       stream id to read as (default: s1)
    --from <SEQ>          starting cursor seq (default: 0 = START)
    --max-records <N>     max_records per read request (default: unset)

FRAMING (data channel, stdin<->stdout):
    one frame = u32-LE byte length, then 1 tag byte (LogMsgType wire value),
    then the message's CBOR body. length covers the tag byte + body.
`;

// ── stdin: yield decoded frames as they arrive; clean EOF ends the stream ─────

/** Async generator of frames off process.stdin. A truncated tail at EOF is
 *  tolerated (drained, no error) — mirrors rs read_frame. A malformed frame
 *  throws FrameError (caller => exit 3). */
async function* stdinFrames(): AsyncGenerator<Frame> {
  const decoder = new FrameDecoder();
  const stdin = process.stdin;
  for await (const chunk of stdin) {
    const bytes = chunk as Uint8Array;
    for (const frame of decoder.push(bytes)) yield frame;
  }
  // EOF: any decoder.pending bytes are a truncated tail — tolerated, ignored.
}

/** Write a frame to stdout and await its flush (backpressure-safe). */
function writeFrameOut(type: string, native: unknown): Promise<void> {
  const bytes = encodeFrame(type, native);
  return new Promise((resolve, reject) => {
    process.stdout.write(bytes, (err) => (err ? reject(err) : resolve()));
  });
}

/** Emit one OOB transcript line (jsoncodec form) to stderr. */
function emitTranscript(obj: Record<string, unknown>): void {
  process.stderr.write(JSON.stringify(obj) + "\n");
}

// ── node mode ─────────────────────────────────────────────────────────────

interface ScriptEntry {
  after_frames: number;
  inputs: Record<string, unknown>[];
}

async function runNode(args: string[]): Promise<number> {
  let stopWhen: StopWhen = "last_reader"; // task default (matches rs node)
  let script: ScriptEntry[] = [];
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--stop-when": {
        const v = args[++i];
        if (v === "last_reader") stopWhen = "last_reader";
        else if (v === "explicit") stopWhen = "explicit_only";
        else {
          process.stderr.write(`node: --stop-when expects last_reader|explicit, got ${v}\n`);
          return 2;
        }
        break;
      }
      case "--script": {
        const path = args[++i];
        if (path === undefined) {
          process.stderr.write("node: --script needs a FILE\n");
          return 2;
        }
        script = JSON.parse(readFileSync(path, "utf8")) as ScriptEntry[];
        break;
      }
      default:
        process.stderr.write(`node: unknown option ${args[i]}\n`);
        return 2;
    }
  }

  const node = new LogNode({ stopWhen });
  // D3: per-stream log_id echo map, so every response addressed to a stream —
  // direct answer and any later held-release — echoes the log_id its Read carried.
  const streamLogIds = new Map<string, string>();
  let clientFrames = 0; // count of frames processed off stdin (the "client" side)

  // Feed one engine input, writing every resulting output frame in order.
  const feed = async (frame: Frame): Promise<void> => {
    const echo = readEcho(frame);
    if (echo !== undefined) streamLogIds.set(echo.streamId, echo.logId);
    for (const out of node.handle(frameToInput(frame))) {
      const logId = out.type === "read_response" ? (streamLogIds.get(out.streamId) ?? "") : "";
      const msg = outputToFrameMsg(out, logId);
      await writeFrameOut(msg.type, msg.native);
    }
  };

  // After the k-th client frame, inject any scripted producer inputs (in order),
  // writing their outputs too. Deterministic — no clock.
  const runScriptAfter = async (k: number): Promise<void> => {
    for (const entry of script) {
      if (entry.after_frames === k) {
        for (const jv of entry.inputs) await feed(fromTranscriptJson(jv));
      }
    }
  };

  try {
    // Script entries scheduled for "before any client frame" (after_frames = 0).
    await runScriptAfter(0);
    for await (const frame of stdinFrames()) {
      await feed(frame);
      clientFrames += 1;
      await runScriptAfter(clientFrames);
    }
  } catch (e) {
    if (e instanceof FrameError) {
      process.stderr.write(`node: ${e.message}\n`);
      return 3;
    }
    throw e;
  }
  return 0;
}

// ── client mode ─────────────────────────────────────────────────────────────

/** Terminal states that end the read loop. `data`/`would_block`/`expired`
 *  continue (`expired` resumes from next_cursor per D9). */
const TERMINAL = new Set(["eof", "closed", "failed"]);

async function runClient(args: string[]): Promise<number> {
  let streamId = "s1";
  let fromSeq = 0;
  let maxRecords: number | undefined;
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--stream-id":
        streamId = args[++i]!;
        break;
      case "--from":
        fromSeq = Number(args[++i]);
        break;
      case "--max-records":
        maxRecords = Number(args[++i]);
        break;
      default:
        process.stderr.write(`client: unknown option ${args[i]}\n`);
        return 2;
    }
  }

  // Build a LogReadRequest at the current cursor. No timeout_ms => held read
  // (interop scenarios never use timeout_ms > 0 — TautShapeOracle §7).
  const sendRead = (cursorSeq: number): Promise<void> => {
    const native: Record<string, unknown> = {
      log_id: "log-A",
      stream_id: streamId,
      cursor: { seq: cursorSeq },
      max_records: maxRecords ?? null,
      max_bytes: null,
      timeout_ms: null,
    };
    return writeFrameOut("read", native);
  };

  let cursor = fromSeq;
  await sendRead(cursor);

  let finalState = "";
  try {
    for await (const frame of stdinFrames()) {
      if (frame.type !== "read_response") {
        // A node only ever sends responses (+ timer/producer_stop, which the
        // client ignores). Non-response frames are logged and skipped.
        emitTranscript(toTranscriptJson(frame.type, frame.native));
        continue;
      }
      // OOB transcript: every received response, in jsoncodec form.
      emitTranscript(toTranscriptJson("read_response", frame.native));
      const state = String(frame.native.state);
      const nextSeq = Number(frame.native.next_cursor.seq);
      if (state === "data") {
        cursor = nextSeq; // advance past the records just delivered
        await sendRead(cursor);
      } else if (state === "would_block") {
        // Held read that the peer answered as a probe; re-read at same cursor.
        cursor = nextSeq;
        await sendRead(cursor);
      } else if (state === "expired") {
        // A cursor invalidated by eviction is a state, not an error (D9): the
        // node's next_cursor is the earliest resumable position. Resume from
        // there rather than exiting, so an evict mid-stream is survivable.
        cursor = nextSeq;
        await sendRead(cursor);
      } else if (TERMINAL.has(state)) {
        finalState = state;
        break;
      }
    }
  } catch (e) {
    if (e instanceof FrameError) {
      process.stderr.write(`client: ${e.message}\n`);
      return 3;
    }
    throw e;
  }

  // Emit final state as an OOB line so the driver can assert termination.
  emitTranscript({ type: "client_final", stream_id: streamId, state: finalState, cursor: String(cursor) });
  return 0;
}

// ── entry ─────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  switch (mode) {
    case "node":
      return runNode(argv.slice(1));
    case "client":
      return runClient(argv.slice(1));
    default:
      process.stderr.write(USAGE);
      return 2;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    process.stderr.write(`taut-shape-tool: fatal: ${(err as Error).stack ?? err}\n`);
    process.exitCode = 1;
  },
);
