/** Shape-neutral engine dispatch shell for the conformance CLI. */

export type TimerAction =
  | { readonly kind: "set"; readonly token: number | bigint; readonly delayMs: number | bigint }
  | { readonly kind: "cancel"; readonly token: number | bigint };

export interface TeardownAction {
  readonly reason: string;
}

export interface EngineEffect<FrameOut> {
  readonly frame: FrameOut;
  readonly timer?: TimerAction;
  readonly teardown?: TeardownAction;
}

export interface EngineEmission<Output, FrameOut> {
  readonly output: Output;
  readonly effect: EngineEffect<FrameOut>;
}

/** The shape owns every concrete type. The shell knows only call order. */
export interface EngineAdapter<FrameIn, Input, Output, FrameOut> {
  readonly shape: string;
  decodeInput(frame: FrameIn): Input;
  dispatch(input: Input): readonly Output[];
  encodeOutput(output: Output): EngineEffect<FrameOut>;
  finish(): readonly Output[];
}

export class EngineRuntime<FrameIn, Input, Output, FrameOut> {
  readonly adapter: EngineAdapter<FrameIn, Input, Output, FrameOut>;

  constructor(adapter: EngineAdapter<FrameIn, Input, Output, FrameOut>) {
    this.adapter = adapter;
  }

  process(frame: FrameIn): readonly EngineEmission<Output, FrameOut>[] {
    return this.dispatch(this.adapter.decodeInput(frame));
  }

  dispatch(input: Input): readonly EngineEmission<Output, FrameOut>[] {
    return this.adapter.dispatch(input).map((output) => ({
      output,
      effect: this.adapter.encodeOutput(output),
    }));
  }

  finish(): readonly EngineEmission<Output, FrameOut>[] {
    return this.adapter.finish().map((output) => ({
      output,
      effect: this.adapter.encodeOutput(output),
    }));
  }
}

export const SUPPORTED_ENGINE_SHAPES = [
  "atom",
  "crdt",
  "log",
  "snapshot_delta",
  "stream",
  "swmr",
  "text_crdt",
  "value",
] as const;
export type EngineShape = (typeof SUPPORTED_ENGINE_SHAPES)[number];

export class UnsupportedShapeError extends Error {
  readonly code = "TAUT_SHAPE_UNSUPPORTED_SHAPE";
  readonly shape: string;
  readonly supported: readonly EngineShape[];

  constructor(
    shape: string,
    supported: readonly EngineShape[] = SUPPORTED_ENGINE_SHAPES,
  ) {
    super(`unsupported engine shape ${JSON.stringify(shape)}; supported: ${supported.join(", ")}`);
    this.name = "UnsupportedShapeError";
    this.shape = shape;
    this.supported = supported;
  }
}

export function requireEngineShape(shape: string): EngineShape {
  const supported = SUPPORTED_ENGINE_SHAPES.find((candidate) => candidate === shape);
  if (supported !== undefined) return supported;
  throw new UnsupportedShapeError(shape);
}
