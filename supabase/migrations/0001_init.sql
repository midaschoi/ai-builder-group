-- ═══════════════════════════════════════════════════════════════════════════
--  AI 빌더 그룹 — 관리자 플랫폼 초기 스키마
--
--  근거: PRD §7 데이터 요구사항 (DR-01 ~ DR-08) · §7.2 테이블 스펙 · §7.3 상태 머신
--  적용: Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행
--
--  ⛔ leads · inquiries · contacts 등 리드성 테이블을 만들지 않는다 (DR-01).
--     문의는 pluug 가 받는다. 우리 DB 에는 콘텐츠만 저장한다.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
--  1. 공통
-- ───────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 콘텐츠 상태 (PRD §7.3)
do $$ begin
  create type public.content_status as enum ('draft','pending','published','rejected','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.builder_role as enum ('admin','builder');
exception when duplicate_object then null; end $$;


-- ───────────────────────────────────────────────────────────────────────────
--  2. builders — 계정 = 인증 주체 + 공개 프로필 원천
-- ───────────────────────────────────────────────────────────────────────────

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

  -- A-01 §계정 발급 직후 최초 로그인 — 임시 비밀번호로 발급한 계정의 강제 변경 플래그
  must_change_password boolean not null default false,

  created_at    timestamptz not null default now()
);

comment on table public.builders is
  '빌더·관리자 계정. 역할 승격(builder→admin)은 화면에서 불가하며 이 테이블을 직접 수정해야 한다 (PRD §2.2).';
comment on column public.builders.email is
  '⚠ 공개 페이지 쿼리에서 이 컬럼을 select 하지 않는다 (DR-03).';

create index if not exists builders_auth_user_id_idx on public.builders(auth_user_id);


-- ───────────────────────────────────────────────────────────────────────────
--  3. categories
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.categories (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null,
  name  text not null,
  type  text not null check (type in ('work','insight')),
  sort  integer not null default 0,
  unique (type, slug)
);


-- ───────────────────────────────────────────────────────────────────────────
--  4. works — 3막 본문을 컬럼으로 분리한다 (DR §7.2)
--     자유 에디터로 두면 프로젝트마다 구성이 달라져 P-03 렌더 구조가 어긋난다.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.works (
  id             uuid primary key default gen_random_uuid(),

  -- ⚠ slug 는 nullable 이다. 초안은 슬러그 없이 저장할 수 있어야 한다 (A-05 §필수 항목).
  --   "제출·발행 시 필수"는 아래 CHECK 제약이 강제한다.
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

  -- 초안이 아닌 상태에서는 슬러그·제목·3막·히어로가 반드시 있어야 한다
  constraint works_publishable_fields check (
    status = 'draft' or (
      slug is not null and title is not null and hero_url is not null
      and body_problem is not null and body_solution is not null and body_result is not null
    )
  ),
  -- 반려에는 사유가 반드시 있다 (FR-A07-04)
  constraint works_reject_reason_required check (
    status <> 'rejected' or (reject_reason is not null and length(btrim(reject_reason)) >= 10)
  )
);

-- 슬러그는 비어 있을 수 있으나, 채워졌다면 유일하다
create unique index if not exists works_slug_key on public.works(slug) where slug is not null;
create index if not exists works_status_idx      on public.works(status);
create index if not exists works_created_by_idx  on public.works(created_by);

drop trigger if exists works_touch on public.works;
create trigger works_touch before update on public.works
  for each row execute function public.touch_updated_at();


-- ───────────────────────────────────────────────────────────────────────────
--  5. insights
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.insights (
  id             uuid primary key default gen_random_uuid(),
  slug           text,
  title          text,
  excerpt        text,

  -- ⚠ 반드시 서버에서 sanitize 한 뒤 저장한다 (FR-A03-03).
  --   공개 페이지가 dangerouslySetInnerHTML 로 그리므로 저장 시점이 유일한 방어선이다.
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


-- ───────────────────────────────────────────────────────────────────────────
--  6. work_builders — 참여 빌더 (다대다)
-- ───────────────────────────────────────────────────────────────────────────

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


-- ───────────────────────────────────────────────────────────────────────────
--  7. redirects — 슬러그 변경·보관 시 301 (FR-A03-05 · DR-08)
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.redirects (
  from_path   text primary key,
  to_path     text not null,
  created_at  timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════════
--  8. 권한 헬퍼
--
--  security definer 로 두는 이유: builders 테이블의 RLS 정책 안에서 builders 를
--  다시 조회하면 정책이 재귀한다. definer 함수로 감싸 한 겹 끊는다.
-- ═══════════════════════════════════════════════════════════════════════════

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

-- 내가 관여한 Work 인가 — 작성자이거나 참여 빌더로 연결된 것 (A-04 §빌더 판정 기준)
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


-- ═══════════════════════════════════════════════════════════════════════════
--  9. RLS — 전 테이블 활성화 (DR-04)
--
--  ⚠ 이 프로젝트는 브라우저에서 Supabase 를 직접 호출하지 않는다 (DR-02).
--     서버 컴포넌트·서버 액션이 anon 키 + 사용자 세션으로 접근하므로
--     아래 정책이 실제 방어선으로 동작한다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.builders      enable row level security;
alter table public.categories    enable row level security;
alter table public.works         enable row level security;
alter table public.insights      enable row level security;
alter table public.work_builders enable row level security;
alter table public.redirects     enable row level security;

-- ── categories : 누구나 읽기, 쓰기는 관리자만 ──────────────────────────────
drop policy if exists categories_read  on public.categories;
drop policy if exists categories_write on public.categories;
create policy categories_read  on public.categories for select using (true);
create policy categories_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ── builders ───────────────────────────────────────────────────────────────
--  공개 페이지가 작성자·참여 빌더 이름을 그려야 하므로 select 는 열어 둔다.
--  ⚠ 공개 쿼리에서는 email · auth_user_id 를 select 하지 않는다 (DR-03).
drop policy if exists builders_read        on public.builders;
drop policy if exists builders_update_self on public.builders;
drop policy if exists builders_admin_all   on public.builders;
create policy builders_read on public.builders for select using (true);
-- 본인 프로필만 수정 (FR-A06-05). 역할·활성 상태는 서버 액션에서 별도로 막는다.
create policy builders_update_self on public.builders for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy builders_admin_all on public.builders for all
  using (public.is_admin()) with check (public.is_admin());

-- ── works ──────────────────────────────────────────────────────────────────
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
  -- 빌더는 published 로 직행할 수 없다 (DR-06). 관리자는 아래 admin_all 정책이 통과시킨다.
  with check (public.owns_work(id) and status in ('draft','pending'));
create policy works_insert_own on public.works for insert
  with check (created_by = public.current_builder_id() and status = 'draft');
create policy works_admin_all on public.works for all
  using (public.is_admin()) with check (public.is_admin());

-- ── insights ───────────────────────────────────────────────────────────────
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

-- ── work_builders ──────────────────────────────────────────────────────────
drop policy if exists work_builders_read      on public.work_builders;
drop policy if exists work_builders_write_own on public.work_builders;
drop policy if exists work_builders_admin_all on public.work_builders;

create policy work_builders_read on public.work_builders for select using (true);
create policy work_builders_write_own on public.work_builders for all
  using (public.owns_work(work_id)) with check (public.owns_work(work_id));
create policy work_builders_admin_all on public.work_builders for all
  using (public.is_admin()) with check (public.is_admin());

-- ── redirects : 누구나 읽기(공개 라우팅이 참조), 쓰기는 관리자만 ───────────
drop policy if exists redirects_read  on public.redirects;
drop policy if exists redirects_write on public.redirects;
create policy redirects_read  on public.redirects for select using (true);
create policy redirects_write on public.redirects for all
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
--  10. 시드 — 카테고리
--      Insight 4종은 기획서 Q-C(제안안대로), Work 는 현재 공개 웹의 필터 칩과 맞춘다.
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
--  11. 최초 관리자 만들기 — 수동 절차
--
--  자체 회원가입을 제공하지 않으므로(FR-A01-02) 첫 계정은 손으로 만든다.
--
--   ① Supabase 대시보드 > Authentication > Users > "Add user"
--      이메일·비밀번호를 넣고 "Auto Confirm User" 를 켠 채 생성한다.
--   ② 생성된 사용자의 UID 를 복사해 아래를 실행한다.
--
--  insert into public.builders (auth_user_id, slug, name, email, role, role_label)
--  values ('여기에-복사한-UID', 'josh', '조쉬', 'josh@example.com', 'admin', '프로덕트 빌더');
--
--  이후 빌더 계정은 A-06 화면에서 발급한다.
-- ═══════════════════════════════════════════════════════════════════════════
