-- ═══════════════════════════════════════════════════════════════════════════
-- 0004 · builders 컬럼 단위 잠금 (A-06 · PRD §2.2)
--
-- 문제:
--   0001 의 builders_update_self 정책은 "본인 행" 단위로만 막는다.
--     create policy builders_update_self on public.builders for update
--       using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
--   RLS 는 행 단위라 컬럼을 가리지 못한다. 그래서 빌더가 자기 행의 role 을
--   'admin' 으로, is_active 를 마음대로 바꿀 수 있다.
--
--   "서버 액션에서 막는다"로는 부족하다. PostgREST 엔드포인트는 공개 주소이고
--   publishable key 는 원래 공개용이다. 자기 JWT 만 있으면 우리 화면을 거치지 않고
--   직접 요청할 수 있다 — 관리자 승격 경로가 열려 있다는 뜻이다.
--
-- 조치:
--   authenticated 롤에서 UPDATE 권한을 회수하고, 프로필 컬럼에만 다시 준다.
--   PRD §2.2 "관리자 승격은 DB 직접 변경으로만" 을 화면이 아니라 DB 에서 강제한다.
--
--   is_active · must_change_password 는 계정 발급·회수 서버 액션이
--   service_role 클라이언트로 처리한다 (requireAdmin() 통과 후에만).
--   service_role 은 아래 revoke 대상이 아니다.
--
--   ⛔ role 컬럼은 어느 롤에도 다시 주지 않는다. 화면에도, 서버 액션에도 경로가 없다.
-- ═══════════════════════════════════════════════════════════════════════════

revoke update on public.builders from anon, authenticated;

grant update (name, slug, one_liner, role_label, avatar_url)
  on public.builders to authenticated;

-- 확인용 — 아래 쿼리에 role · is_active 가 나오면 안 된다.
--   select column_name, privilege_type
--     from information_schema.column_privileges
--    where table_name = 'builders' and grantee = 'authenticated' and privilege_type = 'UPDATE'
--    order by column_name;
