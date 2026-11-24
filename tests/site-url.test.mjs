import test from 'node:test';
import assert from 'node:assert/strict';
import { siteUrl } from '../src/lib/site-url.mjs';

test('explicit domain takes priority and trailing slash is removed', () => {
  assert.equal(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://invite.example.com/' }), 'https://invite.example.com');
});

test('GitHub Pages project URL keeps its repository path for share metadata', () => {
  assert.equal(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://user.github.io/wedding-invitation-starter/' }), 'https://user.github.io/wedding-invitation-starter');
});

test('Vercel deployment gets a usable preview URL without buying a domain', () => {
  assert.equal(siteUrl({ VERCEL_URL: 'demo-abc.vercel.app' }), 'https://demo-abc.vercel.app');
});

test('local preview uses localhost', () => {
  assert.equal(siteUrl({}), 'http://localhost:3000');
});
