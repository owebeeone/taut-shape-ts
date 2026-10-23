import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CrdtNode } from '../src/crdt/engine.ts';
import { encodeTextInsert, encodeTextDelete, projectText } from '../src/crdt/text.ts';

function op(seq: number, origin = 'a') {
  return { origin, seq: BigInt(seq), deps: { entries: [] },
    payload: encodeTextInsert(`${origin}${seq}`, seq === 1 ? null : `${origin}${seq - 1}`, 'x') };
}

test('incremental small tail does not revisit integrated history; duplicate does no work', () => {
  for (const size of [20, 2000]) {
    const node = new CrdtNode();
    for (let n = 1; n <= size; n++) { node.handle({ type: 'apply', op: op(n) }); }
    projectText(node);
    const before = node.work;
    node.handle({ type: 'apply', op: op(size + 1) });
    assert.equal(projectText(node).text.length, size + 1);
    assert.ok(node.work.pendingVisits - before.pendingVisits <= 2);
    assert.equal(node.work.textDecodes - before.textDecodes, 1);
    const after = node.work;
    const view = projectText(node);
    node.handle({ type: 'apply', op: op(size + 1) });
    assert.equal(projectText(node), view);
    assert.deepEqual(node.work, after);
  }
});

test('incremental projection agrees with fresh reconstruction at every delivery boundary', () => {
  const operations = [op(1), op(2), op(1, 'b'), op(2, 'b'),
    { ...op(3), payload: encodeTextDelete('b1') },
    { ...op(2), payload: encodeTextInsert('a2', 'a1', 'changed') }];
  for (const order of [[0, 1, 2, 3, 4, 5, 5], [4, 3, 5, 2, 1, 0, 0]]) {
    const node = new CrdtNode();
    const delivered = [];
    for (const index of order) {
      const operation = operations[index]!;
      delivered.push(operation);
      node.handle({ type: 'apply', op: operation });
      const fresh = new CrdtNode();
      for (const old of delivered) { fresh.handle({ type: 'apply', op: old }); }
      assert.deepEqual(projectText(node), projectText(fresh));
      assert.deepEqual(node.clock, fresh.clock);
      assert.deepEqual(node.operations, fresh.operations);
    }
  }
});

test('cursor reads return only missing tail and explicit bootstrap for obsolete cursor', () => {
  const node = new CrdtNode();
  for (let n = 1; n <= 100; n++) { node.handle({ type: 'apply', op: op(n) }); }
  const cursor = node.clock;
  node.handle({ type: 'apply', op: op(101) });
  const [result] = node.handle({ type: 'read', crdt_id: 'doc', stream_id: 'reader', cursor });
  assert.equal(result?.type, 'read_response');
  assert.equal(node.work.readVisits, 1);
  if (result?.type === 'read_response') {
    assert.deepEqual(result.ops.map(o => o.seq), [101n]);
    assert.equal(result.state, 'data');
  }
  const restored = new CrdtNode();
  restored.handle({ type: 'install_bootstrap', bootstrap: { clock: cursor,
    state: new TextEncoder().encode(JSON.stringify({ atoms: [{ atom_id: 'a100', after: null, text: 'x', deleted: false }] })) } });
  restored.handle({ type: 'apply', op: op(101) });
  const [recovery] = restored.handle({ type: 'read', crdt_id: 'doc', stream_id: 'reader', cursor: { entries: [] } });
  assert.equal(recovery?.type === 'read_response' && recovery.state, 'bootstrap_required');
  assert.equal(projectText(restored).text, 'xx');
});

test('fresh read skips compacted sequence space below the bootstrap floor', () => {
  const node = new CrdtNode();
  node.handle({ type: 'install_bootstrap', bootstrap: {
    clock: { entries: [{ origin: 'a', seq: 100000n }] }, state: new Uint8Array(),
  } });
  node.handle({ type: 'apply', op: op(100001) });
  const [result] = node.handle({ type: 'read', crdt_id: 'doc', stream_id: 'reader', cursor: null });
  assert.equal(result?.type === 'read_response' && result.ops.length, 1);
  assert.equal(node.work.readVisits, 1);
});

test('checkpoint restores pending delivery, identities and projection without replay', () => {
  const node = new CrdtNode();
  node.handle({ type: 'apply', op: op(1) });
  node.handle({ type: 'apply', op: op(3) });
  projectText(node);
  const restored = CrdtNode.restore(structuredClone(node.checkpoint()));
  assert.equal(restored.work.pendingVisits, 0);
  assert.deepEqual(projectText(restored), projectText(node));
  for (const engine of [node, restored]) { engine.handle({ type: 'apply', op: op(2) }); }
  assert.deepEqual(projectText(restored), projectText(node));
  assert.deepEqual(restored.clock, node.clock);
  assert.throws(() => CrdtNode.restore({ version: 999 } as never));
});

test('long text chain projects without recursive stack growth', () => {
  const node = new CrdtNode();
  for (let n = 1; n <= 12000; n++) { node.handle({ type: 'apply', op: op(n) }); }
  assert.equal(projectText(node).text.length, 12000);
});
