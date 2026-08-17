-- ═══════════════════════════════════════════════════════════════════════════
-- 0006 · 공개 웹에 남아 있던 하드코딩을 관리 대상으로 올린다
--
-- ⚠ 범위 변경이다. 기획서 §5.6 은 관리자 범위를 네 개(Insight·Work·빌더·승인)로
--   못박고 "넓히지 않는다" 라고 적어 두었다. FAQ·유튜브·홈 카피는 그 밖이다.
--   클라이언트/팀 승인 없이 기본값으로 삼지 않는다 — 백로그 §1.8 에 기록해 두었다.
--
-- 빌더만은 범위 안이다. A-06 이 이미 프로필을 편집하는데 공개 웹이 그 값을 읽지 않아
-- /builder?b=<슬러그> 가 엉뚱한 사람을 보여주고 있었다 (builder/view.tsx 의 `|| BUILDERS.josh`).
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. 빌더 프로필 (P-11 대비 · FR-A06-04) ─────────────────────────────────
-- 공개 프로필(/builder)이 쓰는 값. one_liner·role_label·avatar_url 은 0001 에 이미 있다.
alter table public.builders
  add column if not exists bio          text,        -- 긴 소개 (프로필 상단)
  add column if not exists focus        text,        -- "어드민 · 정산 · 권한 설계"
  add column if not exists stack        text[] not null default '{}',
  -- [{ "title": "데이터 모델이 먼저", "body": "화면보다 테이블을 먼저 그립니다." }, …]
  add column if not exists principles   jsonb  not null default '[]'::jsonb,
  add column if not exists badge        text,        -- "✳ 이달의 빌더" · "NEW" · 없으면 null
  add column if not exists link_label   text,        -- 프로필 하단 부가 링크
  add column if not exists link_url     text,
  add column if not exists sort         integer not null default 0;

-- 수행 건수(done)와 대표 프로젝트는 저장하지 않는다.
-- work_builders 를 세면 되고, 저장해 두면 프로젝트를 발행할 때마다 손으로 맞춰야 한다.


-- ── 2. FAQ (P-07 · IA §1 의 /faq/[topic]) ──────────────────────────────────
create table if not exists public.faq_topics (
  id      uuid primary key default gen_random_uuid(),
  slug    text unique not null,
  label   text not null,
  sort    integer not null default 0
);

create table if not exists public.faqs (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references public.faq_topics(id) on delete cascade,
  question      text not null,
  answer        text not null,
  -- 홈 프리뷰(S9)에 올릴 것만 표시한다. 전부 올리면 홈이 FAQ 페이지가 된다.
  show_on_home  boolean not null default false,
  is_active     boolean not null default true,
  sort          integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists faqs_touch on public.faqs;
create trigger faqs_touch before update on public.faqs
  for each row execute function public.touch_updated_at();

create index if not exists faqs_topic_idx on public.faqs(topic_id, sort);


-- ── 3. 유튜브 콘텐츠 (P-06 · IR-08 "1차는 링크·썸네일 수동 등록") ──────────
create table if not exists public.video_channels (
  id     uuid primary key default gen_random_uuid(),
  slug   text unique not null,
  name   text not null,
  url    text not null,
  sort   integer not null default 0
);

create table if not exists public.videos (
  id           uuid primary key default gen_random_uuid(),
  -- 썸네일은 저장하지 않는다. img.youtube.com/vi/<id>/hqdefault.jpg 로 만들 수 있다.
  youtube_id   text not null,
  title        text not null,
  subtitle     text,                 -- "조회 44만" · "브이로그" 같은 보조 문구
  channel_name text not null,
  duration     text,                 -- "11:11"
  is_active    boolean not null default true,
  sort         integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists videos_touch on public.videos;
create trigger videos_touch before update on public.videos
  for each row execute function public.touch_updated_at();


-- ── 4. 홈 카피 (site_settings 확장) ────────────────────────────────────────
-- 홈 전체를 편집 가능하게 만들면 CMS 를 짓는 일이 된다. 히어로와 지표만 연다.
alter table public.site_settings
  add column if not exists hero_title text,
  add column if not exists hero_sub   text,
  -- ⚠ "4.9/5 평균 만족도" 같은 값은 기획서 C2(근거 없는 수치 금지) 에 걸린다.
  --   비워 두면 화면에서 그 지표를 아예 빼도록 했다.
  add column if not exists stat_rating text;


-- ═══════════════════════════════════════════════════════════════════════════
--  RLS — 공개 읽기 / 관리자만 쓰기
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.faq_topics     enable row level security;
alter table public.faqs           enable row level security;
alter table public.video_channels enable row level security;
alter table public.videos         enable row level security;

drop policy if exists faq_topics_read      on public.faq_topics;
drop policy if exists faq_topics_admin     on public.faq_topics;
drop policy if exists faqs_read            on public.faqs;
drop policy if exists faqs_admin           on public.faqs;
drop policy if exists video_channels_read  on public.video_channels;
drop policy if exists video_channels_admin on public.video_channels;
drop policy if exists videos_read          on public.videos;
drop policy if exists videos_admin         on public.videos;

create policy faq_topics_read  on public.faq_topics for select using (true);
create policy faq_topics_admin on public.faq_topics for all
  using (public.is_admin()) with check (public.is_admin());

create policy faqs_read  on public.faqs for select using (true);
create policy faqs_admin on public.faqs for all
  using (public.is_admin()) with check (public.is_admin());

create policy video_channels_read  on public.video_channels for select using (true);
create policy video_channels_admin on public.video_channels for all
  using (public.is_admin()) with check (public.is_admin());

create policy videos_read  on public.videos for select using (true);
create policy videos_admin on public.videos for all
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
--  초기값 — 지금 화면에 나가 있는 것을 그대로 옮긴다
--  ⚠ 이 값들은 시연용이다. 실제 문구·영상으로 교체하는 것은 관리자 화면에서 한다.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.faq_topics (slug, label, sort) values
  ('inquiry', '외주 문의', 1),
  ('process', '진행 방식', 2)
on conflict (slug) do update set label = excluded.label, sort = excluded.sort;

insert into public.video_channels (slug, name, url, sort) values
  ('seo-jangwon',   'AI 서대표',        'https://www.youtube.com/@AISeoceo', 1),
  ('kim-iesop',     '김이솝의 AI 가이드', 'https://www.youtube.com/@%EA%B9%80%EC%9D%B4%EC%86%9D%EC%9D%98AI%EA%B0%80%EC%9D%B4%EB%93%9C', 2),
  ('toktokhan-dev', '똑똑한개발자',      'https://www.youtube.com/@toktokhandev', 3)
on conflict (slug) do update set name = excluded.name, url = excluded.url, sort = excluded.sort;


-- ── 확인 ───────────────────────────────────────────────────────────────────
-- select 'faq_topics' t, count(*) from public.faq_topics
-- union all select 'faqs', count(*) from public.faqs
-- union all select 'video_channels', count(*) from public.video_channels
-- union all select 'videos', count(*) from public.videos;
