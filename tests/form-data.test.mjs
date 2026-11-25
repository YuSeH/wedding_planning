import assert from 'node:assert/strict';
import test from 'node:test';
import { readBoundedFormData } from '../supabase/functions/_shared/form-data.mjs';

test('parses a multipart request without Content-Length within the byte limit', async () => {
  const form = new FormData();
  form.set('name', 'guest');
  const request = new Request('https://example.test/contributions', { method: 'POST', body: form });
  assert.equal(request.headers.has('content-length'), false);
  const parsed = await readBoundedFormData(request, 1024);
  assert.equal(parsed.get('name'), 'guest');
});

test('rejects an oversized multipart body even without Content-Length', async () => {
  const form = new FormData();
  form.set('message', 'x'.repeat(1024));
  const request = new Request('https://example.test/contributions', { method: 'POST', body: form });
  assert.equal(request.headers.has('content-length'), false);
  await assert.rejects(readBoundedFormData(request, 256), RangeError);
});
