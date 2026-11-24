import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../out/', import.meta.url);
const site = process.env.TEST_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.github.io/wedding-invitation-starter';
const path = new URL(site).pathname.replace(/\/$/, '');

test('static export contains the invitation and assets under the Pages repo path', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /결혼식에 초대합니다/);
  assert.ok(html.includes(`${path}/_next/`), 'Next assets should use repository base path');
  const imageUrl = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert.equal(imageUrl, `${site}/og.png`);
  const image = await readFile(new URL('og.png', root));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok((await stat(new URL('og.png', root))).size > 1000);
});
