# @owebeeone/taut-shape

Pure-TypeScript implementation of Taut delivery shapes. Its `AtomNode`, `LogNode`,
bounded live `StreamNode`, and attributed LWW `ValueNode` are mailbox engines with no I/O, clock, or callbacks,
kept honest by cross-language behavioral oracles.

`taut-shape-rs` is the reference (it generates the oracle); this repo reproduces
the oracle in TypeScript. No wasm, no Rust binding, no native addon.

Governed by the shared plan
[`../taut-shape/dev-docs/TautClientImplPlan.md`](../taut-shape/dev-docs/TautClientImplPlan.md)
(D1–D19) and this repo's [`dev-docs/InitialPlan.md`](dev-docs/InitialPlan.md).

## Status

Phases 0–2 landed:

- **Phase 0** — skeleton, vendored taut runtime (`src/taut/{cbor,codec,schema}.ts`),
  generated message types (`src/taut/gen/shape_log.ts` + `shape_log.ir.json`).
- **Phase 1** — the `LogNode` engine (`src/node.ts`) over the internal
  `window.ts` (store core) + `session.ts` (session table), with the
  `LogInput`/`LogOutput` unions in `src/messages.ts`. Behavior = D1–D19 exactly
  (incl. refined D6, D18/D19 diagnostics, D16 creation-order + monotonic timer
  tokens).
- **Phase 2** — oracle conformance: an IR-driven `src/taut/jsoncodec.ts`
  (upstream-to-taut candidate) + `tests/oracle.test.ts` replaying every committed
  vector through `LogNode.handle` with whole-output equality. **All 25 vectors
  pass.**

- **Phase 4 (tool)** — the conformance/interop CLI (`src/cli.ts` + `src/framing.ts`)
  with `node` and `client` modes over the shared stdin/stdout framing. Byte-for-byte
  matched to `taut-shape-rs` (its node mode is the reference). A ts↔ts self-pair over
  crossed pipes is green (`tests/cli.test.ts`).

The full cross-language interop matrix (`../taut-shape/matrix/driver.py`) runs
this tool as the `ts` language for all three implemented shapes.

## Tool (node / client)

`taut-shape-tool` is the conformance/interop CLI. Run it with Node ≥ 22's native
TypeScript (`--experimental-strip-types`) — no build step, no dependencies:

```sh
pnpm run tool -- <node|client> [options]
# or directly:
node --experimental-strip-types src/cli.ts <node|client> [options]
```

**Data channel** (both modes, stdin↔stdout): each frame is `u32-LE length` +
`1 tag byte` (the selected shape's message-type enum value) + the message's CBOR body;
`length` counts the tag byte plus the body. This is exactly the framing the
`taut-shape-rs` node mode implements — the shared reference.

**`node`** — run the selected shape engine behind the framing. Reads input frames on stdin,
feeds the engine, writes all resulting output frames to stdout in order after
each input, flushes; EOF ⇒ exit 0.

```
--shape <NAME>                       engine shape (default: log; supported: atom, log, stream, value)
--stop-when <last_reader|explicit>   ProducerStop policy (default: last_reader)
--script <FILE>                      producer script (see below)
```

`--script FILE` drives the producer deterministically so the client can own
stdin. The file is a JSON array of `{ "after_frames": k, "inputs": [ … ] }`:
after the *k*-th client frame has been processed, each producer message in
`inputs` (a `push`/`seal`/`close`/`evict`/… in taut **jsoncodec** form — `type`-
tagged, base64 payloads, i64-as-string) is injected in order and its outputs are
written too. `after_frames: 0` fires before any client frame.

**`client`** — the reading cursor loop. Sends a `LogReadRequest` (`log_id`
`"log-A"`, no `timeout_ms` ⇒ a held read), awaits response frames on stdin; on
`data` it advances the cursor and re-reads, on `expired` it resumes from
`next_cursor` (the earliest resumable position, D9) and re-reads, and on the
terminal `eof`/`closed`/`failed` it emits a final state and exits 0. Every
received response is echoed as an OOB JSONL transcript line on **stderr**
(jsoncodec form, one object per line).

```
--shape <NAME>        engine shape (default: log; supported: atom, log, stream, value)
--stream-id <S>       stream id to read as (default: s1)
--from <SEQ>          starting cursor seq (default: 0 = START)
--max-records <N>     max_records per read request (default: unset)
--value-id <ID>       value register id (value only; default: value-A)
--reads <N>           immediate value reads to issue (value only; default: 1)
--atom-id <ID>        atom id (atom only; default: atom-A)
--extra-stream-id <S> add an atom reader (repeatable)
--timeout-ms <MS>     atom timeout/probe policy
```

Shape selection is exact. An unsupported name exits 2 with
`TAUT_SHAPE_UNSUPPORTED_SHAPE` before either mode reads or writes the data
channel.

Self-pair over crossed pipes (client stdout → node stdin, node stdout → client
stdin), driven by a producer script:

```sh
node --experimental-strip-types src/cli.ts client --shape log --stream-id s1 --from 0 \
  | node --experimental-strip-types src/cli.ts node --shape log --script prod.json \
  | …   # (crossed — see tests/cli.test.ts for the concurrent-drain harness)
```

## Quickstart

```ts
import { LogNode, START } from "@owebeeone/taut-shape";

const node = new LogNode({ stopWhen: "last_reader" });

node.handle({ type: "push", payload: new TextEncoder().encode("hello") });

const outs = node.handle({
  type: "read",
  streamId: "s1",
  cursor: START,           // records strictly after seq 0
  maxRecords: 10,
  timeoutMs: 0,            // probe: no data ⇒ would_block, don't hold
});
// outs[0]: { type: "read_response", streamId: "s1",
//            records: [{ seq: 1, payload: <hello> }],
//            nextCursor: { seq: 1 }, state: "data" }

node.handle({ type: "seal" });
// a later caught-up read now returns state: "eof"
```

The engine is a **pure message-queue endpoint**: held tail reads are engine
state (a `read` with no `timeoutMs` parks until a later `push`/`seal`/`close`
releases it), timers are messages (`set_timer`/`cancel_timer` out,
`timer_expired` in), and `expired` is a state carrying the earliest-resumable
`nextCursor` — never a thrown error.

## Oracle

- Pinned corpus: `../taut-shape/corpus/log.v0.json` (version `log.oracle/v0`).
- Schema: `../taut-shape/ir/shape_log.taut.py` → vendored
  `src/taut/gen/shape_log.ir.json`.
- `tests/oracle.test.ts` loads the corpus, replays each vector's inputs through
  `LogNode.handle`, and asserts the whole observed output sequence equals the
  expected sequence — both sides normalized through the jsoncodec (base64 bytes,
  i64-as-string, enum names, absent-optional == null).

## Develop

```sh
pnpm install --frozen-lockfile
pnpm run typecheck   # repository-pinned tsc --noEmit (strict, NodeNext, ES2022)
pnpm test            # node --experimental-strip-types --test tests/*.test.ts
```

### Runner note (deviation from the plan)

The plan pins **vitest** + **tsup**, while the current harness uses the permitted
fallback: **`node:test` + native `--experimental-strip-types`** (Node ≥ 22).
The oracle assertions are exact-equality either way; the engine and oracle loader
are runner-agnostic. Type checking uses the exact local `typescript` version in
`package.json`/`pnpm-lock.yaml`; no ambient `tsc` is required. `tsup` remains
deferred until a build artifact is needed.
