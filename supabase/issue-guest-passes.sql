-- Run only in the Supabase SQL Editor after applying the migration.
-- Save the returned codes privately and give a DIFFERENT code to each invited guest.
-- Never commit or share the results in a public chat. Each code allows three submissions.
with codes as materialized (
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 16) as code
  from generate_series(1, 100)
), saved as (
  insert into public.wedding_guest_passes (code_hash)
  select encode(sha256(convert_to(code, 'UTF8')), 'hex') from codes
  returning code_hash
)
select codes.code from codes
join saved on saved.code_hash = encode(sha256(convert_to(codes.code, 'UTF8')), 'hex');
