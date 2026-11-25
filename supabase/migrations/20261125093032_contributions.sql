-- Apply in the Supabase SQL Editor before deploying the Edge Function.
create table if not exists public.wedding_contributions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 20),
  message text not null default '' check (char_length(message) <= 300),
  photo_path text unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint wedding_content_required check (message <> '' or photo_path is not null)
);

alter table public.wedding_contributions enable row level security;
revoke all on public.wedding_contributions from anon, authenticated;
grant select, insert, update, delete on public.wedding_contributions to service_role;

create table if not exists public.wedding_guest_passes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  remaining integer not null default 3 check (remaining between 0 and 3)
);

alter table public.wedding_guest_passes enable row level security;
revoke all on public.wedding_guest_passes from anon, authenticated;
grant select, update on public.wedding_guest_passes to service_role;

create or replace function public.submit_wedding_contribution(
  p_code_hash text, p_name text, p_message text, p_photo_path text
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  consumed boolean;
begin
  update public.wedding_guest_passes set remaining = remaining - 1
  where code_hash = p_code_hash and remaining > 0
  returning true into consumed;
  if not coalesce(consumed, false) then return false; end if;
  insert into public.wedding_contributions (name, message, photo_path)
  values (p_name, p_message, p_photo_path);
  return true;
end;
$$;

revoke all on function public.submit_wedding_contribution(text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_wedding_contribution(text, text, text, text) to service_role;

create or replace function public.enforce_wedding_pending_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'pending' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'pending' then return new; end if;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(20261125, 1);
  if (select count(*) from public.wedding_contributions where status = 'pending') >= 100 then
    raise exception 'pending contribution limit reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists wedding_pending_limit on public.wedding_contributions;
create trigger wedding_pending_limit
before insert or update of status on public.wedding_contributions
for each row execute function public.enforce_wedding_pending_limit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-pending', 'wedding-pending', false, 5242880, array['image/jpeg'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- No Storage policies: only the Edge Function's service role can upload or sign approved photos.
