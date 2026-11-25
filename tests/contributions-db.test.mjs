import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const migration = await readFile(new URL('../supabase/migrations/20261125093032_contributions.sql', import.meta.url), 'utf8');

async function withDatabase(run) {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema storage;
      create table storage.buckets (
        id text primary key, name text, public boolean,
        file_size_limit bigint, allowed_mime_types text[]
      );
      create table storage.objects (
        bucket_id text not null, name text not null,
        created_at timestamptz not null default now()
      );
    `);
    await db.exec(migration);
    await run(db);
  } finally {
    await db.close();
  }
}

test('failed contribution insert does not spend a guest pass', async () => {
  await withDatabase(async db => {
    const hash = 'a'.repeat(64);
    await db.query('insert into public.wedding_guest_passes (code_hash) values ($1)', [hash]);
    await db.exec('set role service_role');
    const accepted = await db.query('select public.submit_wedding_contribution($1,$2,$3,$4) as ok', [hash, '하객', '축하해요', null]);
    assert.equal(accepted.rows[0].ok, true);
    await assert.rejects(
      db.query('select public.submit_wedding_contribution($1,$2,$3,$4) as ok', [hash, '하객', '', null]),
      { code: '23514' },
    );
    const remaining = await db.query('select remaining from public.wedding_guest_passes where code_hash = $1', [hash]);
    assert.equal(remaining.rows[0].remaining, 2);
    const entries = await db.query('select count(*)::int as total from public.wedding_contributions');
    assert.equal(entries.rows[0].total, 1);
  });
});

test('pending-cap rejection rolls back the guest pass use', async () => {
  await withDatabase(async db => {
    const hash = 'b'.repeat(64);
    await db.query('insert into public.wedding_guest_passes (code_hash) values ($1)', [hash]);
    await db.exec('set role service_role');
    for (let index = 0; index < 100; index++) {
      await db.query('insert into public.wedding_contributions (name,message) values ($1,$2)', ['하객', '축하해요']);
    }
    await assert.rejects(
      db.query('select public.submit_wedding_contribution($1,$2,$3,$4) as ok', [hash, '하객', '축하해요', null]),
      { code: 'P0001' },
    );
    const remaining = await db.query('select remaining from public.wedding_guest_passes where code_hash = $1', [hash]);
    assert.equal(remaining.rows[0].remaining, 3);
  });
});

test('anonymous visitors cannot call the submission function directly', async () => {
  await withDatabase(async db => {
    await db.exec('set role anon');
    await assert.rejects(
      db.query('select public.submit_wedding_contribution($1,$2,$3,$4)', ['a'.repeat(64), '하객', '축하해요', null]),
      { code: '42501' },
    );
  });
});

test('orphan review lists only old private photos without contribution rows', async () => {
  await withDatabase(async db => {
    await db.query('insert into public.wedding_contributions (name,message,photo_path) values ($1,$2,$3)', ['하객', '', 'pending/linked.jpg']);
    await db.exec(`
      insert into storage.objects (bucket_id,name,created_at) values
      ('wedding-pending','pending/old-orphan.jpg',now() - interval '2 hours'),
      ('wedding-pending','pending/recent-orphan.jpg',now()),
      ('wedding-pending','pending/linked.jpg',now() - interval '2 hours');
    `);
    const sql = await readFile(new URL('../supabase/find-orphan-photos.sql', import.meta.url), 'utf8');
    const found = await db.query(sql);
    assert.deepEqual(found.rows.map(row => row.name), ['pending/old-orphan.jpg']);
  });
});
