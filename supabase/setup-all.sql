-- AI 빌더 그룹 관리자 DB 설치 (0001+0002+0003 을 주석만 빼고 합친 것)
-- 설명이 붙은 원본은 supabase/migrations/ 에 있습니다.
create extension if not exists "pgcrypto";

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ begin
  create type public.content_status as enum ('draft','pending','published','rejected','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.builder_role as enum ('admin','builder');
exception when duplicate_object then null; end $$;

create table if not exists public.builders (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  slug          text unique not null,
  name          text not null,
  email         text unique not null,
  role          public.builder_role not null default 'builder',
  one_liner     text,
  role_label    text,
  avatar_url    text,
  is_active     boolean not null default true,

  must_change_password boolean not null default false,

  created_at    timestamptz not null default now()
);

comment on table public.builders is
  '빌더·관리자 계정. 역할 승격(builder→admin)은 화면에서 불가하며 이 테이블을 직접 수정해야 한다 (PRD §2.2).';
comment on column public.builders.email is
  '⚠ 공개 페이지 쿼리에서 이 컬럼을 select 하지 않는다 (DR-03).';

create index if not exists builders_auth_user_id_idx on public.builders(auth_user_id);

create table if not exists public.categories (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null,
  name  text not null,
  type  text not null check (type in ('work','insight')),
  sort  integer not null default 0,
  unique (type, slug)
);

create table if not exists public.works (
  id             uuid primary key default gen_random_uuid(),

  slug           text,

  title          text,
  summary        text,
  category_id    uuid references public.categories(id) on delete set null,

  hero_url       text,
  thumb_url      text,

  body_problem   text,
  body_solution  text,
  body_result    text,

  tech_tags      text[] not null default '{}',
  period_label   text,
  scope_label    text,
  result_url     text,

  status         public.content_status not null default 'draft',
  published_at   timestamptz,
  created_by     uuid references public.builders(id) on delete set null,
  reject_reason  text,

  seo_title      text,
  seo_description text,
  og_image_url   text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint works_publishable_fields check (
    status = 'draft' or (
      slug is not null and title is not null and hero_url is not null
      and body_problem is not null and body_solution is not null and body_result is not null
    )
  ),
  constraint works_reject_reason_required check (
    status <> 'rejected' or (reject_reason is not null and length(btrim(reject_reason)) >= 10)
  )
);

create unique index if not exists works_slug_key on public.works(slug) where slug is not null;
create index if not exists works_status_idx      on public.works(status);
create index if not exists works_created_by_idx  on public.works(created_by);

drop trigger if exists works_touch on public.works;
create trigger works_touch before update on public.works
  for each row execute function public.touch_updated_at();

create table if not exists public.insights (
  id             uuid primary key default gen_random_uuid(),
  slug           text,
  title          text,
  excerpt        text,

  body_html      text,

  thumb_url      text,
  category_id    uuid references public.categories(id) on delete set null,
  author_id      uuid references public.builders(id) on delete set null,

  status         public.content_status not null default 'draft',
  published_at   timestamptz,
  reject_reason  text,

  seo_title      text,
  seo_description text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint insights_publishable_fields check (
    status = 'draft' or (
      slug is not null and title is not null
      and excerpt is not null and body_html is not null
    )
  ),
  constraint insights_reject_reason_required check (
    status <> 'rejected' or (reject_reason is not null and length(btrim(reject_reason)) >= 10)
  )
);

create unique index if not exists insights_slug_key on public.insights(slug) where slug is not null;
create index if not exists insights_status_idx    on public.insights(status);
create index if not exists insights_author_id_idx on public.insights(author_id);

drop trigger if exists insights_touch on public.insights;
create trigger insights_touch before update on public.insights
  for each row execute function public.touch_updated_at();

create table if not exists public.work_builders (
  work_id     uuid not null references public.works(id)    on delete cascade,
  builder_id  uuid not null references public.builders(id) on delete cascade,
  role_label  text,
  sort        integer not null default 0,
  primary key (work_id, builder_id)
);

comment on table public.work_builders is
  'sort 가 공개 P-03 사이드 노출 순서다. 계정 회수(is_active=false) 시에도 이 연결은 끊지 않는다 (PRD D4).';

create index if not exists work_builders_builder_idx on public.work_builders(builder_id);

create table if not exists public.redirects (
  from_path   text primary key,
  to_path     text not null,
  created_at  timestamptz not null default now()
);

create or replace function public.current_builder_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.builders
   where auth_user_id = auth.uid() and is_active
   limit 1
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.builders
     where auth_user_id = auth.uid() and is_active and role = 'admin'
  )
$$;

create or replace function public.owns_work(w_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.works w
     where w.id = w_id and w.created_by = public.current_builder_id()
  ) or exists (
    select 1 from public.work_builders wb
     where wb.work_id = w_id and wb.builder_id = public.current_builder_id()
  )
$$;

alter table public.builders      enable row level security;
alter table public.categories    enable row level security;
alter table public.works         enable row level security;
alter table public.insights      enable row level security;
alter table public.work_builders enable row level security;
alter table public.redirects     enable row level security;

drop policy if exists categories_read  on public.categories;
drop policy if exists categories_write on public.categories;
create policy categories_read  on public.categories for select using (true);
create policy categories_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists builders_read        on public.builders;
drop policy if exists builders_update_self on public.builders;
drop policy if exists builders_admin_all   on public.builders;
create policy builders_read on public.builders for select using (true);
create policy builders_update_self on public.builders for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy builders_admin_all on public.builders for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists works_read_published on public.works;
drop policy if exists works_read_own       on public.works;
drop policy if exists works_write_own      on public.works;
drop policy if exists works_insert_own     on public.works;
drop policy if exists works_admin_all      on public.works;

create policy works_read_published on public.works for select
  using (status = 'published');
create policy works_read_own on public.works for select
  using (public.owns_work(id));
create policy works_write_own on public.works for update
  using (public.owns_work(id))
  with check (public.owns_work(id) and status in ('draft','pending'));
create policy works_insert_own on public.works for insert
  with check (created_by = public.current_builder_id() and status = 'draft');
create policy works_admin_all on public.works for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists insights_read_published on public.insights;
drop policy if exists insights_read_own       on public.insights;
drop policy if exists insights_write_own      on public.insights;
drop policy if exists insights_insert_own     on public.insights;
drop policy if exists insights_admin_all      on public.insights;

create policy insights_read_published on public.insights for select
  using (status = 'published');
create policy insights_read_own on public.insights for select
  using (author_id = public.current_builder_id());
create policy insights_write_own on public.insights for update
  using (author_id = public.current_builder_id())
  with check (author_id = public.current_builder_id() and status in ('draft','pending'));
create policy insights_insert_own on public.insights for insert
  with check (author_id = public.current_builder_id() and status = 'draft');
create policy insights_admin_all on public.insights for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists work_builders_read      on public.work_builders;
drop policy if exists work_builders_write_own on public.work_builders;
drop policy if exists work_builders_admin_all on public.work_builders;

create policy work_builders_read on public.work_builders for select using (true);
create policy work_builders_write_own on public.work_builders for all
  using (public.owns_work(work_id)) with check (public.owns_work(work_id));
create policy work_builders_admin_all on public.work_builders for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists redirects_read  on public.redirects;
drop policy if exists redirects_write on public.redirects;
create policy redirects_read  on public.redirects for select using (true);
create policy redirects_write on public.redirects for all
  using (public.is_admin()) with check (public.is_admin());

insert into public.categories (slug, name, type, sort) values
  ('methodology', '방법론',   'insight', 1),
  ('ai-ax',       'AI · AX',  'insight', 2),
  ('growth',      '그로스',   'insight', 3),
  ('dev',         '개발',     'insight', 4),
  ('commerce',    'Commerce', 'work',    1),
  ('aiax',        'AI · AX',  'work',    2),
  ('platform',    'Platform', 'work',    3),
  ('finance',     'Finance',  'work',    4)
on conflict (type, slug) do nothing;

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),

  pluug_form_url            text,

  ga4_measurement_id        text,

  google_site_verification  text,

  naver_site_verification   text,

  channel_plugin_key        text,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.builders(id) on delete set null
);

comment on table public.site_settings is
  '클라이언트가 관리자 화면에서 직접 교체하는 외부 연동 값 (260812 2차 미팅). 항상 1행.';
comment on column public.site_settings.google_site_verification is
  'meta 태그 전체가 아니라 content 속성 값만 넣는다. 예: "abc123..." (<meta ...> 통째로 넣으면 태그가 이중으로 나간다)';

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists site_settings_read  on public.site_settings;
drop policy if exists site_settings_write on public.site_settings;

create policy site_settings_read on public.site_settings for select using (true);

create policy site_settings_write on public.site_settings for update
  using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  3145728,                                              -- 3MB (A-05 히어로 기준)
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_read   on storage.objects;
drop policy if exists media_insert on storage.objects;
drop policy if exists media_update on storage.objects;
drop policy if exists media_delete on storage.objects;

create policy media_read on storage.objects
  for select using (bucket_id = 'media');

create policy media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.current_builder_id() is not null);

create policy media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.current_builder_id() is not null);

create policy media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
