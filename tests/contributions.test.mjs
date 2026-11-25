import assert from 'node:assert/strict';
import test from 'node:test';
import { detectImageType, hasPendingCapacity, normalizeGuestCode, photoRefreshDelay, stripJpegMetadata, validChallenge, validateContribution } from '../supabase/functions/_shared/contributions.mjs';

test('requires a display name and either a message or a photo', () => {
  assert.match(validateContribution({ name: ' ', message: '축하해요' }).error, /이름/);
  assert.match(validateContribution({ name: '하객', message: ' ' }).error, /글 또는 사진/);
  assert.equal(validateContribution({ name: ' 하객 ', message: ' 축하해요 ' }).name, '하객');
  assert.equal(validateContribution({ name: '하객', message: '', photo: { type: 'image/jpeg', size: 1024 } }).error, '');
});

test('rejects oversized text and unsupported or oversized photos', () => {
  assert.match(validateContribution({ name: '가'.repeat(21), message: '축하' }).error, /20자/);
  assert.match(validateContribution({ name: '하객', message: '가'.repeat(301) }).error, /300자/);
  assert.match(validateContribution({ name: '하객', message: '', photo: { type: 'image/svg+xml', size: 10 } }).error, /JPG/);
  assert.match(validateContribution({ name: '하객', message: '', photo: { type: 'image/png', size: 5 * 1024 * 1024 + 1 } }).error, /5MB/);
});

test('checks image signatures, not just MIME claims', () => {
  assert.equal(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(detectImageType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  assert.equal(detectImageType(new TextEncoder().encode('RIFF0000WEBP')), 'image/webp');
  assert.equal(detectImageType(new TextEncoder().encode('<svg></svg>')), '');
});

test('strips JPEG metadata segments and trailing bytes before storage', () => {
  const jpeg = new Uint8Array([
    255, 216, 255, 225, 0, 10, 69, 120, 105, 102, 0, 0, 1, 2,
    255, 254, 0, 6, 71, 80, 83, 33,
    255, 219, 0, 4, 17, 34,
    255, 218, 0, 4, 1, 2, 17, 255, 0, 34, 255, 217, 99,
  ]);
  assert.deepEqual([...stripJpegMetadata(jpeg)], [
    255, 216, 255, 219, 0, 4, 17, 34,
    255, 218, 0, 4, 1, 2, 17, 255, 0, 34, 255, 217,
  ]);
});

test('rejects malformed JPEG and metadata after the scan', () => {
  assert.throws(() => stripJpegMetadata(new Uint8Array([255, 216, 255, 225, 0, 20])), /사진 형식/);
  assert.throws(() => stripJpegMetadata(new Uint8Array([255, 216, 255, 218, 0, 2, 255, 225, 255, 217])), /사진 형식/);
});

test('pending capacity has a fixed global limit independent of request headers', () => {
  assert.equal(hasPendingCapacity(99), true);
  assert.equal(hasPendingCapacity(100), false);
  assert.equal(hasPendingCapacity(null), false);
});

test('normalizes a guest code and rejects malformed codes', () => {
  assert.equal(normalizeGuestCode(' ABCDEF0123456789 '), 'abcdef0123456789');
  assert.equal(normalizeGuestCode('short'), '');
  assert.equal(normalizeGuestCode('abcdef012345678g'), '');
});

test('refreshes signed photo links before they expire', () => {
  assert.equal(photoRefreshDelay(600), 480000);
});

test('CAPTCHA reply must match the allowed page and submission action', () => {
  const valid = { success: true, hostname: 'yuseh.github.io', action: 'wedding-contribution' };
  assert.equal(validChallenge(valid, 'https://yuseh.github.io'), true);
  assert.equal(validChallenge({ ...valid, success: false }, 'https://yuseh.github.io'), false);
  assert.equal(validChallenge({ ...valid, hostname: 'another.example' }, 'https://yuseh.github.io'), false);
  assert.equal(validChallenge({ ...valid, action: 'other' }, 'https://yuseh.github.io'), false);
});
