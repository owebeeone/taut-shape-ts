import { test } from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import * as foundation from "../foundation/cjs/foundation.js";
import * as legacy from "../src/taut/cbor.ts";
import {LogCursorDescriptor} from "../src/taut/gen/shape_log.ts";
import {ValueStampDescriptor} from "../src/taut/gen/shape_value.ts";

test("library generated interfaces and codec facades share the actual foundation",()=> {
  assert.ok(LogCursorDescriptor instanceof foundation.MessageDescriptor);
  assert.ok(ValueStampDescriptor instanceof foundation.MessageDescriptor);
  assert.equal(legacy.DecodeError,foundation.DecodeError);
  assert.equal(legacy.CborFloat,foundation.CborFloat);
  assert.equal(LogCursorDescriptor.owner,foundation.Foundation);
  assert.ok(Object.isFrozen(LogCursorDescriptor.fields));
});
test("foundation-only CJS and ESM package subpaths share actual state",async()=> {
  const require=createRequire(import.meta.url);
  const cjs=require("@owebeeone/taut-shape/foundation");
  const esm=await import("@owebeeone/taut-shape/foundation");
  cjs.requireFoundation(cjs);
  cjs.requireFoundation(esm);
  for(const key of ["Foundation","MessageDescriptor","ValidationIssue","ValidationReport","DecodeError","CborFloat"] as const)
    assert.equal(cjs[key],esm[key]);
});

test("bigint values retain their wire type through the library foundation",()=> {
  assert.equal(legacy.CborBigInt,foundation.CborBigInt);
  for(const n of [0n,-1n,5n,-5n,1n<<8192n,-(1n<<8192n)]) {
    const bytes=foundation.encode(new foundation.CborBigInt(n));
    const value=foundation.decode(bytes);
    assert.ok(value instanceof foundation.CborBigInt);
    assert.equal(value.value,n);
    assert.deepEqual(foundation.encode(value),bytes);
  }
  assert.throws(()=>foundation.decode(Uint8Array.of(0xc2,0x41,0)),
    (error:unknown)=>error instanceof foundation.DecodeError && error.tag==="NonCanonicalBigInt");
});
