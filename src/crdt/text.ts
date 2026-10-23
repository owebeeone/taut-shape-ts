import { CrdtNode } from "./engine.ts";

export interface TextProjection { readonly text: string; readonly diagnostics: readonly string[]; }
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
function canonical(value: unknown): Uint8Array {
  const record = value as Record<string, unknown>;
  const ordered = Object.fromEntries(Object.keys(record).sort().map((key) => [key, record[key]]));
  return encoder.encode(JSON.stringify(ordered));
}
export function encodeTextInsert(atom_id: string, after: string | null, text: string): Uint8Array { return canonical({ kind: "insert", atom_id, after, text }); }
export function encodeTextDelete(atom_id: string): Uint8Array { return canonical({ kind: "delete", atom_id }); }

type Atom = { after: string | null; text: string; key: readonly [string, bigint] };
function atomCompare(left: Atom, right: Atom): number {
  const after = (left.after ?? "").localeCompare(right.after ?? "");
  if (after !== 0) { return after; }
  const text = left.text.localeCompare(right.text);
  if (text !== 0) { return text; }
  const origin = left.key[0].localeCompare(right.key[0]);
  return origin !== 0 ? origin : left.key[1] < right.key[1] ? -1 : left.key[1] > right.key[1] ? 1 : 0;
}

interface ProjectionCache {
  revision: number;
  atoms: Map<string, Atom>;
  deleted: Set<string>;
  diagnostics: Set<string>;
  value: TextProjection;
}
const projections = new WeakMap<CrdtNode, ProjectionCache>();

export function projectText(node: CrdtNode): TextProjection {
  let cache = projections.get(node);
  if (cache?.revision === node.revision) { return cache.value; }
  const delta = node.changesSince(cache?.revision ?? -1);
  const reset = !cache || delta.reset;
  if (reset) {
    cache = { revision: -1, atoms: new Map(), deleted: new Set(), diagnostics: new Set(), value: { text: "", diagnostics: [] } };
  }
  const { atoms, deleted, diagnostics: persistentDiagnostics } = cache!;
  const bootstrap = reset ? node.bootstrap : null;
  if (bootstrap !== null) {
    try {
      const parsed = JSON.parse(decoder.decode(bootstrap.state)) as { atoms: unknown };
      if (!Array.isArray(parsed.atoms)) { throw new Error(); }
      for (const raw of parsed.atoms) {
        const row = raw as Record<string, unknown>;
        if (typeof row.atom_id !== "string" || row.atom_id.length === 0 || (row.after !== null && typeof row.after !== "string") || typeof row.text !== "string" || row.text.length === 0 || typeof row.deleted !== "boolean") { throw new Error(); }
        atoms.set(row.atom_id, { after: row.after as string | null, text: row.text, key: ["", 0n] });
        if (row.deleted) { deleted.add(row.atom_id); }
      }
    } catch { persistentDiagnostics.add("invalid_bootstrap"); }
  }
  for (const op of delta.operations) {
    node.recordTextDecode();
    try {
      const payload = JSON.parse(decoder.decode(op.payload)) as Record<string, unknown>;
      const atomId = payload.atom_id;
      if (typeof atomId !== "string" || atomId.length === 0) { throw new Error(); }
      if (payload.kind === "delete" && Object.keys(payload).sort().join() === "atom_id,kind") { deleted.add(atomId); }
      else if (payload.kind === "insert" && Object.keys(payload).sort().join() === "after,atom_id,kind,text") {
        if ((payload.after !== null && typeof payload.after !== "string") || typeof payload.text !== "string" || payload.text.length === 0) { throw new Error(); }
        const candidate: Atom = { after: payload.after as string | null, text: payload.text, key: [op.origin, op.seq] };
        const prior = atoms.get(atomId);
        if (prior !== undefined && (prior.after !== candidate.after || prior.text !== candidate.text || prior.key[0] !== candidate.key[0] || prior.key[1] !== candidate.key[1])) {
          persistentDiagnostics.add(`atom_equivocation:${atomId}`);
          if (atomCompare(candidate, prior) < 0) { atoms.set(atomId, candidate); }
        } else { atoms.set(atomId, candidate); }
      } else { throw new Error(); }
    } catch { persistentDiagnostics.add(`invalid_payload:${op.origin}:${op.seq}`); }
  }
  const diagnostics = new Set(persistentDiagnostics);
  const children = new Map<string | null, string[]>();
  for (const [atomId, atom] of atoms) {
    if (atom.after !== null && !atoms.has(atom.after)) { diagnostics.add(`missing_parent:${atomId}:${atom.after}`); continue; }
    const list = children.get(atom.after) ?? []; list.push(atomId); children.set(atom.after, list);
  }
  for (const list of children.values()) { list.sort(); }
  const visiting = new Set<string>(), visited = new Set<string>(), output: string[] = [];
  const visit = (root: string): void => {
    const stack: Array<readonly [string, boolean]> = [[root, false]];
    while (stack.length) {
      const [atomId, leaving] = stack.pop()!;
      if (leaving) { visiting.delete(atomId); visited.add(atomId); continue; }
      if (visiting.has(atomId)) { diagnostics.add(`cycle:${atomId}`); continue; }
      if (visited.has(atomId)) { continue; }
      visiting.add(atomId);
      if (!deleted.has(atomId)) { output.push(atoms.get(atomId)!.text); }
      stack.push([atomId, true]);
      const nested = children.get(atomId) ?? [];
      for (let i = nested.length - 1; i >= 0; i--) { stack.push([nested[i]!, false]); }
    }
  };
  for (const root of children.get(null) ?? []) { visit(root); }
  for (const atomId of [...atoms.keys()].filter((id) => !visited.has(id)).sort()) { if (atoms.has(atoms.get(atomId)!.after!)) { visit(atomId); } }
  cache!.revision = node.revision;
  cache!.value = { text: output.join(""), diagnostics: [...diagnostics].sort() };
  projections.set(node, cache!);
  return cache!.value;
}

/** Local projection checkpoint. Restore only alongside its matching engine. */
export interface TextCheckpoint {
  readonly version: 1;
  readonly atoms: readonly (readonly [string, Atom])[];
  readonly deleted: readonly string[];
  readonly diagnostics: readonly string[];
  readonly value: TextProjection;
}
export function checkpointText(node: CrdtNode): TextCheckpoint {
  projectText(node);
  const cache = projections.get(node)!;
  return structuredClone({ version: 1, atoms: [...cache.atoms], deleted: [...cache.deleted],
    diagnostics: [...cache.diagnostics], value: cache.value });
}
export function restoreText(node: CrdtNode, saved: TextCheckpoint): void {
  if (saved.version !== 1 || typeof saved.value.text !== "string") { throw new Error("invalid text checkpoint"); }
  const copy = structuredClone(saved);
  projections.set(node, { revision: node.revision, atoms: new Map(copy.atoms), deleted: new Set(copy.deleted),
    diagnostics: new Set(copy.diagnostics), value: copy.value });
}
