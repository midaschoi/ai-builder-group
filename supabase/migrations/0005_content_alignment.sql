-- ═══════════════════════════════════════════════════════════════════════════
-- 0005 · 공개 웹 연결 준비 (기획서 §4.3 · P-05 템플릿)
--
-- 공개 상세 템플릿과 DB 를 나란히 놓고 대조하다 두 가지가 어긋나 있었다.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Insight 태그 ────────────────────────────────────────────────────────
-- 공개 상세(P-05) 하단이 태그 칩을 그리는데 저장할 컬럼이 없었다.
-- works.tech_tags 와 같은 모양으로 맞춘다.
alter table public.insights
  add column if not exists tags text[] not null default '{}';


-- ── 2. Insight 카테고리 재정렬 ─────────────────────────────────────────────
-- 세 군데가 전부 달랐다:
--   기획서 §4.3   일하는 방식 · AI 활용 공유회 · 발주 가이드 · 빌더 노트
--   공개 웹 구현   AI·AX · 발주 가이드 · 프로젝트 · 일하는 방식
--   DB seed(0001)  방법론 · AI·AX · 그로스 · 개발
--
-- 기획서 §4.3 은 클라이언트가 "우리 핏에 맞게 재구성해서 제안" 을 직접 요청해서
-- 나온 안이다. 셋 중 유일하게 근거가 있는 쪽이라 이것을 기준으로 삼는다.
--
-- ⚠ 팀 확인이 끝나지 않았다면 이 블록만 실행하지 않아도 된다 (§1 태그는 무관하다).
--   카테고리 슬러그는 곧 /insight/<슬러그> URL 이 되므로, 발행 후에 바꾸면 301 이 필요하다.

insert into public.categories (slug, name, type, sort) values
  ('how-we-work',  '일하는 방식',     'insight', 1),
  ('ai-playbook',  'AI 활용 공유회',  'insight', 2),
  ('client-guide', '발주 가이드',     'insight', 3),
  ('builder-note', '빌더 노트',       'insight', 4)
on conflict (type, slug) do update
  set name = excluded.name, sort = excluded.sort;

-- 옛 카테고리 정리. category_id 는 on delete set null 이라
-- 이미 쓰고 있던 글이 지워지지 않고 카테고리만 비워진다 — 편집 화면에서 다시 고르면 된다.
delete from public.categories
 where type = 'insight'
   and slug in ('methodology', 'ai-ax', 'growth', 'dev');


-- ── 3. 확인 ────────────────────────────────────────────────────────────────
-- select type, slug, name, sort from public.categories order by type, sort;
--   insight  how-we-work  일하는 방식
--   insight  ai-playbook  AI 활용 공유회
--   insight  client-guide 발주 가이드
--   insight  builder-note 빌더 노트
--   work     commerce / aiax / platform / finance   ← 공개 웹 구현과 이미 일치한다
