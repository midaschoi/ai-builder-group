-- ═══════════════════════════════════════════════════════════════════════════
--  설정 점검 — 0001 · 0002 를 실행한 뒤 이 파일을 붙여넣고 Run 하세요.
--  표 한 장으로 무엇이 되었고 무엇이 안 됐는지 보여줍니다.
-- ═══════════════════════════════════════════════════════════════════════════

with expected_tables(name) as (
  values ('builders'),('categories'),('works'),('insights'),
         ('work_builders'),('redirects'),('site_settings')
),
checks as (
  select 1 as ord, '테이블' as "항목", 7 as "기대", (
    select count(*)::int from information_schema.tables t
     where t.table_schema = 'public'
       and t.table_name in (select name from expected_tables)
  ) as "실제", '0001 · 0002 를 둘 다 실행했는가' as "안 맞으면"

  union all
  select 2, 'RLS 활성화', 7, (
    select count(*)::int from pg_tables
     where schemaname = 'public' and rowsecurity
       and tablename in (select name from expected_tables)
  ), 'DR-04 — 하나라도 꺼져 있으면 그 표는 무방비다'

  union all
  -- 0001 이 20개(categories 2 · builders 3 · works 5 · insights 5 · work_builders 3 · redirects 2),
  -- 0002 가 2개(site_settings) → 합계 22
  select 3, '보안 정책', 22, (
    select count(*)::int from pg_policies where schemaname = 'public'
  ), '0001 을 중간에 끊지 않았는지 확인'

  union all
  select 4, '카테고리 시드', 8, (
    select count(*)::int from public.categories
  ), 'Insight 4종 + Work 4종'

  union all
  select 5, '설정 행', 1, (
    select count(*)::int from public.site_settings
  ), '0002 를 실행했는가'

  union all
  select 6, '관리자 계정', 1, (
    select count(*)::int from public.builders where role = 'admin' and is_active
  ), '아래 §2 를 아직 안 했다 — 이게 0이면 로그인해도 튕긴다'
)
select
  "항목", "기대", "실제",
  case when "실제" >= "기대" then '✅' else '❌' end as "판정",
  case when "실제" >= "기대" then '' else "안 맞으면" end as "확인할 것"
from checks
order by ord;


-- ═══════════════════════════════════════════════════════════════════════════
--  §2. 첫 관리자 계정 만들기
--
--  "관리자 계정" 이 ❌ 라면 아직 안 한 것입니다. 순서는 이렇습니다.
--
--   ① 왼쪽 메뉴 Authentication > Users > "Add user" > "Create new user"
--      · Email / Password 입력
--      · ⚠ "Auto Confirm User" 를 반드시 켠다 (안 켜면 메일 인증 대기라 로그인 불가)
--
--   ② 만들어진 사용자를 클릭해 UID 를 복사한다 (a1b2c3d4-... 형태)
--
--   ③ 아래 주석을 풀고 값 4개를 바꿔 실행한다
--
--  ⚠ 관리자는 이 방법으로만 만들 수 있습니다. 화면에는 역할을 바꾸는 UI 가 없습니다
--    (PRD §2.2 — 실수로 관리자가 생기는 경로를 없앴습니다).
-- ═══════════════════════════════════════════════════════════════════════════

-- insert into public.builders (auth_user_id, slug, name, email, role, role_label)
-- values (
--   '여기에-복사한-UID',      -- ② 에서 복사한 값
--   'midas',                  -- 영문 슬러그 (2차 빌더 프로필 주소가 됩니다)
--   '최대표',                  -- 화면에 뜰 이름
--   'proimexkr@gmail.com',    -- ① 에서 쓴 이메일과 반드시 같아야 합니다
--   'admin',
--   '운영 관리자'
-- );


-- ── 만들고 나서 다시 확인 ──────────────────────────────────────────────────
-- select b.name, b.email, b.role, b.is_active,
--        (u.id is not null) as "인증계정 연결됨"
--   from public.builders b
--   left join auth.users u on u.id = b.auth_user_id;
--
--  "인증계정 연결됨" 이 false 면 UID 를 잘못 붙여넣은 것입니다.
--  그 상태로는 로그인해도 "이메일 또는 비밀번호가 올바르지 않습니다" 가 나옵니다.
