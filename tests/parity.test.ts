// taut's codec-parity corpus (contract taut-codec-parity/i64/v1), replayed through the
// vendored runtime, src/taut/{cbor,codec,schema}.ts, as taut's TypeScript gate replays it
// through taut's own (TautCheckedDecode.md CD-C4, CD-V3). Each row is observed as the
// runner in taut/src/taut/corpus/parity_typescript.py observes it, and judged as
// taut/src/taut/corpus/parity.py's `judge` judges that observation: by tag and payload,
// an accepted row by its re-encoding, and a typed decode by the bounds it resolved.
//
// tests/parity/ holds taut v0.10.0's inputs to that runner, never hand-edited:
// int.vectors.json, malformed.vectors.json and bounds.vectors.json are copies of taut's
// corpus/parity/ files; parity_int.ir.json is its fixture, ir/parity_int.taut.py, exported
// at IR version 2 (taut.ir.export.export_to); dispatch.json names the fixture's messages
// and enums (taut.corpus.parity.write_json_rows). Re-copy all five from the taut release
// this package vendors its runtime from.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DEFAULT_MAX_DEPTH,
  MAX_DEPTH_CEILING,
  decode as cborDecode,
  encode as cborEncode,
} from "../src/taut/cbor.ts";
import { decode, decodeRef, encode } from "../src/taut/codec.ts";
import { loadSchema } from "../src/taut/schema.ts";

// The contract every vector file names (parity.py CONTRACT).
const CONTRACT = "taut-codec-parity/i64/v1";
// The payload fields a row may name and a DecodeError may carry, in report order
// (parity.py PAYLOAD_FIELDS). The typescript target carries all of them.
const PAYLOAD = ["info", "major", "key", "expected", "enum", "value", "len", "limit"] as const;
// The form of a from_cbor row's resolved bounds (parity.py _BOUNDS_COLUMN).
const BOUNDS_COLUMN = /^max_depth=[0-9]+;max_encoded_len=[0-9]*$/;

type Segment = string | { repeat: string; count: number };

interface Expect {
  accept?: boolean;
  reencode?: string;
  tag?: string;
  [field: string]: unknown;
}

interface Bounds {
  max_depth: number;
  max_encoded_len?: number;
}

interface DecodeRow {
  name: string;
  stage: "raw_decode" | "from_cbor" | "from_wire";
  schema?: string;
  bytes: string | Segment[];
  len?: number;
  limits?: { max_depth?: number; max_encoded_len?: number };
  bounds?: Bounds;
  expect: Expect;
  expect_dropping?: Expect;
}

interface IntRow {
  name: string;
  kind: "round_trip" | "encode_fail";
  message: string;
  value: { n: string; by_id: [string, string][] };
  cbor?: string;
  expect?: { tag: string };
}

interface VectorFile<Row> {
  version: number;
  contract: string;
  vectors: Row[];
}

interface BoundsFile extends VectorFile<DecodeRow> {
  default_max_depth: number;
  max_depth_ceiling: number;
}

/** What a runner reports for a malformed or bounds row: `ok` with the hex of the
 *  re-encoding, `err` with `Tag;field=value...`, or `untyped` for any other throw; and,
 *  for a from_cbor row, the bounds its typed entry point resolved. */
interface Observation {
  outcome: "ok" | "err" | "untyped";
  detail: string;
  resolved?: string;
}

function load<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`./parity/${name}`, import.meta.url), "utf8")) as T;
}

const schema = loadSchema(load<unknown>("parity_int.ir.json"));
const intFile = load<VectorFile<IntRow>>("int.vectors.json");
const malformedFile = load<VectorFile<DecodeRow>>("malformed.vectors.json");
const boundsFile = load<BoundsFile>("bounds.vectors.json");
const dispatch = load<{ messages: string[]; enums: string[] }>("dispatch.json");

// The fixture's typed entry points, by message name (from_cbor) and enum name (from_wire).
// A message decodes from bytes under its effective bounds and returns the decoded value's
// own encoding; an enum row never accepts.
const fromCbor = new Map<string, (data: Uint8Array) => Uint8Array>(
  dispatch.messages.map((name) => [
    name,
    (data: Uint8Array) => encode(schema, name, decode(schema, name, data)),
  ]),
);
const fromWire = new Map<string, (data: Uint8Array) => unknown>(
  dispatch.enums.map((name) => [name, (data: Uint8Array) => decodeRef(schema, { k: "enum", name }, data)]),
);

function hexToBytes(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function entryPoint<F>(entries: Map<string, F>, name: string | undefined): F {
  const entry = name === undefined ? undefined : entries.get(name);
  if (entry === undefined) {
    throw new Error(`no typed entry point named ${String(name)}`);
  }
  return entry;
}

/** A row's bytes: a hex string, or segments, each a hex string or {repeat, count},
 *  expanded here; an expansion whose length is not the row's `len` throws a plain Error,
 *  so the row is reported untyped (the bounds protocol, item 5). */
function rowBytes(row: DecodeRow): Uint8Array {
  const segments: Segment[] = typeof row.bytes === "string" ? [row.bytes] : row.bytes;
  const pieces = segments.map((seg): [Uint8Array, number] =>
    typeof seg === "string" ? [hexToBytes(seg), 1] : [hexToBytes(seg.repeat), seg.count],
  );
  const out = new Uint8Array(pieces.reduce((sum, [piece, count]) => sum + piece.length * count, 0));
  let at = 0;
  for (const [piece, count] of pieces) {
    for (let i = 0; i < count; i++) {
      out.set(piece, at);
      at += piece.length;
    }
  }
  if (row.len !== undefined && out.length !== row.len) {
    throw new Error(`bytes expand to ${out.length} bytes, len is ${row.len}`);
  }
  return out;
}

/** A decoded row's re-encoding: a raw row's tree, decoded with the row's limits; a
 *  from_cbor row's typed value, decoded from bytes by its message's typed entry point;
 *  nothing for a from_wire row. */
function decodeRow(row: DecodeRow, data: Uint8Array): Uint8Array {
  if (row.stage === "raw_decode") {
    const limits = row.limits ?? {};
    return cborEncode(cborDecode(data, { maxDepth: limits.max_depth, maxEncodedLen: limits.max_encoded_len }));
  }
  if (row.stage === "from_cbor") {
    return entryPoint(fromCbor, row.schema)(data);
  }
  entryPoint(fromWire, row.schema)(data);
  return new Uint8Array(0);
}

/** A DecodeError is recognised by name and tag, not instanceof (CD-E3). */
function isDecodeError(error: unknown): error is { tag: string } & Record<string, unknown> {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const fields = error as Record<string, unknown>;
  return fields.name === "DecodeError" && typeof fields.tag === "string";
}

/** An `err` detail: the tag, then `;field=value` for each payload field it carries. */
function describe(error: { tag: string } & Record<string, unknown>): string {
  let detail = error.tag;
  for (const field of PAYLOAD) {
    if (error[field] !== undefined) {
      detail += `;${field}=${String(error[field])}`;
    }
  }
  return detail;
}

/** The runner's observation of one malformed or bounds row. */
function observe(row: DecodeRow): Observation {
  let seen: Observation;
  try {
    seen = { outcome: "ok", detail: bytesToHex(decodeRow(row, rowBytes(row))) };
  } catch (error) {
    seen = isDecodeError(error)
      ? { outcome: "err", detail: describe(error) }
      : { outcome: "untyped", detail: String(error) };
  }
  if (row.stage === "from_cbor") {
    const effective = schema.rootEffective({ k: "msg", name: row.schema ?? "" });
    seen.resolved = `max_depth=${effective.max_depth};max_encoded_len=${effective.max_encoded_len ?? ""}`;
  }
  return seen;
}

function formatError(tag: string, payload: Record<string, unknown>): string {
  let detail = tag;
  for (const field of PAYLOAD) {
    if (field in payload) {
      detail += `;${field}=${String(payload[field])}`;
    }
  }
  return detail;
}

function parseError(detail: string): [string, Map<string, string>] {
  const [tag, ...fields] = detail.split(";");
  const payload = new Map<string, string>();
  for (const item of fields) {
    const at = item.indexOf("=");
    if (at < 0) {
      payload.set(item, "");
    } else {
      payload.set(item.slice(0, at), item.slice(at + 1));
    }
  }
  return [tag ?? "", payload];
}

function formatBounds(bounds: Bounds): string {
  return `max_depth=${bounds.max_depth};max_encoded_len=${bounds.max_encoded_len ?? ""}`;
}

/** parity.py's `judge` for the typescript target: why the row fails, or null when it
 *  passes. Its codec keeps unknown fields, so `expect` applies, never `expect_dropping`,
 *  and it is exempt from no payload field. */
function judge(row: DecodeRow, seen: Observation): string | null {
  if (row.stage !== "from_cbor") {
    if (seen.resolved !== undefined) {
      return `a ${row.stage} row has no fourth column, got ${seen.resolved}`;
    }
  } else {
    if (seen.resolved !== undefined && !BOUNDS_COLUMN.test(seen.resolved)) {
      return `resolved bounds ${seen.resolved}, not max_depth=<n>;max_encoded_len=<n or empty>`;
    }
    if (row.bounds !== undefined) {
      const wantBounds = formatBounds(row.bounds);
      if (seen.resolved === undefined) {
        return `no resolved bounds reported, expected ${wantBounds}`;
      }
      if (seen.resolved !== wantBounds) {
        return `resolved ${seen.resolved}, expected ${wantBounds}`;
      }
    }
  }
  const expect = row.expect;
  const want = expect.accept ? "accept" : formatError(expect.tag ?? "", expect);
  if (seen.outcome === "ok") {
    if (want !== "accept") {
      return `decoded ok, expected ${want}`;
    }
    const reencoding =
      expect.reencode ?? (typeof row.bytes === "string" ? row.bytes : bytesToHex(rowBytes(row)));
    if (!seen.detail) {
      return "no re-encoding reported";
    }
    if (seen.detail !== reencoding) {
      return `re-encoded ${seen.detail}, expected ${reencoding}`;
    }
    return null;
  }
  if (seen.outcome === "untyped") {
    return `untyped ${seen.detail}, expected ${want}`;
  }
  if (want === "accept") {
    return `got ${seen.detail}, expected accept`;
  }
  const [tag, payload] = parseError(seen.detail);
  const drift = Object.keys(expect).filter(
    (name) => name !== "tag" && payload.get(name) !== String(expect[name]),
  );
  if (tag !== expect.tag || drift.length > 0) {
    return `got ${seen.detail}, expected ${want}`;
  }
  return null;
}

function intBox(value: IntRow["value"]): { n: bigint; by_id: Map<bigint, bigint> } {
  return {
    n: BigInt(value.n),
    by_id: new Map(value.by_id.map(([key, item]): [bigint, bigint] => [BigInt(key), BigInt(item)])),
  };
}

/** The runner's own check of an int row: why it fails, or null when it passes. A round
 *  trip encodes to the row's bytes and decodes back to its `n` and those bytes; an
 *  encode_fail row's encode throws the row's tag. */
function checkIntRow(row: IntRow): string | null {
  const native = intBox(row.value);
  if (row.kind === "round_trip") {
    try {
      const encoded = bytesToHex(encode(schema, row.message, native));
      if (encoded !== row.cbor) {
        return `encode ${encoded}`;
      }
      const decoded = decode(schema, row.message, hexToBytes(row.cbor));
      const again = bytesToHex(encode(schema, row.message, decoded));
      return decoded.n === native.n && again === row.cbor ? null : "roundtrip mismatch";
    } catch (error) {
      return `threw ${isDecodeError(error) ? error.tag : String(error)}`;
    }
  }
  try {
    encode(schema, row.message, native);
    return "encoded, expected IntOutOfSubset";
  } catch (error) {
    const tag = typeof error === "object" && error !== null ? (error as { tag?: unknown }).tag : undefined;
    return tag === row.expect?.tag ? null : `threw ${String(tag ?? error)}`;
  }
}

test("parity corpus: taut's contract, one name per row, and the runtime's constants", () => {
  const names = new Set<string>();
  for (const file of [intFile, malformedFile, boundsFile] as VectorFile<{ name: string }>[]) {
    assert.equal(file.version, 1);
    assert.equal(file.contract, CONTRACT);
    assert.ok(file.vectors.length > 0);
    for (const row of file.vectors) {
      assert.ok(!names.has(row.name), `row name ${row.name} appears twice in the corpus`);
      names.add(row.name);
    }
  }
  // The bounds protocol, item 1: the runtime's own constants are the bounds header's.
  assert.equal(DEFAULT_MAX_DEPTH, boundsFile.default_max_depth);
  assert.equal(MAX_DEPTH_CEILING, boundsFile.max_depth_ceiling);
});

for (const row of intFile.vectors) {
  test(`parity int row: ${row.name}`, () => {
    assert.equal(checkIntRow(row), null);
  });
}

for (const [kind, file] of [
  ["malformed", malformedFile],
  ["bounds", boundsFile],
] as const) {
  for (const row of file.vectors) {
    test(`parity ${kind} row: ${row.name}`, () => {
      assert.equal(judge(row, observe(row)), null);
    });
  }
}
