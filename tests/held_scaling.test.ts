import { test } from "node:test";
import assert from "node:assert/strict";

import { LogNode } from "../src/log/node.ts";

test("one push releases a large held set once in creation order", () => {
  const node = new LogNode();
  const heldCount = 1024;

  for (let i = 0; i < heldCount; i += 1) {
    assert.deepEqual(
      node.handle({ type: "read", streamId: `s-${i}`, cursor: { seq: 0 } }),
      [],
    );
  }

  const out = node.handle({ type: "push", payload: new Uint8Array([0x61]) });
  assert.equal(out.length, heldCount);
  for (let i = 0; i < heldCount; i += 1) {
    const response = out[i]!;
    assert.equal(response.type, "read_response");
    if (response.type === "read_response") {
      assert.equal(response.streamId, `s-${i}`);
      assert.equal(response.state, "data");
      assert.deepEqual(response.nextCursor, { seq: 1 });
    }
  }

  // The batch clear removed every parked read; a later push emits nothing.
  assert.deepEqual(node.handle({ type: "push", payload: new Uint8Array([0x62]) }), []);
});
