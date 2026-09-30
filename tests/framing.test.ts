// The data channel's frame reader (framing.ts): the u32-LE length is read unsigned
// and capped at MAX_FRAME_BYTES before the body is read, and only a DecodeError from
// the body's decode is a malformed frame (TautCheckedDecode.md CD-V3).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FrameDecoder,
  FrameError,
  LOG_FRAME_CODEC,
  MAX_FRAME_BYTES,
  MessageFrameCodec,
  SCHEMA,
} from "../src/framing.ts";

/** A frame's four length bytes, u32-LE. */
function lengthPrefix(len: number): Uint8Array {
  const prefix = new Uint8Array(4);
  new DataView(prefix.buffer).setUint32(0, len, true);
  return prefix;
}

/** A whole `push` frame whose length is `len`: tag byte 0, then LogPush's CBOR, a map
 *  of one entry, key 1, holding a byte string of `len - 8` zero bytes, whose length
 *  takes a 4-byte argument (a1 01 5a <u32-BE>). */
function pushFrame(len: number): Uint8Array {
  const payloadLength = len - 8;
  const frame = new Uint8Array(4 + len);
  const view = new DataView(frame.buffer);
  view.setUint32(0, len, true);
  frame.set([0x00, 0xa1, 0x01, 0x5a], 4);
  view.setUint32(8, payloadLength, false);
  return frame;
}

/** Whether `error` is the FrameError refusing a length of `len` as read unsigned. A
 *  signed read names a length of 2^31 or more as the negative `len - 2 ** 32`. */
function refusesLength(len: number): (error: unknown) => boolean {
  return (error) => error instanceof FrameError && error.message.includes(`frame length ${len} `);
}

/** One whole frame with the given tag byte and body. */
function frameOf(tag: number, body: Uint8Array): Uint8Array {
  const frame = new Uint8Array(5 + body.length);
  frame.set(lengthPrefix(1 + body.length), 0);
  frame[4] = tag;
  frame.set(body, 5);
  return frame;
}

test("MAX_FRAME_BYTES is 16 MiB", () => {
  assert.equal(MAX_FRAME_BYTES, 16 * 1024 * 1024);
});

test("a frame length at MAX_FRAME_BYTES is accepted and its frame decodes", () => {
  const frame = pushFrame(MAX_FRAME_BYTES);
  const decoder = new FrameDecoder();
  // The length alone is not refused: the decoder waits for the rest of the frame.
  assert.deepEqual(decoder.push(frame.subarray(0, 4)), []);
  assert.equal(decoder.pending, 4);
  const frames = decoder.push(frame.subarray(4));
  assert.equal(frames.length, 1);
  assert.equal(frames[0]!.type, "push");
  assert.equal((frames[0]!.native.payload as Uint8Array).length, MAX_FRAME_BYTES - 8);
  assert.equal(decoder.pending, 0);
});

test("a frame length one above MAX_FRAME_BYTES is refused from its four length bytes", () => {
  assert.throws(
    () => new FrameDecoder().push(lengthPrefix(MAX_FRAME_BYTES + 1)),
    refusesLength(MAX_FRAME_BYTES + 1),
  );
});

test("a frame length of 2^31 or more is read unsigned and refused", () => {
  for (const len of [2 ** 31, 2 ** 32 - 1]) {
    assert.throws(() => new FrameDecoder().push(lengthPrefix(len)), refusesLength(len), `length ${len}`);
  }
});

test("a frame length of zero, with no room for the tag byte, is refused", () => {
  assert.throws(() => new FrameDecoder().push(lengthPrefix(0)), FrameError);
});

test("a body the codec refuses is a FrameError naming the DecodeError", () => {
  // 0xff is additional info 31 of major 7: UnsupportedInfo.
  assert.throws(
    () => new FrameDecoder().push(frameOf(0, Uint8Array.of(0xff))),
    (error: unknown) => error instanceof FrameError && error.message.includes("UnsupportedInfo"),
  );
});

test("a body nested past the depth bound is a FrameError, not a stack overflow", () => {
  const body = new Uint8Array(100_000).fill(0x81); // 100,000 nested one-item arrays
  assert.throws(
    () => new FrameDecoder().push(frameOf(0, body)),
    (error: unknown) => error instanceof FrameError && error.message.includes("TooDeep"),
  );
});

test("a throw other than DecodeError propagates rather than becoming a FrameError", () => {
  // A registry naming a message the schema lacks is a bug in this package, not a
  // malformed frame: the schema's own Error must reach the caller.
  const broken = new MessageFrameCodec(SCHEMA, "LogMsgType", { push: "NoSuchMessage" });
  assert.throws(
    () => new FrameDecoder(broken).push(frameOf(0, Uint8Array.of(0xa0))),
    (error: unknown) =>
      error instanceof Error && !(error instanceof FrameError) && /NoSuchMessage/.test(error.message),
  );
});

test("a well-formed frame still decodes through the log codec", () => {
  const { tag, body } = LOG_FRAME_CODEC.encode("push", { payload: Uint8Array.of(1, 2, 3) });
  const frames = new FrameDecoder().push(frameOf(tag, body));
  assert.equal(frames.length, 1);
  assert.equal(frames[0]!.type, "push");
  assert.deepEqual(frames[0]!.native.payload, Uint8Array.of(1, 2, 3));
});
