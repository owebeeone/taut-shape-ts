import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FrameDecoder,
  UnknownMessageTagError,
} from "../src/framing.ts";
import { LogAdapter } from "../src/log/adapter.ts";
import {
  type EngineAdapter,
  type EngineEffect,
  EngineRuntime,
  UnsupportedShapeError,
  requireEngineShape,
} from "../src/runtime.ts";

class TextAdapter implements EngineAdapter<string, number, boolean, string> {
  readonly shape = "text-test";

  decodeInput(frame: string): number {
    return frame.length;
  }

  dispatch(input: number): readonly boolean[] {
    return [input % 2 === 0];
  }

  encodeOutput(output: boolean): EngineEffect<string> {
    return { frame: output ? "even" : "odd" };
  }

  finish(): readonly boolean[] {
    return [];
  }
}

test("engine runtime contract is shape-neutral", () => {
  const emissions = new EngineRuntime(new TextAdapter()).process("abcd");
  assert.deepEqual(emissions, [{ output: true, effect: { frame: "even" } }]);
});

test("unknown shape is a typed diagnostic", () => {
  let error: unknown;
  try {
    requireEngineShape("window");
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof UnsupportedShapeError);
  assert.equal(error.code, "TAUT_SHAPE_UNSUPPORTED_SHAPE");
  assert.equal(error.shape, "window");
});

test("unknown message tag is a typed diagnostic", () => {
  const decoder = new FrameDecoder();
  let error: unknown;
  try {
    decoder.push(Uint8Array.of(1, 0, 0, 0, 99));
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof UnknownMessageTagError);
  assert.equal(error.code, "TAUT_SHAPE_UNKNOWN_TAG");
  assert.equal(error.tag, 99);
});

test("log adapter exposes timer and teardown actions without changing frames", () => {
  const runtime = new EngineRuntime(new LogAdapter({ stopWhen: "last_reader" }));
  const held = runtime.dispatch({
    type: "read",
    streamId: "s1",
    cursor: { seq: 0 },
    timeoutMs: 25,
  });
  assert.deepEqual(held[0]?.effect.timer, { kind: "set", token: 1, delayMs: 25 });
  assert.equal(held[0]?.effect.frame.type, "set_timer");

  const closed = runtime.dispatch({ type: "close" });
  assert.equal(closed.some((emission) => emission.effect.teardown !== undefined), true);
});
