-- ═══════════════════════════════════════════════════════════════════════════
-- 0010 · 비밀번호를 바꾸면 기존 접속을 끊는다
--
-- 문제 —
--   비밀번호를 바꿔도 이미 로그인해 둔 창은 그대로 쓸 수 있었다.
--   Supabase 의 signOut({scope:'others'}) 는 **갱신 토큰**만 회수한다.
--   이미 발급된 접속 토큰(JWT)은 만료(기본 1시간)까지 유효하다.
--   게다가 이 앱은 getClaims() 로 서명을 로컬 검증하므로 (perf, 3072b31)
--   Auth 서버에 묻지 않아 회수 사실을 알 방법이 없었다.
--
-- 해결 —
--   계정마다 "이 시각 이전에 발급된 토큰은 무효" 라는 기준선을 하나 둔다.
--   getCurrentBuilder() 는 어차피 매 요청 builders 행을 읽으므로
--   **네트워크 왕복이 늘지 않는다.** JWT 의 iat 와 이 값을 비교하면 끝이다.
--
-- ⛔ authenticated 롤에 UPDATE 를 주지 않는다. 주면 본인이 자기 기준선을 되돌려
--    로그아웃을 무력화할 수 있다. 0004 가 이미 builders 의 UPDATE 를 회수했고
--    0007 이 안전한 컬럼만 되돌려줬다 — 이 컬럼은 그 목록에 넣지 않는다.
--    쓰는 쪽은 service_role 뿐이다 (app/admin/reset/actions.ts).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.builders
  add column if not exists sessions_valid_from timestamptz;

comment on column public.builders.sessions_valid_from is
  '이 시각 이전에 발급된 접속 토큰(JWT.iat)은 무효로 본다. 비밀번호 변경 시 now() 로 올린다. service_role 만 쓴다.';


-- 확인용 —
--   select name, sessions_valid_from from public.builders order by sessions_valid_from desc nulls last;
--
--   authenticated 가 이 컬럼을 쓸 수 없어야 정상 (행이 나오면 안 된다):
--   select privilege_type from information_schema.column_privileges
--    where table_name = 'builders' and column_name = 'sessions_valid_from'
--      and grantee = 'authenticated' and privilege_type = 'UPDATE';
