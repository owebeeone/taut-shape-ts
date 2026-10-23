import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CrdtNode } from '../src/crdt/engine.ts';
import { checkpointText, restoreText, encodeTextInsert, encodeTextDelete, projectText } from '../src/crdt/text.ts';
import type { CrdtOp } from '../src/taut/gen/shape_crdt.ts';

// Reproducible schedules, no sleeps or external services. Set CRDT_FUZZ_SEEDS
// for extended runs; a failing seed can be replayed with CRDT_FUZZ_START.
function random(seed: number) {
  let state = seed | 0;
  return (limit: number) => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) % limit;
  };
}
const start = Number(process.env.CRDT_FUZZ_START ?? 1);
const count = Number(process.env.CRDT_FUZZ_SEEDS ?? 40);
for (let seed = start; seed < start + count; seed++) {
  test(`CRDT randomized delivery seed ${seed}`, () => {
    const pick = random(seed);
    const operations: CrdtOp[] = [];
    const counters = [0, 0, 0];
    const atoms: string[] = [];
    for (let i = 0; i < 70; i++) {
      const actor = pick(3), origin = `writer${actor}`, seq = ++counters[actor]!;
      const deps = counters.flatMap((n, j) => j !== actor && n && pick(3) === 0 ? [{ origin: `writer${j}`, seq: BigInt(n) }] : []);
      const id = `${origin}:${seq}`;
      const payload = atoms.length && pick(4) === 0
        ? encodeTextDelete(atoms[pick(atoms.length)]!)
        : encodeTextInsert(id, atoms.length && pick(3) ? atoms[pick(atoms.length)]! : null, ['x', '🙂', '\n'][pick(3)]!);
      if (new TextDecoder().decode(payload).includes('"insert"')) { atoms.push(id); }
      operations.push({ origin, seq: BigInt(seq), deps: { entries: deps }, payload });
    }
    const replicas = [new CrdtNode(), new CrdtNode()];
    for (let replicaIndex = 0; replicaIndex < replicas.length; replicaIndex++) {
      let replica = replicas[replicaIndex]!;
      const queue = operations.map((_, i) => i);
      const delivered: number[] = [];
      while (queue.length) {
        const batch = 1 + pick(9);
        for (let i = 0; i < batch && queue.length; i++) {
          const [index] = queue.splice(pick(queue.length), 1);
          delivered.push(index!);
          replica.handle({ type: 'apply', op: operations[index!]! });
          if (pick(4) === 0) { replica.handle({ type: 'apply', op: operations[index!]! }); }
        }
        const fresh = new CrdtNode();
        for (const index of delivered) { fresh.handle({ type: 'apply', op: operations[index]! }); }
        assert.deepEqual(projectText(replica), projectText(fresh), `seed=${seed}; delivered=${JSON.stringify(delivered)}`);
        assert.deepEqual(replica.clock, fresh.clock);
        if (pick(4) === 0) {
          const text = checkpointText(replica);
          replica = CrdtNode.restore(structuredClone(replica.checkpoint()));
          restoreText(replica, structuredClone(text));
          replicas[replicaIndex] = replica;
          assert.equal(replica.work.textDecodes, 0);
          assert.deepEqual(projectText(replica), projectText(fresh));
        }
      }
    }
    assert.deepEqual(projectText(replicas[0]!), projectText(replicas[1]!));
    assert.deepEqual(replicas[0]!.clock, replicas[1]!.clock);
  });
}
