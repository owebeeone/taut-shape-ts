import { loadSchema } from "../taut/schema.ts";
import irJson from "../taut/gen/shape_crdt.ir.json" with { type: "json" };
import { MessageFrameCodec, type Frame } from "../framing.ts";
import { fromJsonValue, toJsonValue } from "../taut/jsoncodec.ts";
import type { CrdtWireMessage } from "./oracle.ts";
export const CRDT_SCHEMA = loadSchema(irJson);
export const CRDT_TYPE_TO_MESSAGE: Readonly<Record<string, string>> = { apply: "CrdtApply", install_bootstrap: "CrdtInstallBootstrap", seal: "CrdtSeal", close: "CrdtClose", read: "CrdtReadRequest", read_response: "CrdtReadResponse", diagnostic: "CrdtDiagnostic" };
export const CRDT_FRAME_CODEC = new MessageFrameCodec(CRDT_SCHEMA, "CrdtMsgType", CRDT_TYPE_TO_MESSAGE);
export function crdtFrameFromJson(message: CrdtWireMessage): Frame { const name = CRDT_TYPE_TO_MESSAGE[message.type]; if (name === undefined) throw new Error(`unknown CRDT message ${message.type}`); const { type, ...fields } = message; return { type, native: fromJsonValue(CRDT_SCHEMA, name, fields) }; }
export function crdtFrameToJson(frame: Frame): CrdtWireMessage { const name = CRDT_TYPE_TO_MESSAGE[frame.type]; if (name === undefined) throw new Error(`unknown CRDT frame ${frame.type}`); return { type: frame.type, ...toJsonValue(CRDT_SCHEMA, name, frame.native) }; }
