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
  for(const key of ["Foundation","MessageDescriptor","ValidationIssue","ValidationReport","DecodeError","CborFloat"] as const)
    assert.equal(cjs[key],esm[key]);
});
