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

import { LogAdapter } from "./log/adapter.ts";
import type { StopWhen } from "./log/node.ts";
import {
  FrameDecoder,
  FrameError,
  LOG_FRAME_CODEC,
  type MessageFrameCodec,
  type Frame,
  encodeFrame,
  fromTranscriptJson,
  toTranscriptJson,
} from "./framing.ts";
import {
  EngineRuntime,
  SUPPORTED_ENGINE_SHAPES,
  UnsupportedShapeError,
  requireEngineShape,
} from "./runtime.ts";
import { ValueAdapter } from "./value/adapter.ts";
import {
  VALUE_FRAME_CODEC,
  valueFrameFromJson,
  valueFrameToJson,
} from "./value/wire.ts";
import { AtomAdapter } from "./atom/adapter.ts";
import {
  ATOM_FRAME_CODEC,
  atomFrameFromJson,
  atomFrameToJson,
} from "./atom/wire.ts";
import { StreamAdapter } from "./stream/adapter.ts";
import {
  STREAM_FRAME_CODEC,
  streamFrameFromJson,
  streamFrameToJson,
} from "./stream/wire.ts";
import { SwmrAdapter } from "./swmr/adapter.ts";
import {
  SWMR_FRAME_CODEC,
  swmrFrameFromJson,
  swmrFrameToJson,
} from "./swmr/wire.ts";
import { CrdtAdapter } from "./crdt/adapter.ts";
import { CrdtNode, type CrdtOutput } from "./crdt/engine.ts";
import { projectText } from "./crdt/text.ts";
import { crdtInput, type CrdtWireMessage } from "./crdt/oracle.ts";
import {
  CRDT_FRAME_CODEC,
  crdtFrameFromJson,
  crdtFrameToJson,
} from "./crdt/wire.ts";

const USAGE = `taut-shape-tool (ts) — Taut log-shape conformance/interop CLI

USAGE:
    taut-shape-tool <MODE> [OPTIONS]

MODES:
    node      Run a LogNode behind the stdin/stdout framing
    client    Run the reading side (the cursor loop) against a node

node OPTIONS:
    --shape <NAME>                       engine shape (default: log)
    --stop-when <last_reader|explicit>   ProducerStop policy (default: last_reader)
    --script <FILE>                      producer script: JSON array of
                                         {after_frames: k, inputs: [<jsoncodec msgs>]};
                                         inputs are injected after the k-th client
                                         frame has been processed, in order.
    --capacity-records <N>               stream ring capacity (default: 64)
    --max-deltas <N>                     SWMR retained-delta bound (optional)
    --max-pending <N>                    CRDT causal pending bound (default: 1024)

client OPTIONS:
    --shape <NAME>        engine shape (default: log)
    --stream-id <S>       stream id to read as (default: s1)
    --from <SEQ>          starting cursor seq (default: 0 = START)
    --max-records <N>     max_records per read request (default: unset)
    --max-bytes <N>       stream max_bytes per read request (default: unset)
    --value-id <ID>       value register id (default: v-A)
    --reads <N>           immediate value reads to issue (default: 1)
    --atom-id <ID>        atom id (default: atom-A)
    --swmr-id <ID>        SWMR object id (default: swmr-A)
    --crdt-id <ID>        CRDT object id (default: crdt-A)
    --replica-script <FILE> local CRDT bootstrap/operations to sync
    --epoch <N>           SWMR cursor epoch (requires --from; default: 0)
    --extra-stream-id <S> add an atom/stream reader (repeatable)
    --timeout-ms <MS>     atom/stream read timeout (optional; 0 probes)
    --reconnect-dropped   rejoin once after a stream slow-reader drop
    --pause-stream-id <S> pause this stream after its first data response
    --resume-after-data <N> resume paused streams after N data responses

SUPPORTED ENGINE SHAPES:
    ${SUPPORTED_ENGINE_SHAPES.join(", ")}

FRAMING (data channel, stdin<->stdout):
    one frame = u32-LE byte length, then 1 tag byte (LogMsgType wire value),
    then the message's CBOR body. length covers the tag byte + body.
`;

// ── stdin: yield decoded frames as they arrive; clean EOF ends the stream ─────

/** Async generator of frames off process.stdin. A truncated tail at EOF is
 *  tolerated (drained, no error) — mirrors rs read_frame. A malformed frame
 *  throws FrameError (caller => exit 3). */
async function* stdinFrames(codec: MessageFrameCodec): AsyncGenerator<Frame> {
  const decoder = new FrameDecoder(codec);
  const stdin = process.stdin;
  for await (const chunk of stdin) {
    const bytes = chunk as Uint8Array;
    for (const frame of decoder.push(bytes)) yield frame;
  }
  // EOF: any decoder.pending bytes are a truncated tail — tolerated, ignored.
}

/** Write a frame to stdout and await its flush (backpressure-safe). */
function writeFrameOut(
  type: string,
  native: unknown,
  codec: MessageFrameCodec,
): Promise<void> {
  const bytes = encodeFrame(type, native, codec);
  return new Promise((resolve, reject) => {
    process.stdout.write(bytes, (err) => (err ? reject(err) : resolve()));
  });
}

/** Emit one OOB transcript line (jsoncodec form) to stderr. */
function emitTranscript(obj: Record<string, unknown>): void {
  process.stderr.write(JSON.stringify(obj) + "\n");
}

function selectShape(mode: "node" | "client", shape: string): boolean {
  try {
    requireEngineShape(shape);
    return true;
  } catch (error) {
    if (!(error instanceof UnsupportedShapeError)) throw error;
    process.stderr.write(`taut-shape-tool ${mode}: ${error.code}: ${error.message}\n`);
    return false;
  }
}

// ── node mode ─────────────────────────────────────────────────────────────

interface ScriptEntry {
  after_frames: number;
  inputs: Record<string, unknown>[];
}

async function runNode(args: string[]): Promise<number> {
  let shape = "log";
  let stopWhen: StopWhen = "last_reader"; // task default (matches rs node)
  let scriptPath: string | undefined;
  let capacityRecords = 64;
  let maxDeltas: number | null = null;
  let maxPending = 1024;
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--shape": {
        const name = args[++i];
        if (name === undefined) {
          process.stderr.write("node: --shape needs a NAME\n");
          return 2;
        }
        shape = name;
        break;
      }
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
        scriptPath = path;
        break;
      }
      case "--capacity-records": {
        capacityRecords = Number(args[++i]);
        if (!Number.isSafeInteger(capacityRecords) || capacityRecords <= 0) {
          process.stderr.write("node: --capacity-records must be a positive safe integer\n");
          return 2;
        }
        break;
      }
      case "--max-deltas": {
        maxDeltas = Number(args[++i]);
        if (!Number.isSafeInteger(maxDeltas) || maxDeltas < 0) {
          process.stderr.write("node: --max-deltas must be a non-negative safe integer\n");
          return 2;
        }
        break;
      }
      case "--max-pending": {
        maxPending = Number(args[++i]);
        if (!Number.isSafeInteger(maxPending) || maxPending < 0) {
          process.stderr.write("node: --max-pending must be a non-negative safe integer\n");
          return 2;
        }
        break;
      }
      default:
        process.stderr.write(`node: unknown option ${args[i]}\n`);
        return 2;
    }
  }

  if (!selectShape("node", shape)) return 2;
  const script = scriptPath === undefined
    ? []
    : JSON.parse(readFileSync(scriptPath, "utf8")) as ScriptEntry[];

  if (shape === "crdt" || shape === "text_crdt") {
    return driveNode(
      new EngineRuntime(new CrdtAdapter({ maxPending })),
      CRDT_FRAME_CODEC,
      (message) => crdtFrameFromJson(message as CrdtWireMessage),
      script,
    );
  }

  if (shape === "log") {
    return driveNode(
      new EngineRuntime(new LogAdapter({ stopWhen })),
      LOG_FRAME_CODEC,
      fromTranscriptJson,
      script,
    );
  }
  if (shape === "value") {
    return driveNode(
      new EngineRuntime(new ValueAdapter()),
      VALUE_FRAME_CODEC,
      (message) => valueFrameFromJson(message as { type: string; [key: string]: unknown }),
      script,
    );
  }
  if (shape === "stream") {
    return driveNode(
      new EngineRuntime(new StreamAdapter({ capacityRecords, stopWhen })),
      STREAM_FRAME_CODEC,
      (message) => streamFrameFromJson(message as { type: string; [key: string]: unknown }),
      script,
    );
  }
  if (shape === "swmr" || shape === "snapshot_delta") {
    return driveNode(
      new EngineRuntime(new SwmrAdapter({
        maxDeltas: maxDeltas ?? (shape === "snapshot_delta" ? 64 : null),
        stopWhen,
        recoveryPolicy: shape === "snapshot_delta" ? "expire" : "repair",
      })),
      SWMR_FRAME_CODEC,
      (message) => swmrFrameFromJson(message as { type: string; [key: string]: unknown }),
      script,
    );
  }
  return driveNode(
    new EngineRuntime(new AtomAdapter({ stopWhen })),
    ATOM_FRAME_CODEC,
    (message) => atomFrameFromJson(message as { type: string; [key: string]: unknown }),
    script,
  );
}

async function driveNode<Input, Output>(
  runtime: EngineRuntime<Frame, Input, Output, Frame>,
  codec: MessageFrameCodec,
  scriptFrame: (message: Record<string, unknown>) => Frame,
  script: readonly ScriptEntry[],
): Promise<number> {
  let clientFrames = 0; // count of frames processed off stdin (the "client" side)

  // Feed one engine input, writing every resulting output frame in order.
  const feed = async (frame: Frame): Promise<void> => {
    for (const emission of runtime.process(frame)) {
      await writeFrameOut(emission.effect.frame.type, emission.effect.frame.native, codec);
    }
  };

  // After the k-th client frame, inject any scripted producer inputs (in order),
  // writing their outputs too. Deterministic — no clock.
  const runScriptAfter = async (k: number): Promise<void> => {
    for (const entry of script) {
      if (entry.after_frames === k) {
        for (const jv of entry.inputs) await feed(scriptFrame(jv));
      }
    }
  };

  try {
    // Script entries scheduled for "before any client frame" (after_frames = 0).
    await runScriptAfter(0);
    for await (const frame of stdinFrames(codec)) {
      await feed(frame);
      clientFrames += 1;
      await runScriptAfter(clientFrames);
    }
    for (const emission of runtime.finish()) {
      await writeFrameOut(emission.effect.frame.type, emission.effect.frame.native, codec);
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
  let shape = "log";
  let streamId = "s1";
  let fromRaw = "0";
  let fromSpecified = false;
  let maxRecords: number | undefined;
  let maxBytes: bigint | null = null;
  let valueId = "v-A";
  let atomId = "atom-A";
  let swmrId = "swmr-A";
  let crdtId = "crdt-A";
  let replicaScript: string | undefined;
  let epochRaw: string | undefined;
  const extraStreamIds: string[] = [];
  let atomTimeoutMs: bigint | null = null;
  let reads = 1;
  let reconnectDropped = false;
  const pauseStreamIds = new Set<string>();
  let resumeAfterData: number | undefined;
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--shape": {
        const name = args[++i];
        if (name === undefined) {
          process.stderr.write("client: --shape needs a NAME\n");
          return 2;
        }
        shape = name;
        break;
      }
      case "--stream-id":
        streamId = args[++i]!;
        break;
      case "--from":
        fromRaw = args[++i]!;
        fromSpecified = true;
        break;
      case "--max-records":
        maxRecords = Number(args[++i]);
        break;
      case "--max-bytes": {
        try {
          maxBytes = BigInt(args[++i]!);
        } catch {
          process.stderr.write("client: --max-bytes must be a non-negative i64\n");
          return 2;
        }
        if (maxBytes < 0n) {
          process.stderr.write("client: --max-bytes must be a non-negative i64\n");
          return 2;
        }
        break;
      }
      case "--value-id":
        valueId = args[++i]!;
        break;
      case "--reads":
        reads = Number(args[++i]);
        if (!Number.isInteger(reads) || reads <= 0) {
          process.stderr.write("client: --reads must be a positive integer\n");
          return 2;
        }
        break;
      case "--atom-id":
        atomId = args[++i]!;
        break;
      case "--swmr-id":
        swmrId = args[++i]!;
        break;
      case "--crdt-id":
        crdtId = args[++i]!;
        break;
      case "--replica-script":
        replicaScript = args[++i]!;
        break;
      case "--epoch":
        epochRaw = args[++i]!;
        break;
      case "--extra-stream-id":
        extraStreamIds.push(args[++i]!);
        break;
      case "--timeout-ms": {
        const raw = args[++i];
        try {
          atomTimeoutMs = BigInt(raw!);
        } catch {
          process.stderr.write("client: --timeout-ms must be a non-negative i64\n");
          return 2;
        }
        if (atomTimeoutMs < 0n) {
          process.stderr.write("client: --timeout-ms must be a non-negative i64\n");
          return 2;
        }
        break;
      }
      case "--reconnect-dropped":
        reconnectDropped = true;
        break;
      case "--pause-stream-id":
        pauseStreamIds.add(args[++i]!);
        break;
      case "--resume-after-data":
        resumeAfterData = Number(args[++i]);
        if (!Number.isSafeInteger(resumeAfterData) || resumeAfterData <= 0) {
          process.stderr.write("client: --resume-after-data must be a positive safe integer\n");
          return 2;
        }
        break;
      default:
        process.stderr.write(`client: unknown option ${args[i]}\n`);
        return 2;
    }
  }

  if (!selectShape("client", shape)) return 2;
  if (shape === "crdt" || shape === "text_crdt") {
    if (replicaScript === undefined) {
      process.stderr.write("client: --replica-script is required for CRDT\n");
      return 2;
    }
    return runCrdtClient(streamId, crdtId, replicaScript, shape === "text_crdt");
  }
  if (epochRaw !== undefined && !fromSpecified) {
    process.stderr.write("client: --epoch requires --from\n");
    return 2;
  }
  if (shape === "value") return runValueClient(streamId, valueId, reads);
  if (shape === "stream") {
    const streamMaxRecords = maxRecords === undefined ? null : BigInt(maxRecords);
    return runStreamClient(
      [streamId, ...extraStreamIds],
      streamMaxRecords,
      maxBytes,
      atomTimeoutMs,
      reconnectDropped,
      pauseStreamIds,
      resumeAfterData,
    );
  }
  if (shape === "swmr" || shape === "snapshot_delta") {
    let initialCursor: { seq: bigint; epoch: bigint } | null = null;
    if (fromSpecified) {
      try {
        const seq = BigInt(fromRaw);
        const epoch = BigInt(epochRaw ?? "0");
        if (seq < 0n || epoch < 0n) throw new RangeError();
        initialCursor = { seq, epoch };
      } catch {
        process.stderr.write("client: SWMR --from/--epoch must be non-negative integers\n");
        return 2;
      }
    }
    return runSwmrClient(
      [streamId, ...extraStreamIds],
      swmrId,
      initialCursor,
      atomTimeoutMs,
      shape === "snapshot_delta",
    );
  }
  let from: bigint;
  try {
    from = BigInt(fromRaw);
  } catch {
    process.stderr.write("client: --from must be an integer\n");
    return 2;
  }
  if (shape === "atom") {
    return runAtomClient(
      [streamId, ...extraStreamIds],
      atomId,
      from,
      atomTimeoutMs,
    );
  }
  const fromSeq = Number(from);
  if (!Number.isSafeInteger(fromSeq) || fromSeq < 0) {
    process.stderr.write("client: --from must be a non-negative safe integer for log\n");
    return 2;
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
    return writeFrameOut("read", native, LOG_FRAME_CODEC);
  };

  let cursor = fromSeq;
  await sendRead(cursor);

  let finalState = "";
  try {
    for await (const frame of stdinFrames(LOG_FRAME_CODEC)) {
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

async function runValueClient(
  streamId: string,
  valueId: string,
  reads: number,
): Promise<number> {
  const sendRead = (): Promise<void> => writeFrameOut(
    "read",
    { value_id: valueId, stream_id: streamId },
    VALUE_FRAME_CODEC,
  );

  let responses = 0;
  await sendRead();
  try {
    for await (const frame of stdinFrames(VALUE_FRAME_CODEC)) {
      if (frame.type === "diagnostic") {
        emitTranscript(valueFrameToJson(frame));
        continue;
      }
      if (frame.type !== "read_response") {
        process.stderr.write(`client: unexpected value response tag ${frame.type}\n`);
        return 3;
      }
      emitTranscript(valueFrameToJson(frame));
      responses += 1;
      if (responses === reads) {
        emitTranscript({ type: "client_final", state: "done" });
        return 0;
      }
      await sendRead();
    }
  } catch (error) {
    if (error instanceof FrameError) {
      process.stderr.write(`client: ${error.code}: ${error.message}\n`);
      return 3;
    }
    throw error;
  }
  emitTranscript({ type: "client_final", state: "eof" });
  return 0;
}

async function runAtomClient(
  streamIds: readonly string[],
  atomId: string,
  initialVersion: bigint,
  timeoutMs: bigint | null,
): Promise<number> {
  const versions = new Map(streamIds.map((streamId) => [streamId, initialVersion]));
  const active = new Set(streamIds);
  const sendRead = (streamId: string): Promise<void> => writeFrameOut(
    "read",
    {
      atom_id: atomId,
      stream_id: streamId,
      version: { version: versions.get(streamId)! },
      timeout_ms: timeoutMs,
    },
    ATOM_FRAME_CODEC,
  );

  for (const streamId of streamIds) await sendRead(streamId);
  try {
    for await (const frame of stdinFrames(ATOM_FRAME_CODEC)) {
      emitTranscript(atomFrameToJson(frame));
      if (frame.type !== "read_response") continue;
      const state = String(frame.native.state);
      const responseStreamId = String(frame.native.stream_id);
      if (!active.has(responseStreamId)) {
        process.stderr.write(`client: atom response for inactive stream ${responseStreamId}\n`);
        return 3;
      }
      versions.set(responseStreamId, BigInt(frame.native.next_version.version));
      if (state === "data") {
        await sendRead(responseStreamId);
        continue;
      }
      if (state === "would_block" || TERMINAL.has(state)) {
        active.delete(responseStreamId);
        if (active.size === 0) {
          emitTranscript({ type: "client_final", state: "done" });
          return 0;
        }
      }
    }
  } catch (error) {
    if (error instanceof FrameError) {
      process.stderr.write(`client: ${error.code}: ${error.message}\n`);
      return 3;
    }
    throw error;
  }
  emitTranscript({ type: "client_final", state: "eof_channel" });
  return 0;
}

async function runStreamClient(
  streamIds: readonly string[],
  maxRecords: bigint | null,
  maxBytes: bigint | null,
  timeoutMs: bigint | null,
  reconnectDropped: boolean,
  pauseStreamIds: ReadonlySet<string>,
  resumeAfterData: number | undefined,
): Promise<number> {
  const active = new Set(streamIds);
  const paused = new Set<string>();
  const reconnected = new Set<string>();
  let dataResponses = 0;
  const sendRead = (streamId: string): Promise<void> => writeFrameOut(
    "read",
    {
      stream_id: streamId,
      max_records: maxRecords,
      max_bytes: maxBytes,
      timeout_ms: timeoutMs,
    },
    STREAM_FRAME_CODEC,
  );

  for (const streamId of streamIds) await sendRead(streamId);
  try {
    for await (const frame of stdinFrames(STREAM_FRAME_CODEC)) {
      emitTranscript(streamFrameToJson(frame));
      if (frame.type !== "read_response") continue;
      const streamId = String(frame.native.stream_id);
      const state = String(frame.native.state);
      if (!active.has(streamId)) {
        process.stderr.write(`client: stream response for inactive stream ${streamId}\n`);
        return 3;
      }
      if (state === "data") {
        dataResponses += 1;
        if (pauseStreamIds.has(streamId)) paused.add(streamId);
        else await sendRead(streamId);
        if (resumeAfterData !== undefined && dataResponses >= resumeAfterData) {
          for (const pausedId of [...paused].sort()) await sendRead(pausedId);
          paused.clear();
        }
        continue;
      }
      if (state === "dropped" && reconnectDropped && !reconnected.has(streamId)) {
        reconnected.add(streamId);
        await sendRead(streamId);
        continue;
      }
      if (state === "would_block" || state === "dropped" || TERMINAL.has(state)) {
        active.delete(streamId);
        if (active.size === 0) {
          emitTranscript({ type: "client_final", state: "done" });
          return 0;
        }
      }
    }
  } catch (error) {
    if (error instanceof FrameError) {
      process.stderr.write(`client: ${error.code}: ${error.message}\n`);
      return 3;
    }
    throw error;
  }
  emitTranscript({ type: "client_final", state: "eof_channel" });
  return 0;
}

async function runSwmrClient(
  streamIds: readonly string[],
  swmrId: string,
  initialCursor: { readonly seq: bigint; readonly epoch: bigint } | null,
  timeoutMs: bigint | null,
  expireProfile: boolean,
): Promise<number> {
  const active = new Set(streamIds);
  const cursors = new Map(streamIds.map((streamId) => [streamId, initialCursor]));
  const sendRead = (streamId: string): Promise<void> => writeFrameOut(
    "read",
    {
      swmr_id: swmrId,
      stream_id: streamId,
      cursor: cursors.get(streamId) ?? null,
      timeout_ms: timeoutMs,
    },
    SWMR_FRAME_CODEC,
  );

  for (const streamId of streamIds) await sendRead(streamId);
  try {
    for await (const frame of stdinFrames(SWMR_FRAME_CODEC)) {
      if (frame.type !== "read_response") {
        emitTranscript(swmrFrameToJson(frame));
        continue;
      }
      const streamId = String(frame.native.stream_id);
      const state = String(frame.native.state);
      if (!active.has(streamId)) {
        process.stderr.write(`client: swmr response for inactive stream ${streamId}\n`);
        return 3;
      }
      if (expireProfile && state === "reset") {
        const resetReason = String(frame.native.reset_reason);
        emitTranscript({
          type: "refresh_required",
          swmr_id: String(frame.native.swmr_id),
          stream_id: streamId,
          reason: resetReason === "retention_exceeded"
            ? "retention_expired"
            : resetReason === "invalid_resume_seq"
            ? "invalid_cursor"
            : "source_changed",
        });
        active.delete(streamId);
        if (active.size === 0) {
          emitTranscript({ type: "client_final", state: "done" });
          return 0;
        }
        continue;
      }
      emitTranscript(swmrFrameToJson(frame));
      if (state === "data" || state === "reset") {
        const next = frame.native.next_cursor as { seq: bigint; epoch: bigint } | null;
        cursors.set(streamId, next === null ? null : { seq: next.seq, epoch: next.epoch });
        await sendRead(streamId);
        continue;
      }
      if (state === "would_block" || TERMINAL.has(state)) {
        active.delete(streamId);
        if (active.size === 0) {
          emitTranscript({ type: "client_final", state: "done" });
          return 0;
        }
      }
    }
  } catch (error) {
    if (error instanceof FrameError) {
      process.stderr.write(`client: ${error.code}: ${error.message}\n`);
      return 3;
    }
    throw error;
  }
  emitTranscript({ type: "client_final", state: "eof_channel" });
  return 0;
}

async function runCrdtClient(
  streamId: string,
  crdtId: string,
  replicaScript: string,
  textProfile: boolean,
): Promise<number> {
  const inputs = JSON.parse(readFileSync(replicaScript, "utf8")) as CrdtWireMessage[];
  const node = new CrdtNode();
  const diagnostics = new Map<string, { code: string; origin: string | null; seq: string | null }>();
  const collect = (outputs: readonly CrdtOutput[]): void => {
    for (const output of outputs) if (output.type === "diagnostic") {
      const row = { code: output.code, origin: output.origin, seq: output.seq === null ? null : String(output.seq) };
      diagnostics.set(JSON.stringify(row), row);
    }
  };
  for (const raw of inputs) {
    const input = crdtInput(raw);
    if (input.type !== "apply" && input.type !== "install_bootstrap") {
      process.stderr.write("client: CRDT replica script accepts only apply/bootstrap\n");
      return 2;
    }
    collect(node.handle(input));
    const frame = crdtFrameFromJson(raw);
    await writeFrameOut(frame.type, frame.native, CRDT_FRAME_CODEC);
  }
  const sendRead = (): Promise<void> => writeFrameOut(
    "read",
    { crdt_id: crdtId, stream_id: streamId, cursor: node.clock },
    CRDT_FRAME_CODEC,
  );
  await sendRead();
  try {
    for await (const frame of stdinFrames(CRDT_FRAME_CODEC)) {
      emitTranscript(crdtFrameToJson(frame));
      if (frame.type === "diagnostic") {
        const row = { code: String(frame.native.code), origin: frame.native.origin === null ? null : String(frame.native.origin), seq: frame.native.seq === null ? null : String(frame.native.seq) };
        diagnostics.set(JSON.stringify(row), row);
        continue;
      }
      if (frame.type !== "read_response") {
        process.stderr.write(`client: unexpected CRDT response tag ${frame.type}\n`);
        return 3;
      }
      const bootstrap = frame.native.bootstrap as null | { clock: { entries: { origin: string; seq: bigint }[] }; state: Uint8Array };
      if (bootstrap !== null) collect(node.handle({ type: "install_bootstrap", bootstrap }));
      const ops = frame.native.ops as { origin: string; seq: bigint; deps: { entries: { origin: string; seq: bigint }[] }; payload: Uint8Array }[];
      for (const op of ops) collect(node.handle({ type: "apply", op }));
      const state = String(frame.native.state);
      if (state === "data" || state === "bootstrap_required") { await sendRead(); continue; }
      break;
    }
  } catch (error) {
    if (error instanceof FrameError) {
      process.stderr.write(`client: ${error.code}: ${error.message}\n`);
      return 3;
    }
    throw error;
  }
  const final: Record<string, unknown> = {
    type: "replica_final",
    clock: { entries: node.clock.entries.map((entry) => ({ origin: entry.origin, seq: String(entry.seq) })) },
    ops: node.operations.map((op) => ({ origin: op.origin, seq: String(op.seq), deps: { entries: op.deps.entries.map((entry) => ({ origin: entry.origin, seq: String(entry.seq) })) }, payload: Buffer.from(op.payload).toString("base64") })),
    diagnostics: [...diagnostics.values()].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
  };
  if (textProfile) {
    const projection = projectText(node);
    final.text = projection.text;
    final.text_diagnostics = projection.diagnostics;
  }
  emitTranscript(final);
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
