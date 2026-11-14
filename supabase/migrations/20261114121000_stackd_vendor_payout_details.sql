-- APPLY ONLY to Stackd project lryeshzwwhcdtzemeyzk.
-- Only the owning vendor can read or write their payout row.
-- Anon, hosts, and guests have no access. CLABE, IBAN, and routing are checked in the database.

create or replace function public.stackd_clabe_ok(raw text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  weights int[] := array[3, 7, 1];
  total int := 0;
  i int;
  digit int;
begin
  if raw is null then
    return true;
  end if;
  if raw !~ '^[0-9]{18}$' then
    return false;
  end if;
  for i in 1..17 loop
    digit := substring(raw from i for 1)::int;
    total := total + ((digit * weights[((i - 1) % 3) + 1]) % 10);
  end loop;
  return substring(raw from 18 for 1)::int = ((10 - (total % 10)) % 10);
end;
$$;

create or replace function public.stackd_routing_ok(raw text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  d1 int; d2 int; d3 int; d4 int; d5 int; d6 int; d7 int; d8 int; d9 int;
  total int;
begin
  if raw is null then
    return true;
  end if;
  if raw !~ '^[0-9]{9}$' then
    return false;
  end if;
  d1 := substring(raw from 1 for 1)::int;
  d2 := substring(raw from 2 for 1)::int;
  d3 := substring(raw from 3 for 1)::int;
  d4 := substring(raw from 4 for 1)::int;
  d5 := substring(raw from 5 for 1)::int;
  d6 := substring(raw from 6 for 1)::int;
  d7 := substring(raw from 7 for 1)::int;
  d8 := substring(raw from 8 for 1)::int;
  d9 := substring(raw from 9 for 1)::int;
  total := 3 * (d1 + d4 + d7) + 7 * (d2 + d5 + d8) + (d3 + d6 + d9);
  return total <> 0 and total % 10 = 0;
end;
$$;

create or replace function public.stackd_iban_ok(raw text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  iban text := upper(regexp_replace(coalesce(raw, ''), '\s', '', 'g'));
  rearranged text;
  expanded text := '';
  i int;
  ch text;
  remainder int := 0;
begin
  if raw is null then
    return true;
  end if;
  if iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$' or char_length(iban) > 34 then
    return false;
  end if;
  rearranged := substring(iban from 5) || substring(iban from 1 for 4);
  for i in 1..char_length(rearranged) loop
    ch := substring(rearranged from i for 1);
    if ch ~ '[A-Z]' then
      expanded := expanded || (ascii(ch) - 55)::text;
    else
      expanded := expanded || ch;
    end if;
  end loop;
  for i in 1..char_length(expanded) loop
    remainder := (remainder * 10 + substring(expanded from i for 1)::int) % 97;
  end loop;
  return remainder = 1;
end;
$$;

create table if not exists public.vendor_payout_details (
  vendor_username text primary key,
  payout_method text not null check (payout_method in (
    'bank_transfer_mx_clabe',
    'bank_transfer_us_ach',
    'bank_transfer_iban',
    'other'
  )),
  account_holder_name text,
  country text,
  currency text,
  bank_name text,
  clabe text,
  routing_number text,
  account_number text,
  iban text,
  swift text,
  payout_email text,
  updated_at timestamptz not null default now(),
  constraint vendor_payout_clabe_format check (clabe is null or clabe ~ '^[0-9]{18}$'),
  constraint vendor_payout_clabe_checksum check (public.stackd_clabe_ok(clabe)),
  constraint vendor_payout_routing_checksum check (routing_number is null or public.stackd_routing_ok(routing_number)),
  constraint vendor_payout_iban_checksum check (iban is null or public.stackd_iban_ok(iban)),
  constraint vendor_payout_method_fields check (
    (
      payout_method = 'bank_transfer_mx_clabe'
      and clabe is not null
      and routing_number is null
      and account_number is null
      and iban is null
    )
    or (
      payout_method = 'bank_transfer_us_ach'
      and routing_number is not null
      and account_number ~ '^[0-9]{4,17}$'
      and clabe is null
      and iban is null
    )
    or (
      payout_method = 'bank_transfer_iban'
      and iban is not null
      and clabe is null
      and routing_number is null
      and account_number is null
    )
    or (
      payout_method = 'other'
      and clabe is null
      and routing_number is null
      and account_number is null
      and iban is null
    )
  )
);

create or replace function public.stackd_payout_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists vendor_payout_details_updated_at on public.vendor_payout_details;
create trigger vendor_payout_details_updated_at
  before update on public.vendor_payout_details
  for each row execute function public.stackd_payout_touch_updated_at();

alter table public.vendor_payout_details enable row level security;

revoke all on public.vendor_payout_details from public, anon, authenticated;
grant select, insert, update on public.vendor_payout_details to authenticated;

drop policy if exists vendor_payout_details_select on public.vendor_payout_details;
create policy vendor_payout_details_select
  on public.vendor_payout_details
  for select
  to authenticated
  using (vendor_username = public.stackd_vendor_username());

drop policy if exists vendor_payout_details_insert on public.vendor_payout_details;
create policy vendor_payout_details_insert
  on public.vendor_payout_details
  for insert
  to authenticated
  with check (vendor_username = public.stackd_vendor_username());

drop policy if exists vendor_payout_details_update on public.vendor_payout_details;
create policy vendor_payout_details_update
  on public.vendor_payout_details
  for update
  to authenticated
  using (vendor_username = public.stackd_vendor_username())
  with check (vendor_username = public.stackd_vendor_username());
