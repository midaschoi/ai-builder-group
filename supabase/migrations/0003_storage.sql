-- ═══════════════════════════════════════════════════════════════════════════
--  이미지 저장소 — A-03 썸네일·본문 이미지 (FR-A03-06), A-05 히어로 (FR-A05-01)
--
--  0001 · 0002 를 먼저 실행한 뒤 이 파일을 실행하세요.
-- ═══════════════════════════════════════════════════════════════════════════

-- 공개 버킷이다. 이미지는 결국 공개 페이지에 뜨므로 숨길 이유가 없고,
-- 비공개로 두면 렌더할 때마다 서명 URL 을 만들어야 해서 ISR 캐시와 어긋난다.
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


-- ── 정책 ──────────────────────────────────────────────────────────────────
--  읽기는 누구나. 쓰기는 로그인한 활성 빌더만.
--  ⚠ 삭제는 관리자만 둔다 — 빌더가 남의 글에 걸린 이미지를 지우면
--     발행된 공개 페이지에 깨진 이미지가 남는다.

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
