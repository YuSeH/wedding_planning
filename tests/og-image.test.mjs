import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('social sharing preview serves a real PNG image', async () => {
  const response = await fetch(`${base}/og.png`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /^image\/png/);
  const image = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...image.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});
