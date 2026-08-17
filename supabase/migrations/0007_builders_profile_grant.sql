-- ═══════════════════════════════════════════════════════════════════════════
-- 0007 · 0006 이 추가한 프로필 컬럼을 0004 의 GRANT 목록에 넣는다
--
-- 증상:
--   관리자 → 빌더 관리 → 프로필 수정 → 저장 →
--     "저장하지 못했습니다. permission denied for table builders"
--
-- 원인:
--   0004 가 authenticated 의 UPDATE 를 회수하고 다섯 컬럼에만 다시 줬다.
--     grant update (name, slug, one_liner, role_label, avatar_url) …
--   그 뒤 0006 이 공개 프로필용 컬럼 여덟 개를 추가했는데 GRANT 목록을 넓히지 않았다.
--   saveProfile() 은 (의도적으로) service_role 이 아니라 일반 클라이언트를 쓰므로
--   0004 의 컬럼 권한을 그대로 받는다 — 그래서 payload 에 bio 가 끼는 순간 전부 거부된다.
--
--   ⓘ 포스트그레스는 컬럼 권한이 없을 때도 "permission denied for **table**" 이라고 말한다.
--     테이블 권한 문제로 읽고 엉뚱한 데를 뒤지기 쉽다.
--
-- 조치:
--   본인이 고쳐도 되는 프로필 컬럼만 추가로 연다.
--
--   ⛔ badge 는 주지 않는다. "✳ 이달의 빌더" 같은 편집자 표식이라
--      빌더가 스스로 달면 공개 사이트에서 자기를 승격시키는 것과 같다.
--      0004 가 role 을 막은 것과 같은 이유다. 관리자만 service_role 경로로 쓴다.
--   ⛔ sort 도 주지 않는다. 공개 목록의 노출 순서라 자기를 맨 앞으로 올릴 수 있다.
--      편집 폼이 보내지도 않는다.
--   ⛔ role · is_active · email · auth_user_id 는 0004 그대로 닫혀 있다.
-- ═══════════════════════════════════════════════════════════════════════════

grant update (bio, focus, stack, principles, link_label, link_url)
  on public.builders to authenticated;

-- 확인용 — 아래 11개가 나와야 한다. badge · sort · role · is_active 가 보이면 안 된다.
--   avatar_url, bio, focus, link_label, link_url, name,
--   one_liner, principles, role_label, slug, stack
--
--   select column_name
--     from information_schema.column_privileges
--    where table_name = 'builders' and grantee = 'authenticated'
--      and privilege_type = 'UPDATE'
--    order by column_name;
