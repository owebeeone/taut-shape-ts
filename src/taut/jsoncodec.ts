// IR-driven CBOR <-> JSON bridge — a canonical JSON profile for the same IR.
// The TypeScript mirror of taut/src/taut/wire/jsoncodec.py (taut ships no TS
// jsoncodec yet; this is an UPSTREAM-TO-TAUT CANDIDATE — vendor it into
// taut/src/taut/gen/runtime/typescript/ once taut grows a TS jsoncodec emitter).
//
// Point at the IR (via SchemaIndex) + a message name and convert between native
// values and JSON-safe values, losslessly, with NO per-message code. Conventions
// follow proto3's JSON mapping, matching jsoncodec.py exactly:
//
//   - int (i64)        -> JSON string  (JSON numbers are IEEE-754 doubles, safe
//                                       only to 2^53; 64-bit ints ride as text)
//   - bytes            -> base64 string
//   - enum             -> its member-name string
//   - bool / str       -> passthrough
//   - float            -> JSON number (finite); "NaN"/"Infinity"/"-Infinity" else
//   - list             -> JSON array
//   - message          -> JSON object keyed by field name
//   - optional absent  -> JSON null
//
// Like proto3 JSON, this profile does NOT carry unknown/residual fields; the CBOR
// wire is the forward-compat-preserving form. A "native value" here matches the
// vendored codec.ts convention: a plain object keyed by field name, enums as
// member-name strings, bytes as Uint8Array, ints as bigint, maps as JS Map.

import type { SchemaIndex, TypeRef } from "./schema.ts";

// Native values are dynamic by nature (mirrors codec.ts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Native = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

function base64Encode(b: Uint8Array): string {
  // Portable base64 (Node + browser). Node's Buffer is fastest but we stay
  // dependency- and platform-neutral.
  let binary = "";
  for (const byte of b) binary += String.fromCharCode(byte);
  // btoa exists in browsers and Node 16+ globals.
  return btoa(binary);
}

function base64Decode(s: string): Uint8Array {
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function toJson(schema: SchemaIndex, t: TypeRef, value: Native): JsonValue {
  if (value === null || value === undefined) return null;
  switch (t.k) {
    case "scalar":
      switch (t.scalar) {
        case "int":
          return String(value); // i64 as string (precision)
        case "bytes":
          return base64Encode(value as Uint8Array);
        case "float": {
          const n = value as number;
          if (Number.isNaN(n)) return "NaN";
          if (n === Infinity) return "Infinity";
          if (n === -Infinity) return "-Infinity";
          return n; // finite float -> JSON number
        }
        default:
          return value; // str / bool passthrough
      }
    case "enum":
      return value; // member-name string
    case "list":
      return (value as Native[]).map((v) => toJson(schema, t.elem, v));
    case "map": {
      // JSON object: keys are strings (proto3 JSON convention).
      const obj: Record<string, JsonValue> = {};
      for (const [k, v] of value as Map<Native, Native>) obj[keyStr(k)] = toJson(schema, t.value, v);
      return obj;
    }
    case "msg": {
      const m = schema.message(t.name);
      const obj: Record<string, JsonValue> = {};
      for (const f of schema.wireFields(m)) obj[f.name] = toJson(schema, f.type, value[f.name]);
      return obj;
    }
  }
}

function keyStr(k: Native): string {
  if (k === true) return "true";
  if (k === false) return "false";
  return String(k);
}

function keyParse(kt: TypeRef, s: string): Native {
  if (kt.k === "scalar" && kt.scalar === "int") return BigInt(s);
  if (kt.k === "scalar" && kt.scalar === "bool") return s === "true";
  return s;
}

function fromJson(schema: SchemaIndex, t: TypeRef, jv: JsonValue): Native {
  if (jv === null || jv === undefined) return null;
  switch (t.k) {
    case "scalar":
      switch (t.scalar) {
        case "int":
          return BigInt(jv); // canonical JSON string (or exact integer) -> bigint
        case "bytes":
          return base64Decode(jv as string);
        case "float": {
          if (typeof jv === "string") {
            const m: Record<string, number> = { NaN: NaN, Infinity: Infinity, "-Infinity": -Infinity };
            return m[jv]!;
          }
          return jv as number;
        }
        default:
          return jv; // str / bool passthrough
      }
    case "enum":
      return jv; // member-name string
    case "list":
      return (jv as JsonValue[]).map((v) => fromJson(schema, t.elem, v));
    case "map": {
      const out = new Map<Native, Native>();
      for (const [k, v] of Object.entries(jv as Record<string, JsonValue>)) {
        out.set(keyParse(t.key, k), fromJson(schema, t.value, v));
      }
      return out;
    }
    case "msg": {
      const m = schema.message(t.name);
      const obj = (jv ?? {}) as Record<string, JsonValue>;
      const out: Native = {};
      for (const f of schema.wireFields(m)) out[f.name] = fromJson(schema, f.type, obj[f.name]);
      return out;
    }
  }
}

// --- native value <-> JSON-safe value ---------------------------------------

/** Native value -> JSON-safe value (object / array / string / bool / null). */
export function toJsonValue(schema: SchemaIndex, message: string, value: Native): JsonValue {
  return toJson(schema, { k: "msg", name: message }, value);
}

/** JSON-safe value -> native value. */
export function fromJsonValue(schema: SchemaIndex, message: string, jv: JsonValue): Native {
  return fromJson(schema, { k: "msg", name: message }, jv);
}
