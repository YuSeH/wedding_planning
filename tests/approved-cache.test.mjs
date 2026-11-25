import assert from 'node:assert/strict';
import test from 'node:test';
import { createTimedCache } from '../supabase/functions/_shared/approved-cache.mjs';

test('reuses approved entries for 60 seconds and coalesces simultaneous loads', async () => {
  let time = 0;
  let loads = 0;
  const cached = createTimedCache(60_000, () => time);
  const load = async () => { loads++; return { entries: [{ id: 'approved' }] }; };
  const [first, second] = await Promise.all([cached(load), cached(load)]);
  assert.deepEqual(first, second);
  assert.equal(loads, 1);
  time = 59_999;
  await cached(load);
  assert.equal(loads, 1);
  time = 60_000;
  await cached(load);
  assert.equal(loads, 2);
});

test('does not cache failed loads', async () => {
  const cached = createTimedCache(60_000);
  await assert.rejects(cached(async () => { throw new Error('database offline'); }), /database offline/);
  assert.deepEqual(await cached(async () => ({ entries: [] })), { entries: [] });
});
