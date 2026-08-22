import { FrameError, type Frame } from "../framing.ts";
import type { EngineAdapter, EngineEffect } from "../runtime.ts";
import { requireEngineShape } from "../runtime.ts";
import { CrdtNode, type CrdtInput, type CrdtNodeOptions, type CrdtOutput } from "./engine.ts";
const INPUTS = new Set(["apply", "install_bootstrap", "seal", "close", "read"]);
export class CrdtAdapter implements EngineAdapter<Frame, CrdtInput, CrdtOutput, Frame> {
  readonly shape = requireEngineShape("crdt");
  private readonly node: CrdtNode;
  constructor(options: CrdtNodeOptions = {}) { this.node = new CrdtNode(options); }
  decodeInput(frame: Frame): CrdtInput { if (!INPUTS.has(frame.type)) throw new FrameError(`output-only tag ${frame.type} on the CRDT input channel`); return { type: frame.type, ...(frame.native as object) } as CrdtInput; }
  dispatch(input: CrdtInput): readonly CrdtOutput[] { return this.node.handle(input); }
  encodeOutput(output: CrdtOutput): EngineEffect<Frame> { const { type, ...native } = output; return { frame: { type, native } }; }
  finish(): readonly CrdtOutput[] { return []; }
}
