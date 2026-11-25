import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('mobile invitation has sample content and share metadata at the public URL', async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /결혼식에 초대합니다/);
  assert.match(html, /예식 안내/);
  assert.match(html, /오시는 길/);
  assert.match(html, /og:image/);
  assert.match(html, /캘린더에 저장/);
  assert.match(html, /방명록과 사진/);
});
