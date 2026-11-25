import assert from 'node:assert/strict';
import test from 'node:test';
import { classifySubmission, removeUnsubmittedPhoto, resolveUncertainPhoto } from '../supabase/functions/_shared/submission-outcome.mjs';

test('only a confirmed rejection permits temporary-photo removal', () => {
  assert.equal(classifySubmission(true, null), 'accepted');
  assert.equal(classifySubmission(false, null), 'invalid-pass');
  assert.equal(classifySubmission(null, { code: 'P0001' }), 'capacity');
  assert.equal(classifySubmission(null, { code: 'PGRST301' }), 'uncertain');
  assert.equal(classifySubmission(true, { code: 'PGRST301' }), 'uncertain');
  assert.equal(classifySubmission(null, null), 'uncertain');
});

test('retries deletion of a confirmed orphan and reports persistent failure', async () => {
  let attempts = 0;
  const removed = await removeUnsubmittedPhoto(async () => {
    attempts++;
    return { error: attempts === 1 ? new Error('transient') : null };
  }, 'pending/test.jpg', () => assert.fail('cleanup should succeed'));
  assert.equal(removed, true);
  assert.equal(attempts, 2);
  const warnings = [];
  const failed = await removeUnsubmittedPhoto(async () => { throw new Error('offline'); }, 'pending/test.jpg', path => warnings.push(path));
  assert.equal(failed, false);
  assert.deepEqual(warnings, ['pending/test.jpg']);
});

test('an uncertain RPC keeps the photo unless a committed row is confirmed', async () => {
  const warnings = [];
  assert.equal(await resolveUncertainPhoto(async () => true, 'pending/test.jpg', path => warnings.push(path)), true);
  assert.deepEqual(warnings, []);
  assert.equal(await resolveUncertainPhoto(async () => false, 'pending/test.jpg', path => warnings.push(path)), false);
  assert.deepEqual(warnings, ['pending/test.jpg']);
  assert.equal(await resolveUncertainPhoto(async () => { throw new Error('offline'); }, 'pending/other.jpg', path => warnings.push(path)), false);
  assert.deepEqual(warnings, ['pending/test.jpg', 'pending/other.jpg']);
});
