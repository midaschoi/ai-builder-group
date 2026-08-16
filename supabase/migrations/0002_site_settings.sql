-- ═══════════════════════════════════════════════════════════════════════════
--  site_settings — 클라이언트가 직접 바꿔야 하는 외부 연동 값
--
--  근거: 260812 2차 미팅
--    · "플러그(pluug) 같은 경우에는 그냥 임의로 계정 하나 만드신 다음에 폼 연동해 놓으시고,
--       나중에 저희가 바꿀 수 있게끔만 관리자 페이지에서 링크만 딱 바꾸면
--       렌더링 되게끔만 해 주시면 된다" (04:22)
--    · "네이버랑 구글 서치 콘솔 이런 것들은 그냥 한 번 등록하면 되는 거라서" (05:01)
--    · "GA 연동을 각자 하신 다음에 … 최종적으로 컨펌된 페이지만 옮겨주시면" (08:03)
--
--  지금까지 이 값들은 전부 환경변수(.env.local)에 있었다. 그러면 값을 바꿀 때마다
--  Vercel 설정에 들어가 재배포해야 한다 — 클라이언트가 스스로 못 바꾼다.
--  미팅 요구사항이 정확히 그 지점이라 DB 로 옮긴다.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.site_settings (
  -- 항상 한 행만 존재한다. id 를 1 로 고정해 두 번째 행이 생기는 사고를 막는다.
  id smallint primary key default 1 check (id = 1),

  -- 문의 폼 (pluug) 주소. 비우면 공개 웹은 환경변수 값으로 되돌아간다.
  pluug_form_url            text,

  -- GA4 측정 ID (G-XXXXXXXXXX). 비우면 스크립트를 아예 넣지 않는다.
  ga4_measurement_id        text,

  -- 구글 서치 콘솔 소유권 확인 코드 (content 값만. 태그 전체가 아니다)
  google_site_verification  text,

  -- 네이버 서치어드바이저 소유권 확인 코드
  naver_site_verification   text,

  -- 채널톡 플러그인 키
  channel_plugin_key        text,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.builders(id) on delete set null
);

comment on table public.site_settings is
  '클라이언트가 관리자 화면에서 직접 교체하는 외부 연동 값 (260812 2차 미팅). 항상 1행.';
comment on column public.site_settings.google_site_verification is
  'meta 태그 전체가 아니라 content 속성 값만 넣는다. 예: "abc123..." (<meta ...> 통째로 넣으면 태그가 이중으로 나간다)';

-- 빈 행을 미리 만들어 둔다. 화면이 "없으면 insert, 있으면 update" 를 분기하지 않아도 된다.
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();


-- ── RLS ───────────────────────────────────────────────────────────────────
--  읽기는 공개 웹(비로그인 서버 렌더)이 해야 하므로 열어 둔다.
--  ⚠ 여기에는 비밀이 아닌 값만 넣는다. GA4 측정 ID·서치콘솔 코드·pluug 주소는
--    모두 최종적으로 HTML 에 노출되는 공개 값이다. API 시크릿을 이 표에 넣지 말 것.
alter table public.site_settings enable row level security;

drop policy if exists site_settings_read  on public.site_settings;
drop policy if exists site_settings_write on public.site_settings;

create policy site_settings_read on public.site_settings for select using (true);

-- 쓰기는 운영 관리자만. 빌더는 사이트 전역 설정을 건드릴 수 없다.
create policy site_settings_write on public.site_settings for update
  using (public.is_admin()) with check (public.is_admin());
