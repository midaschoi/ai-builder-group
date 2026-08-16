'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import { sanitizeBody, isBodyEmpty } from '@/lib/sanitize'
import { checkSlug } from '@/lib/slug'

/* A-05 Work 편집 저장.

   A-03 과 같은 규칙을 따른다 (FR-A05-05): 상태 전이·권한 판정을 여기 한 곳에 모은다 (DR-06).
   다른 점은 셋이다 —
     · 본문이 자유 에디터가 아니라 문제/해결/결과 3막 고정 (FR-A05-01)
     · 참여 빌더 다대다 연결 (FR-A05-02)
     · 히어로 이미지가 제출·발행 시 필수 */

export type Intent = 'save' | 'submit' | 'publish' | 'archive'
export type SaveState = { error?: string; ok?: boolean; notice?: string }

type Existing = {
  id: string
  created_by: string | null
  status: string
  slug: string | null
  published_at: string | null
}

/** `[{id, role_label, sort}]` 형태로 직렬화해 hidden 필드로 넘어온다 */
type Member = { id: string; role_label: string }

function parseMembers(raw: string): Member[] {
  let parsed: unknown
  try { parsed = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(parsed)) return []

  const seen = new Set<string>()
  const out: Member[] = []
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue
    const id = String((item as Record<string, unknown>).id ?? '')
    /* 같은 빌더를 두 번 넣으면 복합 PK 위반으로 저장 전체가 실패한다.
       화면에서도 막지만 요청을 직접 만들면 우회되므로 여기서 한 번 더 걷어낸다. */
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push({ id, role_label: String((item as Record<string, unknown>).role_label ?? '').trim() })
  }
  return out
}

export async function saveWork(_prev: SaveState, form: FormData): Promise<SaveState> {
  const me = await getCurrentBuilder()
  if (!me) return { error: '로그인이 필요합니다.' }

  const isAdmin = me.role === 'admin'
  const supabase = await createClient()

  const rawId = String(form.get('id') ?? '').trim()
  const id = rawId && rawId !== 'new' ? rawId : null
  const intent = String(form.get('intent') ?? 'save') as Intent

  /* ── 1. 기존 프로젝트면 권한과 잠금을 먼저 본다 ─────────────────── */
  let existing: Existing | null = null
  if (id) {
    const { data } = await supabase
      .from('works')
      .select('id, created_by, status, slug, published_at')
      .eq('id', id)
      .maybeSingle<Existing>()

    if (!data) return { error: '프로젝트를 찾을 수 없습니다.' }
    existing = data

    /* 타인 리소스는 404 가 아니라 403 이다 (PRD §2.2).
       ⚠ Work 의 "본인 것"은 created_by 만이 아니다 — 참여 빌더도 포함한다 (A-04 §화면-빌더). */
    if (!isAdmin) {
      const { data: joined } = await supabase
        .from('work_builders').select('work_id')
        .eq('work_id', id).eq('builder_id', me.id).maybeSingle()

      if (data.created_by !== me.id && !joined) {
        return { error: '이 프로젝트를 수정할 권한이 없습니다.' }
      }
      /* 제출 후 잠금 (DR-07) */
      if (data.status === 'pending') return { error: '제출한 프로젝트는 승인·반려 전까지 수정할 수 없습니다.' }
      if (data.status === 'published') return { error: '발행된 프로젝트는 운영 관리자만 수정할 수 있습니다.' }
      if (data.status === 'archived') return { error: '보관된 프로젝트는 운영 관리자만 수정할 수 있습니다.' }
    }
  }

  /* ── 2. 다음 상태 (§7.3 상태 머신) ──────────────────────────────── */
  if ((intent === 'publish' || intent === 'archive') && !isAdmin) {
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
  const summary = String(form.get('summary') ?? '').trim()
  const heroUrl = String(form.get('hero_url') ?? '').trim()
  const thumbUrl = String(form.get('thumb_url') ?? '').trim()
  const ogImageUrl = String(form.get('og_image_url') ?? '').trim()
  const periodLabel = String(form.get('period_label') ?? '').trim()
  const scopeLabel = String(form.get('scope_label') ?? '').trim()
  const resultUrl = String(form.get('result_url') ?? '').trim()
  const seoTitle = String(form.get('seo_title') ?? '').trim()
  const seoDescription = String(form.get('seo_description') ?? '').trim()

  /* 저장 직전 서버에서 정제한다 — 에디터가 거른 것은 신뢰하지 않는다 (A-03 §서버 sanitize 와 동일) */
  const bodyProblem = sanitizeBody(String(form.get('body_problem') ?? ''))
  const bodySolution = sanitizeBody(String(form.get('body_solution') ?? ''))
  const bodyResult = sanitizeBody(String(form.get('body_result') ?? ''))

  const techTags = String(form.get('tech_tags') ?? '')
    .split(',').map(t => t.trim()).filter(Boolean)
    .filter((t, i, a) => a.indexOf(t) === i)

  const members = parseMembers(String(form.get('members') ?? ''))

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
    if (!summary) return { error: '한 줄 개요를 입력해 주세요. 목록 카드에 쓰입니다.' }
    if (!heroUrl) return { error: '히어로 이미지를 올려주세요.' }
    /* 3막은 셋 다 있어야 한다 — 하나라도 비면 공개 상세(P-03)의 뼈대가 무너진다 (FR-A05-01) */
    if (isBodyEmpty(bodyProblem)) return { error: '① 문제를 입력해 주세요. 3막은 셋 다 채워야 합니다.' }
    if (isBodyEmpty(bodySolution)) return { error: '② 해결을 입력해 주세요. 3막은 셋 다 채워야 합니다.' }
    if (isBodyEmpty(bodyResult)) return { error: '③ 결과를 입력해 주세요. 3막은 셋 다 채워야 합니다.' }
    if (members.length === 0) return { error: '참여 빌더를 1명 이상 추가해 주세요.' }
  }

  /* 슬러그 중복은 DB 유니크 인덱스도 막지만, 먼저 확인해 친절한 문구를 준다 */
  if (slug) {
    let dup = supabase.from('works').select('id').eq('slug', slug).limit(1)
    if (id) dup = dup.neq('id', id)
    const { data: found } = await dup
    if (found && found.length > 0) return { error: '이미 사용 중인 슬러그입니다.' }
  }

  const payload = {
    title: title || null,
    slug,
    category_id: categoryId || null,
    summary: summary || null,
    hero_url: heroUrl || null,
    /* 비우면 히어로를 쓴다 (A-05 §이미지) — null 로 두고 읽는 쪽에서 대체한다.
       여기서 히어로 주소를 복사해 넣으면, 나중에 히어로를 바꿔도 썸네일이 옛 이미지로 남는다. */
    thumb_url: thumbUrl || null,
    og_image_url: ogImageUrl || null,
    body_problem: bodyProblem || null,
    body_solution: bodySolution || null,
    body_result: bodyResult || null,
    tech_tags: techTags,
    period_label: periodLabel || null,
    scope_label: scopeLabel || null,
    result_url: resultUrl || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    /* ⛔ status 는 여기 넣지 않는다. 참여 빌더를 다 넣은 뒤 §6 끝에서 한 번만 바꾼다 —
       works 의 CHECK 제약이 draft 가 아닌 상태에서 필수 항목을 요구하므로 순서가 중요하다. */
    /* 첫 발행 때만 찍는다. 재발행마다 갱신하면 목록 정렬이 뒤집힌다 */
    published_at:
      nextStatus === 'published'
        ? (existing?.published_at ?? new Date().toISOString())
        : (existing?.published_at ?? null),
    reject_reason: intent === 'submit' ? null : undefined,
  }

  /* ── 5. 저장 ────────────────────────────────────────────────────── */
  let savedId = id
  let notice: string | undefined

  if (!id) {
    /* 새 프로젝트는 반드시 draft 로 먼저 넣는다 —
       RLS 의 insert 정책이 status='draft' 만 허용한다(빌더 기준). 상태 변경은 그다음 update 로. */
    const { data: created, error } = await supabase
      .from('works')
      .insert({ ...payload, status: 'draft', created_by: me.id })
      .select('id')
      .single<{ id: string }>()

    if (error) return { error: `저장하지 못했습니다. ${error.message}` }
    savedId = created.id
  } else {
    /* 발행된 프로젝트의 슬러그를 바꾸면 구 주소를 새 주소로 넘긴다 (FR-A05-03 = FR-A03-05).
       안 해두면 검색 결과와 외부 링크가 전부 404 가 된다. */
    const wasLive = existing!.status === 'published' || existing!.status === 'archived'
    if (wasLive && existing!.slug && slug && existing!.slug !== slug) {
      await supabase.from('redirects').upsert({
        from_path: `/work/${existing!.slug}`,
        to_path: `/work/${slug}`,
      }, { onConflict: 'from_path' })
      notice = `이전 주소 /work/${existing!.slug} 를 새 주소로 넘기는 301 을 만들었습니다.`
    }

    const { error } = await supabase.from('works').update(payload).eq('id', id)
    if (error) return { error: `저장하지 못했습니다. ${error.message}` }
  }

  /* ── 6. 참여 빌더 연결 (FR-A05-02) ──────────────────────────────── */
  /* 지우고 다시 넣는다. 순서(sort)까지 맞추려면 차집합을 계산하는 것보다 이쪽이 훨씬 단순하고,
     work_builders 는 연결 정보만 담아 잃을 데이터가 없다.
     ⚠ 회수된(비활성) 빌더도 그대로 다시 넣는다 — 연결은 유지한다 (PRD D4). */
  const { error: delErr } = await supabase.from('work_builders').delete().eq('work_id', savedId!)
  if (delErr) return { error: `참여 빌더를 저장하지 못했습니다. ${delErr.message}` }

  if (members.length > 0) {
    const { error: insErr } = await supabase.from('work_builders').insert(
      members.map((m, i) => ({
        work_id: savedId!,
        builder_id: m.id,
        role_label: m.role_label || null,
        sort: i,
      })),
    )
    if (insErr) return { error: `참여 빌더를 저장하지 못했습니다. ${insErr.message}` }
  }

  /* 상태 변경은 참여 빌더까지 다 넣은 뒤 마지막에 한 번만 한다 */
  if (nextStatus !== (existing?.status ?? 'draft')) {
    const { error: e2 } = await supabase
      .from('works').update({ status: nextStatus }).eq('id', savedId!)
    if (e2) return { error: `상태를 바꾸지 못했습니다. ${e2.message}` }
  }

  /* ── 7. 공개 반영 (FR-A05-05) ───────────────────────────────────── */
  /* ⚠ /work/[slug] 동적 라우트가 아직 없다(백로그 §1.1). 지금은 목록만 유효하고,
     상세는 공개 웹 DB 연결 작업에서 켜진다. 그때 이 호출이 그대로 동작한다. */
  revalidatePath('/work')
  revalidatePath('/admin/work')

  if (!id && savedId) redirect(`/admin/work/${savedId}`)

  return { ok: true, notice }
}


/* ── 이미지 업로드 (FR-A05-04) ───────────────────────────────────── */

/* 히어로만 3MB 다 — 21:9 로 넓게 쓰이므로 같은 화질이어도 파일이 더 크다 (A-05 §이미지) */
const LIMIT: Record<string, number> = {
  hero: 3 * 1024 * 1024,
  thumb: 2 * 1024 * 1024,
  og: 2 * 1024 * 1024,
  body: 2 * 1024 * 1024,
}
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadWorkImage(form: FormData): Promise<{ url?: string; error?: string }> {
  const me = await getCurrentBuilder()
  if (!me) return { error: '로그인이 필요합니다.' }

  const kind = String(form.get('kind') ?? 'body')
  const max = LIMIT[kind] ?? LIMIT.body

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: '파일을 선택해 주세요.' }

  if (!ALLOWED.includes(file.type)) return { error: 'jpg · png · webp 만 올릴 수 있습니다.' }
  /* 자동 압축하지 않는다 — 조용히 화질을 떨어뜨리면 나중에 원인을 못 찾는다 */
  if (file.size > max) {
    return {
      error: `${kind === 'hero' ? '히어로 이미지는 3MB' : '이미지는 2MB'} 이하로 올려주세요.` +
        ` (지금 ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `works/${me.id}/${crypto.randomUUID()}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) return { error: `업로드하지 못했습니다. ${error.message}` }

  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return { url: data.publicUrl }
}
