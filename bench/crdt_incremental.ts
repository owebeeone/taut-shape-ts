/** Local evidence, not a timing assertion: node --experimental-strip-types bench/crdt_incremental.ts */
import { performance } from 'node:perf_hooks';
import { serialize } from 'node:v8';
import { CrdtNode } from '../src/crdt/engine.ts';
import { checkpointText, restoreText, encodeTextInsert, projectText } from '../src/crdt/text.ts';

for (const history of [100, 2000, 10000]) {
  const operation = (n: number) => ({ origin: 'writer', seq: BigInt(n), deps: { entries: [] },
    payload: encodeTextInsert(String(n), n === 1 ? null : String(n - 1), 'x') });
  const node = new CrdtNode();
  for (let n = 1; n <= history; n++) { node.handle({ type: 'apply', op: operation(n) }); }
  projectText(node);
  const before = node.work, heap = process.memoryUsage().heapUsed, start = performance.now();
  for (let n = history + 1; n <= history + 100; n++) { node.handle({ type: 'apply', op: operation(n) }); }
  projectText(node);
  const incrementalMs = performance.now() - start;
  const heapDeltaBytes = process.memoryUsage().heapUsed - heap;
  const rebuildStart = performance.now(), fresh = new CrdtNode();
  for (let n = 1; n <= history + 100; n++) { fresh.handle({ type: 'apply', op: operation(n) }); }
  projectText(fresh);
  const rebuildMs = performance.now() - rebuildStart;
  const saved = { engine: node.checkpoint(), text: checkpointText(node) };
  const checkpointBytes = serialize(saved).byteLength, restoreStart = performance.now();
  const restored = CrdtNode.restore(saved.engine);
  restoreText(restored, saved.text);
  projectText(restored);
  console.log(JSON.stringify({ history, newOperations: 100, incrementalMs, rebuildMs,
    restoreMs: performance.now() - restoreStart, checkpointBytes, heapDeltaBytes,
    pendingVisits: node.work.pendingVisits - before.pendingVisits,
    textDecodes: node.work.textDecodes - before.textDecodes, restoredWork: restored.work }));
}
