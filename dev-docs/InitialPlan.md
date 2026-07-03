# taut-shape-typescript — Initial Implementation Plan

Status: plan (v2 — conforms to the shared **pure mailbox engine** model).
Scope: phased plan, **TypeScript-specific**. Audience: implementors of
`taut-shape-ts`.

This document **specializes** the shared, language-neutral plan
[`../../taut-shape/dev-docs/TautClientImplPlan.md`](../../taut-shape/dev-docs/TautClientImplPlan.md)
(v2) and is governed by the design
[`../../taut-shape/dev-docs/TautShapeArchitecture.md`](../../taut-shape/dev-docs/TautShapeArchitecture.md).
It uses the shared plan's **phase names verbatim** (Phase 0–5; Phase 6 deferred)
and resolves every `«SPECIALIZE: …»` marker for TypeScript. Where the shared
plan is normative, this document is subordinate: if the two disagree, the shared
plan and its pinned decisions (D1–D17, shared §4) win. D-numbers are cited
throughout where a signature embodies a pinned decision.

Guiding constraint, inherited unchanged: **we prioritize getting the API right
over speed.** §4 below (the concrete TypeScript rendering of the shared §2–§3
engine and message vocabulary) is the load-bearing deliverable; everything else
exists to validate it. The engine is a **pure message-queue endpoint** —
`handle(input): LogOutput[]` — with no I/O, no clock, no callbacks (D1); all
async behavior lives in the shell (Phase 3).

This is a **full pure-TypeScript implementation** — no wasm, no Rust binding, no
native addon — mirroring how `glade/client-ts` already ships a pure-TS port of
the Rust node. `taut-shape-rs` is the reference (it generates the oracle);
`taut-shape-ts` reproduces the oracle in CI.

v2 note: the v1 draft of this document rendered a "sync core + consumer `Store`
seam + readiness hook" model. That model is superseded (shared plan v2, D1/D2):
there is **no consumer-provided `Store` interface**, **no `Readiness`/`onReady`
notify primitive**, and **no thrown lifecycle errors** — held long-polls are
engine state, v0 bytes live in an engine-internal bounded window, timers and
producer-stop are messages, and `expired` is a state (D9). §4.10 records which
v1 open questions the D-numbers resolved.

---

## 1. Specialization checklist (resolved)

| Marker (shared §7) | TypeScript commitment |
|---|---|
| Package manifest | `package.json` (ESM, `"type": "module"`) + `tsconfig.json` (strict, NodeNext, ES2022); published as **`@owebeeone/taut-shape`** |
| Build/test runner | **vitest** (test + snapshot + coverage); `tsc --noEmit` for typecheck; `tsup` for the build |
| Golden framework | **vitest** exact-equality for the committed **oracle JSON** (the primary golden — whole output-message sequences); `toMatchSnapshot` for derived surfaces (CLI transcripts, error rendering) |
| Engine rendering | `LogNode` **class** with `handle(input: LogInput): LogOutput[]`; messages as **discriminated unions** (`{ type: "push", … } \| …`); states as string-literal unions (D13); rationale in §4.9 |
| Shell & async idiom | `LogShell` pump: input queue + drain flag (re-entrancy guard = the JS form of D15), `setTimeout`-backed timers, addressed-`Response` dispatch; sugar = **async generator → `AsyncIterable`**; cancellation (`AbortSignal` *or* early `break`) → `EndStream` input (D4) |
| Service form | `LogService` class: `Map<logId, LogNode>` routing, `log_id` minting, synthesized `unknown_log` failed-response for unknown ids (shared §3.5) |
| CBOR codec | reuse taut's `cbor.ts` + `codec.ts` runtime, vendored under `src/taut/` exactly as `glade/client-ts/src/taut/*` does |
| Generated message types | `tautc gen -l typescript` over `taut-shape/ir/shape_log.taut.py` (D17): the types-only `api.ts` output vendored as `src/taut/gen/shape_log.ts`, plus the exported `shape_log.ir.json` driving the vendored schema-driven `codec.ts` at run time — the `glade/client-ts` IR-JSON pattern; never hand-edited |
| Source to mirror | `glade/client-ts/src/store.ts` distilled to single-origin for the **internal window** (store core); the session table + read resolution (shared §3.4) are **clean-room** (glade has no held-read/timer/lifecycle equivalent) |
| Distribution | **npm `@owebeeone/taut-shape`** |
| docs/ layout | `docs/api/` (spec per surface) + `docs/examples/` (worked, runnable) — enumerated in §7 |

### Runner justification (vitest over `node:test`)

`glade/client-ts` uses `node:test` + `node --experimental-strip-types`, which is
fine for hand-written assertions but has **no first-class snapshot facility** —
and the shared §5 house style is golden/snapshot, "compare the whole observed
output." vitest gives us `toMatchSnapshot` for transcripts, deterministic
snapshot files committed to git, watch mode, and built-in coverage, with zero
extra config for TS-ESM. The oracle-vector assertions are *exact-equality*
tests (the contract is exact — whole `(inputs) → (expected outputs)` sequences —
not a free-running snapshot); vitest snapshots cover the CLI transcript captures
where the artifact *is* the readable golden. `node:test` remains a fallback if a
zero-dependency posture is later mandated; nothing in the engine depends on the
runner.

### What we reuse vs. transform vs. add (from the glade TS source)

**Reuse (distill — into the *internal* window, not a public seam):**
- From `store.ts`: the in-memory `Map`-backed append log, `scan(fromSeq)` →
  ordered tail (the resume primitive), and `heads()` → head seq. These become
  the engine-internal **store core** (`window.ts`, §4.5) — the bounded record
  window behind `Push`/`Read`/`Evict` (D2). It is an implementation module, not
  an exported interface.
- From `fold.ts`: the `(origin, seq)` dedup discipline and deterministic
  ordering insight — single-origin collapses this to "order by seq, dedup by
  seq," which is exactly `scan`'s natural order, so the fold *evaporates* into
  the window (documented as the simplification, §2 below).
- From `session.ts`: the `append` → assign-next-seq pattern (minus
  lamport/prev chaining) becomes the window's `Push` handling — reindexed so the
  **first record is `seq = 1`** (D8; glade counts from 0).
- `Uint8Array` byte handling and `bytesEq`/`hex`/`unhex` helpers (`bytes.ts`).
- The vendored `src/taut/{cbor,codec,schema}.ts` runtime, unchanged.

**Transform (strip the replication/CRDT layer):**
- `origin` / `lamport` / `prev`-hash / `refs` / equivocation chain checks **all
  go away** — log v0 is single-origin, so the per-origin keying, chain-break/
  gap/equivocation errors, and the `heads()`→`Map<origin,seq>` resume *vector*
  collapse to a **scalar `seq` cursor** and a single ordered window.
- `missingFor(their: Map)` (vector diff) → window scan from a scalar seq.
- The fold (`foldLog`/`foldValue`) is **not ported** as a runtime step; reading
  is a window scan, not a fold.

**Add (everything glade lacks — the mailbox-engine layer, clean-room):**
- The **session table**: per-`stream_id` entries (held `Read`, timer token,
  watermark), implicit create on first `Read` (D4), supersede rule (D5),
  `EndStream` cleanup, reader-count → `ProducerStop` transition (D6).
- **Held long-polls as engine state** — a tail `Read` parks in the session
  entry and is answered by a later `Push`/`Seal`/`Close`/`TimerExpired`/
  `EndStream` input (D1). No readiness hook exists.
- **Timers as messages**: `SetTimer`/`CancelTimer` out, `TimerExpired` in
  (D14); tokens monotonic from 1 (D16).
- Finite-log lifecycle: `Seal` → `eof`; `Close{}` → `closed`; `Close{error}` →
  `failed` (D12); `ProducerStop` as an **output message** (D6).
- Bounded, consumer-driven retention: `Evict` input, floor, `expired` **state**
  with earliest-resumable `next_cursor` (D7, D9).
- `max_records`/`max_bytes` batching with payload-bytes-only accounting and the
  forward-progress guarantee (D10).

---

## 2. The single-origin simplification (why the fold disappears)

glade folds because it merges many origins' chains into one converged value;
that needs `(lamport, origin, seq)` ordering and `(origin, seq)` dedup. **log
v0 is single-origin**, so:

- ordering is just ascending `seq`,
- dedup is "a `seq` already appended is a no-op,"
- resume is "records with `seq > cursor.seq`" — *the same array, sliced*.

So `foldLog` is replaced by the internal window's scan, and the resume *vector*
(`heads()` as a `Map`) becomes a scalar `Cursor{ seq }`. In v2 this
distillation lands **inside the engine** (the D2 internal window), not behind a
public `Store` seam — the external-store extension (shared §9,
`ScanRequest`/`ScanResult`) is designed but not v0. The rest of the plan builds
the mailbox engine around this scalar spine.

---

## 3. Repository structure (nominated)

```
taut-shape-ts/
  README.md                    # what/why, install, 30-line quickstart, oracle status
  package.json                 # @owebeeone/taut-shape, ESM, exports map
  tsconfig.json                # strict, NodeNext, ES2022 target
  tsup.config.ts               # build (engine / shell / cli entrypoints)
  vitest.config.ts             # snapshot + coverage config
  LICENSE
  src/
    index.ts                   # public barrel: messages + node + shell + stream + service
    messages.ts                # HAND-WRITTEN: LogInput/LogOutput unions over the generated shape_log types (§4.1–4.3, D17)
    node.ts                    # LogNode engine: handle() + read-only accessors (§4.4)
    window.ts                  # INTERNAL store core: bounded record window (§4.5, D2) — not exported
    session.ts                 # INTERNAL session table: held reads, timers, watermarks (§4.5) — not exported
    shell.ts                   # LogShell pump: serialization, real timers, dispatch (§4.6)
    stream.ts                  # readStream(): AsyncIterable sugar; cancellation → EndStream (§4.7)
    service.ts                 # LogService: log_id routing + unknown_log (§4.8)
    oracle.ts                  # oracle-vector loader: (input msgs) → (expected output msgs) (Phase 2)
    cli.ts                     # gen/check/node/client tool (Phase 4)
    framing.ts                 # length-prefixed CBOR + OOB JSONL (Phase 4)
    taut/
      cbor.ts                  # vendored from taut runtime (unchanged)
      codec.ts                 # vendored from taut runtime (unchanged)
      schema.ts                # vendored from taut runtime (unchanged)
      gen/
        shape_log.ts           # GENERATED (tautc gen -l typescript of shape_log.taut.py) — vendored, never hand-edited (D17)
        shape_log.ir.json      # exported IR driving the schema-driven codec.ts (D17)
    bytes.ts                   # hex/unhex/bytesEq/utf8 (from glade)
  docs/
    api/                       # see §7
    examples/                  # see §7
  tests/
    oracle.test.ts             # primary golden: replay committed vectors through LogNode.handle
    node.test.ts               # engine unit: read resolution, supersede, lifecycle, timers
    window.test.ts             # store core: append/scan/evict/floor
    shell.test.ts              # pump: serialization, timer wiring, dispatch
    stream.test.ts             # sugar: tail, seal→eof, abort/break → EndStream
    service.test.ts            # routing + unknown_log
    cli.e2e.test.ts            # spawn cli, assert transcript (test_kotlin.py style)
    __snapshots__/             # vitest snapshot artifacts (committed)
  dev-docs/
    InitialPlan.md             # this file
```

Package exports map (subpath entry points so consumers can pull just the
engine). `window.ts` and `session.ts` are deliberately **absent** — they are
internal modules, not public seams (D2):

```jsonc
"exports": {
  ".":        "./dist/index.js",     // messages + node + shell + stream + service
  "./engine": "./dist/node.js",      // pure engine only (messages + LogNode)
  "./cli":    "./dist/cli.js"        // the conformance tool entry
}
```

---

## 4. The shared §2–§3 API, rendered concretely in TypeScript

This is the section to review hardest. Signatures below are the proposed public
surface; §4.10 resolves the v1 open questions against D1–D16 and flags the
genuinely TypeScript-local decisions still in play.

Provenance (D17): the message **data types are declared in taut and generated,
not hand-written** — `taut-shape/ir/shape_log.taut.py` (messages + codecs, no
`service`; the glade wire-schema pattern) is the single source, and §4.1–4.3
below show the **expected shape of the generated code**, not types to author.
For TypeScript we use `tautc gen -l typescript`, the route consistent with the
§1 vendored-`src/taut/*` commitment — and in TS the shared plan's two options
collapse into one, because taut's TS emitter is interpreter-style: it writes a
types-only `api.ts` (vendored as `src/taut/gen/shape_log.ts`) while the wire
stays schema-driven, the vendored `codec.ts` walking the exported
`shape_log.ir.json` at run time, exactly as `glade/client-ts` does with its IR
JSON. Hand-written per D17: only the `LogInput`/`LogOutput` discriminated-union
wrappers (§4.2–4.3), the engine, and the shell.

Conventions: bytes are `Uint8Array`; the engine is fully synchronous — no
`Promise` anywhere in `messages.ts`/`node.ts`/`window.ts`/`session.ts`;
`readonly` on all value types; messages are **plain objects** (structural,
JSON/CBOR-adjacent, trivially constructible in tests and oracle vectors).

Naming convention: **`type` tags and state/reason strings are the canonical
wire spellings** (snake_case — `"would_block"`, `"end_stream"`,
`"producer_stop"` — D13 pins the state strings; tags follow suit so oracle
vectors and transcripts read identically across languages). **Property names
are idiomatic camelCase** (`streamId`, `nextCursor`, `timeoutMs`); the oracle
loader and CBOR service layer own the small, fixed field-name mapping to the
wire's snake_case. This keeps the public API idiomatic without inventing a
second vocabulary.

### 4.1 Core value types

```ts
/** An ordered position in one single-origin log. On EVERY response. */
export interface Cursor {
  readonly seq: number;            // records strictly AFTER this seq are unseen
  // reserved: byteOffset for future partial-record delivery
}

/** The start-of-log cursor. First record is seq = 1; empty log head = 0. (D8) */
export const START: Cursor = { seq: 0 };

/** One append. `payload` is binary-safe (NUL-safe) opaque bytes; carries its
 *  seq. (D11) The payload is the METHOD'S APPEND-TYPE MESSAGE ALREADY
 *  TAUT-ENCODED (the glade `Op.payload` pattern) — opaque to the log engine,
 *  which is how the vocabulary stays generic without generics (D17). */
export interface LogRecord {
  readonly seq: number;            // assigned by the engine; monotonic from 1 (D8)
  readonly payload: Uint8Array;    // the taut-encoded append-type message (D17); opaque here
}

/** Canonical state strings (D13). String-literal union, not an enum (§4.10 Q-B). */
export type LogState =
  | "data"          // records follow; keep reading
  | "would_block"   // probe (timeout_ms=0) or timer expiry while live (D14)
  | "eof"           // sealed and drained
  | "closed"        // Close{} — deliberate teardown, no error (D12)
  | "failed"        // Close{error} — producer error, error attached (D12)
  | "expired";      // invalid cursor; next_cursor = earliest resumable (D9)

/** Error payload on failed responses / service-level routing. NEVER thrown. */
export interface LogError {
  readonly code: "unknown_log" | "producer_error" | "internal";
  readonly message?: string;
}
```

`unknown_log` is **service-level only** (§4.8); `LogNode` itself only ever
attaches `producer_error`/`internal` to `failed` responses (shared §3.1). There
is no `canceled` code: client-initiated cancellation is `EndStream`, which
needs no response. The v1 thrown `TautShapeError` hierarchy (including
`ExpiredCursorError`) is **deleted** — `expired` is a state (D9), and the error
surface shrinks to these data-only payloads.

### 4.2 Input messages (shared §3.2)

A discriminated union — the canonical TS idiom for a closed message vocabulary
(rationale in §4.9):

```ts
export type LogInput =
  // Producer-side (node-local, unaddressed)
  | { readonly type: "push";  readonly payload: Uint8Array }
  | { readonly type: "seal" }                                    // idempotent
  | { readonly type: "close"; readonly error?: LogError }        // idempotent; error ⇒ failed (D12)
  // Stream-side (addressed by streamId — D3)
  | {
      readonly type: "read";
      readonly streamId: string;       // first use implicitly creates the session entry (D4)
      readonly cursor?: Cursor;        // absent ⇒ START (D8)
      readonly maxRecords?: number;
      readonly maxBytes?: number;      // raw payload bytes only (D10)
      readonly timeoutMs?: number;     // absent = hold; 0 = probe; >0 = hold + timer (D14)
    }
  | { readonly type: "end_stream"; readonly streamId: string }   // unknown id = no-op (D4)
  // Environment
  | { readonly type: "timer_expired"; readonly token: number }   // late/canceled = no-op
  | { readonly type: "evict"; readonly upToSeq: number };        // raises the floor (D7)
```

Notes pinned by shared §3.2:
- A `read` on a stream that already holds a read **supersedes** it: the old
  held read is dropped *without a response* and its timer canceled (D5).
- `end_stream` drops any held read (no response), cancels its timer, removes
  the watermark, decrements the reader count (D4). Adapters inject it on
  transport death — it *is* the disconnect cleanup.

### 4.3 Output messages (shared §3.3)

```ts
export type LogOutput =
  | {
      readonly type: "response";       // addressed (D3)
      readonly streamId: string;
      readonly records: readonly LogRecord[];
      readonly nextCursor: Cursor;     // ALWAYS present, even when records is empty
      readonly state: LogState;
      readonly error?: LogError;       // attached when state = "failed"
    }
  | { readonly type: "set_timer";    readonly token: number; readonly ms: number }
  | { readonly type: "cancel_timer"; readonly token: number }   // tokens monotonic from 1 (D16)
  | {
      readonly type: "producer_stop";  // on Close, and on ≥1→0 readers under stop_when=last_reader (D6)
      readonly reason: "last_reader_gone" | "closed" | "failed";
    }
  | {
      readonly type: "diagnostic";     // LogDiagnostic — engine warning, code only, no free text (D18)
      readonly severity: "warn" | "error";
      readonly code: "push_after_terminal";  // v0's only case: Push after Seal/Close (D19)
    };
```

The `diagnostic` output is not addressed and needs no reader: the shell routes
it to console/logging idiomatically — `console.warn` by default, or an injected
sink (e.g. `LogShellOptions.onDiagnostic`) — **never inside the engine**, which
is sans-io (D18). Code-only keeps the oracle byte-stable across languages.

### 4.4 The engine: `LogNode`

One instance per log. A class — it owns real state (window + session table)
and a single behavioral entry point; the read-only accessors are `get`ters.

```ts
export interface LogNodeOptions {
  /** ProducerStop policy (D6). Fires on the ≥1→0 reader transition only
   *  under "last_reader"; always on Close. Default pinned by the oracle. */
  readonly stopWhen?: "last_reader" | "explicit_only";
}

/** Pure mailbox endpoint (D1): no I/O, no clock, no callbacks, no locks.
 *  Outputs are a deterministic function of the input history (D16). */
export class LogNode {
  constructor(opts?: LogNodeOptions);

  /** Feed one input; collect zero or more outputs. Synchronous. Held tail
   *  reads are ENGINE STATE: a read that cannot be answered now produces no
   *  response until a later input releases it (shared §3.4). When one input
   *  releases several held reads, responses are emitted in stream-creation
   *  order (D16). */
  handle(input: LogInput): LogOutput[];

  // Read-only accessors — in-process conveniences (shared §2.1); never
  // mutating, never part of the wire contract.
  get head(): number;                    // highest assigned seq; 0 if empty (D8)
  get floor(): number;                   // lowest retained seq
  get minWatermark(): number | undefined; // min per-stream watermark (D7); undefined if no streams
  get streamCount(): number;             // live session entries
}
```

Read resolution inside `handle` implements shared §3.4 verbatim — data /
caught-up (`eof`/`closed`/`failed`/hold-or-probe per `timeoutMs`, D14) /
invalid-cursor → `expired` with earliest-resumable `nextCursor` (D9: below
floor → `{seq: floor − 1}`; beyond head → `{seq: head}`) — and the terminal
states remain re-readable (they describe the *log*, not the stream).

### 4.5 Internal split: store core + session table (D2, D3)

Two **internal modules** — deliberately not exported, not interfaces, not
seams. The split is the shape-generic architecture (for `crdt`/`swmr` the
session entry grows richer; the window stays shared), but in v0 it is an
implementation detail of `LogNode`:

```ts
// src/window.ts (internal) — the store core: records window, head, floor,
// sealed/closed/failed. No stream concepts. Distilled from glade store.ts
// (single-origin: Map<seq, LogRecord> or ring array + head/floor counters).
class Window {
  push(payload: Uint8Array): LogRecord;              // assigns seq = head + 1 (D8)
  scan(afterSeq: number, maxRecords: number, maxBytes: number): readonly LogRecord[]; // D10
  evict(upToSeq: number): void;                      // raises floor (D7)
  head: number;  floor: number;
  sealed: boolean;  closeError?: LogError | null;    // null = closed clean; undefined = live
}

// src/session.ts (internal) — one entry per stream instance: the per-stream
// "response handler". No byte/retention concepts.
interface Session {
  heldRead?: { cursor: Cursor; maxRecords?: number; maxBytes?: number };
  timerToken?: number;                               // pending SetTimer, if any (D14)
  watermark: number;                                 // highest seq delivered (D7)
}
// Table: Map<string /* streamId */, Session>.
// JS Map iteration order IS insertion order — stream-creation-order emission
// (D16) falls out of the data structure for free.
```

Timer tokens come from a monotonic counter starting at 1 inside `LogNode`
(D16). Stream instances are disposable (D3): position lives in the client-held
cursor, so a lost stream loses only its held poll.

### 4.6 The shell: `LogShell` (the pump)

Per shared §2.1/D15 the engine is unsynchronized and the shell owns
serialization. In JS the event loop already provides mutual exclusion — the
real hazard is **re-entrancy** (an output handler synchronously calling
`send()` while a previous `handle` dispatch is still unwinding). The pump
therefore serializes with an input queue + drain flag, which is the
single-threaded rendering of D15's "lock or single loop":

```ts
export interface LogShellOptions {
  /** Routed ProducerStop (shared §3.3): the shell delivers it to the producer
   *  (e.g. halt a lazy render). Shells that initiated the close may ignore it
   *  (idempotent by design). */
  readonly onProducerStop?: (reason: "last_reader_gone" | "closed" | "failed") => void;
}

/** Owns one LogNode: serializes handle(), runs real timers, dispatches
 *  addressed outputs. The ONLY place async/clock concepts appear. */
export class LogShell {
  constructor(node: LogNode, opts?: LogShellOptions);

  /** Enqueue an input and drain: while draining, further send() calls append
   *  to the queue instead of re-entering handle(). Non-response outputs are
   *  consumed here: set_timer → setTimeout(ms, () => send timer_expired);
   *  cancel_timer → clearTimeout; producer_stop → onProducerStop. */
  send(input: LogInput): void;

  /** Register the response handler for one stream (used by the sugar; also
   *  usable directly by an adapter). Responses are addressed by streamId (D3). */
  onResponse(streamId: string, handler: (r: Extract<LogOutput, { type: "response" }>) => void): void;
  removeResponseHandler(streamId: string): void;

  get node(): LogNode;             // accessor passthrough (head/floor/…)
}
```

Timer handles are `ReturnType<typeof setTimeout>` (portable across Node and
browsers), keyed by token in a `Map`. The shell holds no protocol state — held
reads, supersede, watermarks all live in the engine; the shell is
transport-shaped plumbing.

### 4.7 Idiomatic streaming sugar: `readStream`

An async generator over the pump, per shared §6/P3.2: issue `read` with **no
`timeoutMs`** (hold indefinitely, D14) → await the addressed `response` →
yield → repeat with `nextCursor`. Terminal states end the iteration.
**Cancellation maps to `EndStream`** (D4) — by `AbortSignal` *and* by early
exit (`break`/`return` from `for await` drives the generator's `finally`,
which sends `end_stream`). Both paths converge on the same input message.

```ts
export interface ReadStreamOptions {
  readonly from?: Cursor;          // default START (D8)
  readonly maxRecords?: number;
  readonly maxBytes?: number;      // payload bytes only; forward progress guaranteed (D10)
  readonly signal?: AbortSignal;   // abort ⇒ EndStream, then throw signal.reason
  readonly streamId?: string;      // default: minted (crypto.randomUUID())
}

export type LogResponse = Extract<LogOutput, { type: "response" }>;

/** for await (const r of readStream(shell)) { … }  — yields each response
 *  (data batches AND the terminal/expired states, so the consumer sees
 *  `expired`'s resumable nextCursor as data, never as a throw — D9).
 *  Returns after yielding a terminal state (eof/closed/failed). */
export function readStream(shell: LogShell, opts?: ReadStreamOptions): AsyncIterable<LogResponse>;
```

Reference shape of the loop (illustrative, not the full body):

```ts
export async function* readStream(shell, opts = {}) {
  const streamId = opts.streamId ?? crypto.randomUUID();
  let cursor = opts.from ?? START;
  try {
    for (;;) {
      opts.signal?.throwIfAborted();
      const resp = await nextResponse(shell, streamId, opts.signal, () =>
        shell.send({ type: "read", streamId, cursor,
                     maxRecords: opts.maxRecords, maxBytes: opts.maxBytes }));
      cursor = resp.nextCursor;
      yield resp;                              // includes expired/eof/closed/failed states
      if (resp.state === "eof" || resp.state === "closed" || resp.state === "failed") return;
      // "expired" is NOT terminal: the caller decides; iterating on continues
      // lossy from the resumable cursor (D9). "would_block" cannot occur here
      // (no timeoutMs ⇒ the engine holds instead — D14).
    }
  } finally {
    shell.send({ type: "end_stream", streamId }); // idempotent; unknown id no-op (D4)
    shell.removeResponseHandler(streamId);
  }
}
```

`nextResponse` registers the stream's response handler as a one-shot Promise
and races it against the `AbortSignal` (rejecting with `signal.reason`, the
platform-standard `AbortError` `DOMException`). Note what the abort does *not*
do: it never closes the log (the v1 draft's `abort → close()` is wrong under
v2 — closing is the producer's act; a departing reader just ends its stream).
The **only** throw in the whole surface is the platform abort; every
protocol outcome, `expired` included, is a yielded state (D9).

A convenience `records(shell, opts): AsyncIterable<LogRecord>` (flattening
data batches, ending at terminal states) may ride along as sugar-on-sugar;
`readStream` is the normative surface.

### 4.8 The service layer: `LogService` (shared §3.5)

Thin multi-log routing — the wire vocabulary is the node messages plus
`logId` (the taut companion messages, architecture §4). Producer-side inputs
stay node-local in v0 (the producer holds its `LogNode`/`LogShell` directly).

```ts
/** Stream-side wire inputs = node stream inputs + logId. */
export type LogServiceInput =
  { readonly logId: string } & Extract<LogInput, { type: "read" | "end_stream" }>;

export type LogServiceOutput =
  { readonly logId: string } & Extract<LogOutput, { type: "response" }>;

export class LogService {
  /** Mint a logId for a node (the producing call returns it, e.g. DiffOutputLogRef). */
  register(node: LogNode): string;
  release(logId: string): void;
  lookup(logId: string): LogNode | undefined;

  /** Route by logId. Unknown logId ⇒ a synthesized failed response with
   *  error {code: "unknown_log"} addressed to the requesting stream (the one
   *  error the node engine itself never emits — shared §3.1). Exact shape
   *  pinned by the oracle/tool protocol. */
  handle(input: LogServiceInput): LogServiceOutput[];
}
```

The service composes with shells either way: a network adapter drives
`LogService.handle` directly from decoded frames (tagging outputs back onto
connections by its own client bookkeeping — clients are adapter-only, D3), or
an in-process consumer skips the service entirely and holds a `LogShell`. The
CLI `node` mode (Phase 4) is `LogService` + framing and almost nothing else —
by design.

### 4.9 Rationale for the chosen idioms (summary)

- **Discriminated unions for messages** — the canonical TS rendering of a
  closed vocabulary: exhaustive `switch (msg.type)` with a `never` default
  arm gives compile-time coverage of every message; plain structural objects
  mean oracle vectors, tests, and adapters construct messages with object
  literals (no classes to instantiate, nothing to serialize specially); the
  union type *is* the documentation of shared §3.1–3.3.
- **snake_case tags / camelCase fields** — tags and state strings are wire
  vocabulary (D13 pins the state spellings; tags follow the same rule) so
  transcripts read identically across languages; field names stay idiomatic
  and the oracle loader owns the fixed mapping.
- **`LogNode` as a class with `handle(input): LogOutput[]`** — the engine owns
  real mutable state behind one entry point; a class with getters is the
  lightest idiomatic wrapper. Returning a fresh array (not a generator, not a
  callback) keeps outputs inspectable and golden-comparable as plain data (D1).
- **No `Store` interface, no `Readiness`, no callbacks** — v2 deletions, not
  omissions: bytes live in the internal window (D2); readiness dissolved into
  message ordering (held reads are engine state, D1); producer-stop is an
  output message routed by the shell (D6). The engine imports nothing async.
- **Pump = queue + drain flag** — the JS-native form of D15. Mutual exclusion
  is free on one event loop; the queue guards the re-entrancy case (a handler
  synchronously sending) so `handle` is never re-entered.
- **`AbortSignal` + generator-`finally` for cancellation** — the platform
  primitive plus the language's own cleanup channel; both funnel into the one
  protocol act, `end_stream` (D4). No `canceled` error code exists on the
  wire; the abort throw is the platform's `AbortError`, not a taut-shape type.
- **`AsyncIterable` for the stream** — `for await` is the idiomatic consumer
  ergonomic; backpressure is implicit in the pull loop (a held read is only
  outstanding while the consumer awaits — ≤1 per stream, D5, by construction).
- **JS `Map` insertion order for D16** — the session table's iteration order
  is creation order by language guarantee; determinism is structural, not
  bookkept.

### 4.10 Open questions — v1 dispositions and what remains

**Resolved by the v2 pinned decisions (removed from this plan):**

1. *(v1 Q2)* `START = {seq: -1}` sentinel vs optional cursor — **resolved by
   D8**, and the v1 rendering was wrong: first record is `seq = 1`,
   `START = {seq: 0}`, empty log `head = 0`, absent `cursor` on `read` ⇒
   START. We render **both** forms compatibly: `cursor?: Cursor` (matches the
   schema's optional) *and* an exported `START` constant (no magic number at
   call sites). Fixed everywhere in this document.
2. *(v1 Q3)* `Expired` soft state vs thrown `ExpiredCursorError` — **resolved
   by D9**: `expired` is a state, never thrown, and the response carries the
   earliest-resumable `next_cursor`. `ExpiredCursorError` (and the whole
   thrown `TautShapeError` hierarchy) is deleted; `readStream` yields the
   expired response and lets the caller decide (continue lossy or stop).
3. *(v1 Q5)* `maxBytes` accounting unit — **resolved by D10**: raw payload
   bytes only, with the forward-progress guarantee (≥1 record returned when
   any is available, even if it alone exceeds the budget).
4. *(v1 Q6)* where `close()` lives for the adapter / reader-writer bundling —
   **dissolved by D1/D3/D4**: cancellation is the `end_stream` input, not a
   close; there is no reader/writer object pair to bundle — the sugar holds a
   `LogShell` and everything else is messages.
5. *(v1, implicit)* the entire `Store` seam contract (`scan`/`expired: true`
   flag/consumer backing) — **superseded by D2**: v0 bytes live in the
   engine-internal window with `evict` as an input; the external store is the
   shared-§9 additive extension (`ScanRequest`/`ScanResult`), designed, not v0.
6. *(v1, implicit)* `onReady`/`Readiness`/notify — **deleted by D1**: held
   long-polls are engine state, answered when a later input releases them.

**Still open (genuinely TypeScript-local), updated for v2:**

- **Q-A: `LogRecord` vs `Record` naming.** We keep `LogRecord` to avoid
  shadowing TS's built-in `Record<K,V>` utility type. With the v2 vocabulary
  the prefix question widens slightly: `LogInput`/`LogOutput`/`LogState`/
  `LogError` are proposed as the consistently-prefixed family (matching the
  architecture's `LogReadRequest`/`LogReadResponse`), with `Cursor` and
  `START` left unprefixed as the short, high-frequency names. Confirm or
  prefix uniformly.
- **Q-B: enum erasure / value-level state names.** v2 renders `LogState` (and
  all tags) as **string-literal unions**, which erase to nothing and cannot
  hit the `const enum` bundler pitfalls the v1 draft flagged. Remaining
  choice: whether to also ship a value-level companion object
  (`export const LogStates = { data: "data", … } as const`) for consumers who
  want runtime iteration/validation of the state set (the oracle loader needs
  one internally either way). Pin during Phase 0 build setup.
- **Q-C: generic payload typing.** Should `LogRecord` be
  `LogRecord<T = Uint8Array>` carrying a decoded `T`? With no public store
  seam left, the cost is lower than in v1 (only `readStream`/`records` would
  grow a decoder option), but the engine and oracle must stay bytes-only.
  Proposal: defer to v0.1 as a sugar-level `records(shell, { decode })`
  option (the natural decoder being the taut decode of the method's
  append-type message the payload carries — D17); the message types stay
  `Uint8Array` forever.

---

## 5. Phases

Same phase names as the shared plan (§6); TypeScript-specific steps, each an
aspirational **< 500 LOC** goal. Foundational-first; steps marked *(parallel)*
can proceed independently once their prerequisites land.

### Phase 0 — Scaffold & contract intake
- **S0.1 — Repo skeleton.** `package.json` (`@owebeeone/taut-shape`, ESM,
  exports map per §3), `tsconfig.json` (strict, NodeNext, ES2022),
  `README.md`, `LICENSE`, empty `docs/api/` + `docs/examples/`, `src/` +
  `tests/` layout. *(foundational)*
- **S0.2 — Test runner + golden + CI.** Wire **vitest** (config, snapshot dir,
  coverage), `tsc --noEmit` typecheck, `tsup` build, and CI running typecheck
  + test + oracle reproduction. *(parallel after S0.1)*
- **S0.3 — Contract intake.** Vendor `src/taut/{cbor,codec,schema}.ts` from
  the taut runtime (as glade/client-ts does); **generate and vendor the
  `shape_log` message types** from `taut-shape/ir/shape_log.taut.py` via
  `tautc gen -l typescript` — the types-only `api.ts` output as
  `src/taut/gen/shape_log.ts` plus the exported `shape_log.ir.json` for the
  schema-driven codec (D17; record the pinned schema version alongside the
  oracle pin); pin the **oracle vectors** path/version and the
  **tool-protocol** spec from `taut-shape` (record both in README +
  `docs/api/oracle.md`). Add `bytes.ts` helpers. Settle Q-B
  (value-level state names). *(parallel after S0.1)*

### Phase 1 — The engine (foundational; the API to get right)
- **S1.1 — Message + core types.** `messages.ts`: re-export the **generated**
  `shape_log` types vendored in S0.3 — `Cursor`/`START` (D8), `LogRecord`
  (D11), `LogState` (D13), `LogError` — and hand-write only the
  `LogInput`/`LogOutput` discriminated unions over them (§4.1–4.3, D17). No
  behavior. *(foundational)*
- **S1.2 — Store core: the window.** `window.ts` (internal): `push` append
  (seq from 1 — D8), bounded `scan` with `maxRecords`/`maxBytes` +
  forward-progress (D10), `head`/`floor`, `evict` (D7). Source: **mirror**
  `glade/client-ts/src/store.ts`, distilled single-origin (§1). *(after S1.1)*
- **S1.3 — Session table + read resolution.** `session.ts` (internal) +
  `node.ts`: the `Map`-backed session table, implicit stream create (D4),
  held reads as engine state, supersede (D5), `end_stream` cleanup,
  watermarks (D7), reader-count / `producer_stop` transition + `stopWhen`
  knob (D6), the full §3.4 resolution table including `expired` with
  earliest-resumable `nextCursor` (D9) and re-readable terminal states.
  Source: **clean-room** (no glade equivalent). *(after S1.2)*
- **S1.4 — Lifecycle + timers.** `seal`/`close`(+error) → `eof`/`closed`/
  `failed` (D12) releasing held reads; `set_timer`/`cancel_timer`/
  `timer_expired` (D14); token monotonicity + creation-order emission (D16);
  read-only accessors. *(after S1.3)*

### Phase 2 — Golden conformance
- **S2.1 — Oracle-vector loader.** `oracle.ts`: parse the committed
  `taut-shape` vectors — pure `(input message sequence) → (expected output
  message sequence)` pairs — into `LogInput[]`/`LogOutput[]` (field-name
  mapping per §4 conventions). *(after S1.1; parallel with S1.2–S1.4)*
- **S2.2 — Replay + whole-output golden.** `tests/oracle.test.ts`:
  `inputs.flatMap(i => node.handle(i))` and assert the **whole observed
  output sequence** exactly equals the expected sequence (vitest
  exact-equality — the primary golden; never per-field assertions). CLI
  transcripts use `toMatchSnapshot`. *(after S1.4)*
- **S2.3 — Lockstep gate.** A CI check that fails if the committed oracle
  version drifts from the pinned `taut-shape` version (corpus-bump
  coordination point).

### Phase 3 — Shell & idiomatic stream surface
- **S3.1 — The pump.** `shell.ts`: `LogShell.send` queue + drain flag (the
  D15 serialization form, §4.6), `setTimeout`-backed timers fed back as
  `timer_expired`, addressed-response dispatch, `onProducerStop` routing.
  *(after S1.4)*
- **S3.2 — Streaming sugar + cancellation.** `stream.ts`: `readStream()`
  async generator (§4.7) — `read` with no `timeoutMs` → await addressed
  response → yield → repeat; `AbortSignal` *and* early-`break` both →
  `end_stream` (D4). `tests/stream.test.ts` golden-tests tail-then-push,
  seal→eof, abort→EndStream (+ `producer_stop` under `stopWhen:
  "last_reader"`), expired-yield-then-resume. *(after S3.1)*

### Phase 4 — Conformance / interop CLI tool
- **S4.1 — Framing.** `framing.ts`: length-prefixed CBOR taut companion
  messages on the data channel (reuse vendored `cbor.ts`/`codec.ts`); OOB
  JSONL on the control/result channel (scenario in, observed transcript out).
- **S4.2 — Modes.** `cli.ts`: **`gen`** (reference-only — a stub for TS,
  which *reproduces* rather than generates), **`check`** (replay the
  committed oracle through `LogNode`, report pass/fail), **`node`** (run
  `LogNode` + `LogService` behind stdin/stdout framing), **`client`** (the
  reading side: the cursor loop via `readStream` against a node).
  `tests/cli.e2e.test.ts` spawns the tool and snapshots the transcript,
  following taut's `test_kotlin.py` subprocess convention (a Python driver
  spawns the tool, asserts on structured output).

### Phase 5 — Interop matrix participation
- **S5.1 — Matrix pairings.** Pass `node(ts) ⊗ client(Y)` and
  `node(X) ⊗ client(ts)` for all language pairs, driven by `taut-shape`'s
  matrix harness. No new TS surface beyond making the CLI robust to the
  harness's framing/timeouts.

### Phase 6 — `stream` shape (deferred)
Out of scope here; lands after `log` is green across all languages.

---

## 6. Conformance obligations (TypeScript binding)

Restating the shared §5 in TS terms:
1. **Reproduce the behavioral oracle** — `tests/oracle.test.ts` replays each
   vector's input messages through `LogNode.handle` and asserts the **whole
   observed output-message sequence** exactly equals the expected sequence
   (vitest exact-equality; the committed `taut-shape` JSON is the primary
   golden). Never per-field assertions.
2. **Ship the conformance/interop CLI tool** — `src/cli.ts` with
   `gen`/`check`/`node`/`client`; data channel = length-prefixed CBOR taut
   companion messages (the real wire, under test), control/result channel =
   OOB JSONL; driven exactly like taut's `test_kotlin.py` subprocess pattern.
   The interop matrix runs `node(X) ⊗ client(Y)` for all pairs.
3. **House style = golden/snapshot** — vitest `toMatchSnapshot` for derived
   surfaces (CLI transcripts, error rendering); oracle JSON asserted exactly.
   Capture and diff whole outputs, never bespoke per-case assertions.

---

## 7. docs/ deliverables

**`docs/api/`** (one spec per surface — the §4 API, prose + signatures):
- `messages.md` — the full input/output vocabulary (§4.1–4.3): `Cursor`/
  `START` (D8), `LogRecord` (D11), `LogState` strings (D13), `LogError`, both
  unions; the camelCase↔wire field mapping; supersede (D5) and
  `end_stream`-as-disconnect (D4) semantics.
- `engine.md` — `LogNode`: `handle` contract, the §3.4 read-resolution table
  (data / caught-up / `timeoutMs` semantics D14 / `expired` + resumable
  cursor D9 / re-readable terminals D12), `evict` + watermarks (D7),
  `stopWhen` (D6), determinism rules (D16), read-only accessors and their
  in-process-only status.
- `shell.md` — `LogShell`: the pump contract (queue/drain serialization —
  D15), timer wiring, response dispatch, `producer_stop` routing;
  `readStream` and the two cancellation paths (`AbortSignal`, early `break`)
  both mapping to `end_stream`.
- `service.md` — `LogService`: `logId` minting/routing, the synthesized
  `unknown_log` failed response, mapping to the taut companion messages
  (`LogReadRequest`/`LogEndStream`/`LogReadResponse`), and where the
  client/connection concept lives (adapter-only — D3).
- `oracle.md` — pinned oracle/tool-protocol version, the vector format
  `(inputs) → (expected outputs)`, the CLI framing spec (length-prefixed CBOR
  + OOB JSONL), how to run `check`, and the corpus-bump procedure.

**`docs/examples/`** (worked, runnable):
- `quickstart.ts` — raw engine: construct `LogNode`, `handle` a few
  `push`/`read` messages, inspect the returned outputs, `seal` → `eof`. Shows
  the pure-mailbox discipline with zero shell.
- `tail.ts` — `for await (const r of readStream(shell))` tailing live pushes
  through a `LogShell`.
- `cancel.ts` — abort a tail via `AbortSignal`; observe `end_stream` and (with
  `stopWhen: "last_reader"`) the routed `producer_stop`.
- `multi-stream.ts` — two backed-up readers over one log at different cursors;
  one `push` waking both held reads (creation-order responses — D16);
  watermark-driven `evict`.
- `expired.ts` — evict below a reader's cursor; observe the `expired` state
  and resume lossy from the returned `nextCursor` (D9).
- `cli-interop.md` — drive `node | client` over a pipe by hand.

---

## 8. Non-goals (inherited)
- Production transport/framing beyond the CLI's test framing — the consumer's
  concern (gwz's bridge owns PyO3 / cross-runtime async; the engine never
  sees a connection — D3).
- The external-store extension (`ScanRequest`/`ScanResult`, shared §9) —
  designed, additive, not built until a real consumer needs it.
- `swmr` / `snapshot_delta` / `crdt` shapes (the store-core/session-table
  split is designed for them; nothing speculative lands now).
- Performance optimization — pure-TS first; revisit only on profiling
  evidence.
- Any cross-runtime wakeup / cancel-propagation logic — explicitly the
  consumer's.
