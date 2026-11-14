-- APPLY ONLY to Stackd project lryeshzwwhcdtzemeyzk.
-- Public read. Writes require the Stackd auth user id (auth.uid()) as host_id.
-- This does not read or write the other project's profiles or host_vendor_links.

create table if not exists public.host_pages (
  host_id uuid primary key,
  slug text not null unique,
  display_name text not null,
  bio text,
  photo_url text,
  created_at timestamptz not null default now(),
  constraint host_pages_slug_shape check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  constraint host_pages_name_len check (char_length(display_name) between 1 and 80),
  constraint host_pages_bio_len check (bio is null or char_length(bio) <= 500),
  constraint host_pages_photo_https check (photo_url is null or photo_url ~ '^https://')
);

create table if not exists public.host_page_items (
  host_id uuid not null references public.host_pages (host_id) on delete cascade,
  item_type text not null check (item_type in ('experience', 'restaurant')),
  item_ref text not null,
  vendor_username text,
  position int not null check (position >= 0),
  created_at timestamptz not null default now(),
  primary key (host_id, item_type, item_ref)
);

create index if not exists host_page_items_order_idx
  on public.host_page_items (host_id, position);

alter table public.host_pages enable row level security;
alter table public.host_page_items enable row level security;

revoke all on public.host_pages from public, anon, authenticated;
revoke all on public.host_page_items from public, anon, authenticated;
grant select on public.host_pages to anon, authenticated;
grant select on public.host_page_items to anon, authenticated;
grant insert, update, delete on public.host_pages to authenticated;
grant insert, update, delete on public.host_page_items to authenticated;

drop policy if exists host_pages_public_read on public.host_pages;
create policy host_pages_public_read
  on public.host_pages
  for select
  to anon, authenticated
  using (true);

drop policy if exists host_pages_owner_insert on public.host_pages;
create policy host_pages_owner_insert
  on public.host_pages
  for insert
  to authenticated
  with check (host_id = auth.uid());

drop policy if exists host_pages_owner_update on public.host_pages;
create policy host_pages_owner_update
  on public.host_pages
  for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists host_pages_owner_delete on public.host_pages;
create policy host_pages_owner_delete
  on public.host_pages
  for delete
  to authenticated
  using (host_id = auth.uid());

drop policy if exists host_page_items_public_read on public.host_page_items;
create policy host_page_items_public_read
  on public.host_page_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists host_page_items_owner_insert on public.host_page_items;
create policy host_page_items_owner_insert
  on public.host_page_items
  for insert
  to authenticated
  with check (
    host_id = auth.uid()
    and exists (select 1 from public.host_pages page where page.host_id = auth.uid())
  );

drop policy if exists host_page_items_owner_update on public.host_page_items;
create policy host_page_items_owner_update
  on public.host_page_items
  for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists host_page_items_owner_delete on public.host_page_items;
create policy host_page_items_owner_delete
  on public.host_page_items
  for delete
  to authenticated
  using (host_id = auth.uid());
