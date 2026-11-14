-- APPLY ONLY to Stackd project lryeshzwwhcdtzemeyzk.
-- Do not apply this file to ilityngsjxknvxtqrgav.
-- Inserts go through the create-booking-request edge function (service role).
-- There is no anon SELECT. Vendors read and change status only for their own username.
-- The username is app_metadata.vendor_username, the same claim vendor-username-sign-in uses.
-- user_metadata.username is display only and is not trusted here.

create or replace function public.stackd_vendor_username()
returns text
language sql
stable
set search_path = public
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'vendor_username', '');
$$;

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_username text not null,
  experience_id text not null,
  experience_title text,
  requested_date date not null,
  time_slot text,
  guests int not null check (guests >= 1 and guests <= 50),
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  notes text check (notes is null or char_length(notes) <= 1000),
  price_snapshot jsonb,
  host_ref uuid,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists booking_requests_vendor_created_idx
  on public.booking_requests (vendor_username, created_at desc);

create or replace function public.stackd_booking_requests_vendor_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.vendor_username is distinct from old.vendor_username
     or new.experience_id is distinct from old.experience_id
     or new.experience_title is distinct from old.experience_title
     or new.requested_date is distinct from old.requested_date
     or new.time_slot is distinct from old.time_slot
     or new.guests is distinct from old.guests
     or new.guest_name is distinct from old.guest_name
     or new.guest_email is distinct from old.guest_email
     or new.guest_phone is distinct from old.guest_phone
     or new.notes is distinct from old.notes
     or new.price_snapshot is distinct from old.price_snapshot
     or new.host_ref is distinct from old.host_ref
     or new.created_at is distinct from old.created_at
  then
    raise exception 'vendors may only update status';
  end if;
  if old.status is distinct from 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'status can only move from pending to accepted or declined';
  end if;
  return new;
end;
$$;

drop trigger if exists booking_requests_vendor_update on public.booking_requests;
create trigger booking_requests_vendor_update
  before update on public.booking_requests
  for each row execute function public.stackd_booking_requests_vendor_update();

alter table public.booking_requests enable row level security;

revoke all on public.booking_requests from public, anon, authenticated;
grant select on public.booking_requests to authenticated;
grant update (status) on public.booking_requests to authenticated;

drop policy if exists booking_requests_vendor_select on public.booking_requests;
create policy booking_requests_vendor_select
  on public.booking_requests
  for select
  to authenticated
  using (vendor_username = public.stackd_vendor_username());

drop policy if exists booking_requests_vendor_update on public.booking_requests;
create policy booking_requests_vendor_update
  on public.booking_requests
  for update
  to authenticated
  using (vendor_username = public.stackd_vendor_username())
  with check (vendor_username = public.stackd_vendor_username());
