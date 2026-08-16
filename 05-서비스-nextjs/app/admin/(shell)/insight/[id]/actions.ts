'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/content'
import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import { sanitizeBody, isBodyEmpty } from '@/lib/sanitize'
import { checkSlug } from '@/lib/slug'

/* A-03 Insight 편집 저장.

   상태 전이·권한 판정을 전부 여기 한 곳에 모은다 (DR-06).
   화면마다 흩어 놓으면 한 군데만 빠뜨려도 게이트가 뚫린다. */

export type Intent = 'save' | 'submit' | 'publish' | 'archive'
export type SaveState = { error?: string; ok?: boolean; notice?: string }

type Existing = {
  id: string
  author_id: string | null
  status: string
  slug: string | null
  published_at: string | null
}

export async function saveInsight(_prev: SaveState, form: FormData): Promise<SaveState> {
  const me = await getCurrentBuilder()
  if (!me) return { error: '로그인이 필요합니다.' }

  const isAdmin = me.role === 'admin'
  const supabase = await createClient()

  const rawId = String(form.get('id') ?? '').trim()
  const id = rawId && rawId !== 'new' ? rawId : null
  const intent = (String(form.get('intent') ?? 'save') as Intent)

  /* ── 1. 기존 글이면 권한과 잠금을 먼저 본다 ─────────────────────── */
  let existing: Existing | null = null
  if (id) {
    const { data } = await supabase
      .from('insights')
      .select('id, author_id, status, slug, published_at')
      .eq('id', id)
      .maybeSingle<Existing>()

    if (!data) return { error: '글을 찾을 수 없습니다.' }
    existing = data

    /* 타인 리소스는 404 가 아니라 403 이다 (PRD §2.2) */
    if (!isAdmin && data.author_id !== me.id) {
      return { error: '이 글을 수정할 권한이 없습니다.' }
    }
    /* 제출 후 잠금 (DR-07) */
    if (!isAdmin && data.status === 'pending') {
      return { error: '제출한 글은 승인·반려 전까지 수정할 수 없습니다.' }
    }
    if (!isAdmin && data.status === 'published') {
      return { error: '발행된 글은 운영 관리자만 수정할 수 있습니다.' }
    }
    if (!isAdmin && data.status === 'archived') {
      return { error: '보관된 글은 운영 관리자만 수정할 수 있습니다.' }
    }
  }

  /* ── 2. 다음 상태를 정한다 (§7.3 상태 머신) ─────────────────────── */
  if ((intent === 'publish' || intent === 'archive') && !isAdmin) {
    /* 빌더의 published 직행 시도는 403 이 인수 조건이다 (DR-06) */
    return { error: '발행·보관은 운영 관리자만 할 수 있습니다.' }
  }

  const nextStatus =
    intent === 'publish' ? 'published'
    : intent === 'archive' ? 'archived'
    : intent === 'submit' ? 'pending'
    /* save 는 상태를 바꾸지 않는다. 반려 상태를 유지해야 사유 배너가 계속 보인다. */
    : (existing?.status ?? 'draft')

  /* ── 3. 값 정리 ─────────────────────────────────────────────────── */
  const title = String(form.get('title') ?? '').trim()
  const rawSlug = String(form.get('slug') ?? '').trim()
  const categoryId = String(form.get('category_id') ?? '').trim()
  const excerpt = String(form.get('excerpt') ?? '').trim()
  const thumbUrl = String(form.get('thumb_url') ?? '').trim()
  const seoTitle = String(form.get('seo_title') ?? '').trim()
  const seoDescription = String(form.get('seo_description') ?? '').trim()

  /* 저장 직전 서버에서 정제한다 — 에디터가 거른 것은 신뢰하지 않는다 (FR-A03-03) */
  const bodyHtml = sanitizeBody(String(form.get('body_html') ?? ''))

  const tags = String(form.get('tags') ?? '')
    .split(',').map(x => x.trim()).filter(Boolean)
    .filter((x, i, arr) => arr.indexOf(x) === i)

  /* ── 4. 검증 — 초안은 아무것도 안 채워도 저장된다 ────────────────── */
  const mustValidate = intent !== 'save'
  let slug: string | null = null

  if (rawSlug) {
    const checked = checkSlug(rawSlug)
    if (!checked.ok) return { error: checked.message }
    slug = checked.value
  }

  if (mustValidate) {
    if (!title) return { error: '제목을 입력해 주세요.' }
    if (!slug) return { error: '슬러그를 입력해 주세요.' }
    if (!categoryId) return { error: '카테고리를 선택해 주세요.' }
    if (!excerpt) return { error: '요약을 입력해 주세요. 목록 카드에 쓰입니다.' }
    if (isBodyEmpty(bodyHtml)) return { error: '본문을 입력해 주세요.' }
  }

  /* 슬러그 중복은 DB 유니크 인덱스도 막지만, 먼저 확인해 친절한 문구를 준다 */
  if (slug) {
    let dup = supabase.from('insights').select('id').eq('slug', slug).limit(1)
    if (id) dup = dup.neq('id', id)
    const { data: found } = await dup
    if (found && found.length > 0) return { error: '이미 사용 중인 슬러그입니다.' }

    /* ⚠ 카테고리 슬러그와 겹치면 안 된다.
       공개 라우트 /insight/[slug] 가 카테고리를 먼저 보기 때문에(app/insight/[slug]/page.tsx),
       겹치면 이 글은 주소가 있어도 영영 열리지 않는다. */
    const { data: cat } = await supabase
      .from('categories').select('slug').eq('type', 'insight').eq('slug', slug).limit(1)
    if (cat && cat.length > 0) {
      return { error: `"${slug}" 는 카테고리 주소로 이미 쓰고 있습니다. 다른 슬러그를 써주세요.` }
    }
  }

  const payload = {
    title: title || null,
    slug,
    category_id: categoryId || null,
    excerpt: excerpt || null,
    body_html: bodyHtml || null,
    thumb_url: thumbUrl || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    tags,
    status: nextStatus,
    /* 첫 발행 때만 찍는다. 재발행마다 갱신하면 목록 정렬이 뒤집힌다 */
    published_at:
      nextStatus === 'published'
        ? (existing?.published_at ?? new Date().toISOString())
        : (existing?.published_at ?? null),
    /* 다시 제출하면 이전 반려 사유를 지운다 — 남겨두면 고친 뒤에도 빨간 배너가 붙어 있다 */
    reject_reason: intent === 'submit' ? null : undefined,
  }

  /* ── 5. 저장 ────────────────────────────────────────────────────── */
  let savedId = id
  let notice: string | undefined

  if (!id) {
    /* 새 글은 반드시 draft 로 먼저 넣는다 —
       RLS 의 insert 정책이 status='draft' 만 허용한다(빌더 기준). 상태 변경은 그다음 update 로. */
    const { data: created, error } = await supabase
      .from('insights')
      .insert({ ...payload, status: 'draft', author_id: me.id })
      .select('id')
      .single<{ id: string }>()

    if (error) return { error: `저장하지 못했습니다. ${error.message}` }
    savedId = created.id

    if (nextStatus !== 'draft') {
      const { error: e2 } = await supabase
        .from('insights').update({ status: nextStatus }).eq('id', savedId)
      if (e2) return { error: `상태를 바꾸지 못했습니다. ${e2.message}` }
    }
  } else {
    /* 발행된 글의 슬러그를 바꾸면 구 주소를 새 주소로 넘긴다 (FR-A03-05).
       안 해두면 검색 결과와 외부 링크가 전부 404 가 된다. */
    const wasLive = existing!.status === 'published' || existing!.status === 'archived'
    if (wasLive && existing!.slug && slug && existing!.slug !== slug) {
      await supabase.from('redirects').upsert({
        from_path: `/insight/${existing!.slug}`,
        to_path: `/insight/${slug}`,
      }, { onConflict: 'from_path' })
      notice = `이전 주소 /insight/${existing!.slug} 를 새 주소로 넘기는 301 을 만들었습니다.`
    }

    const { error } = await supabase.from('insights').update(payload).eq('id', id)
    if (error) return { error: `저장하지 못했습니다. ${error.message}` }
  }

  /* ── 6. 공개 반영 (FR-A03-08) ───────────────────────────────────── */
  /* 공개 캐시를 통째로 비운다 (FR-A03-08). 목록·상세·사이트맵이 한 태그를 공유하므로
     경로를 하나씩 적다가 빠뜨려 '발행했는데 안 보인다' 가 생기지 않는다. */
  updateTag(CONTENT_TAG)
  revalidatePath('/admin/insight')

  if (!id && savedId) redirect(`/admin/insight/${savedId}`)

  return { ok: true, notice }
}


/* ── 이미지 업로드 (FR-A03-06) ───────────────────────────────────── */

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadImage(form: FormData): Promise<{ url?: string; error?: string }> {
  const me = await getCurrentBuilder()
  if (!me) return { error: '로그인이 필요합니다.' }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: '파일을 선택해 주세요.' }

  if (!ALLOWED.includes(file.type)) {
    return { error: 'jpg · png · webp 만 올릴 수 있습니다.' }
  }
  /* 자동 압축하지 않는다 — 조용히 화질을 떨어뜨리면 나중에 원인을 못 찾는다 */
  if (file.size > MAX_BYTES) {
    return { error: `이미지는 2MB 이하로 올려주세요. (지금 ${(file.size / 1024 / 1024).toFixed(1)}MB)` }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `insights/${me.id}/${crypto.randomUUID()}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) return { error: `업로드하지 못했습니다. ${error.message}` }

  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return { url: data.publicUrl }
}
