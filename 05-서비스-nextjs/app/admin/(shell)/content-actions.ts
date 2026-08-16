'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/content'
import { createClient } from '@/lib/supabase'
import { getCurrentBuilder, requireAdmin } from '@/lib/session'
import { checkSlug } from '@/lib/slug'

/* 목록의 [관리 ▾] 에서 부르는 동작 — 보관과 삭제.

   ⛔ 둘 다 관리자 전용이다 (FR-A02-02 · A-04 §행 액션).
      빌더는 메뉴에서도 안 보이고 여기서도 막힌다. */

export type Kind = 'insight' | 'work'
export type RowState = { error?: string; ok?: boolean; notice?: string }

const TABLE = { insight: 'insights', work: 'works' } as const
const BASE = { insight: '/insight', work: '/work' } as const

function isKind(v: string): v is Kind {
  return v === 'insight' || v === 'work'
}


/* ── 슬러그 실시간 확인 (A-03 · A-05 §슬러그) ───────────────────── */

export type SlugCheckResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'taken'; message: string }

export async function checkSlugAvailable(
  kind: Kind, raw: string, selfId: string | null,
): Promise<SlugCheckResult> {
  /* 로그인 확인만 한다 — 슬러그가 쓰였는지는 발행되면 어차피 주소로 드러난다.
     여기서 소유권까지 따지면 남의 글과 겹쳤을 때 "쓸 수 있다"고 답하게 된다. */
  const me = await getCurrentBuilder()
  if (!me) return { ok: false, reason: 'invalid', message: '로그인이 필요합니다.' }

  const checked = checkSlug(raw)
  if (!checked.ok) return { ok: false, reason: 'invalid', message: checked.message }
  const slug = checked.value

  const supabase = await createClient()

  /* Insight 는 카테고리 주소와도 겹치면 안 된다 —
     공개 라우트가 카테고리를 먼저 보기 때문에 겹치면 글이 영영 안 열린다. */
  if (kind === 'insight') {
    const { data: cat } = await supabase
      .from('categories').select('slug').eq('type', 'insight').eq('slug', slug).limit(1)
    if (cat && cat.length > 0) {
      return { ok: false, reason: 'taken', message: '카테고리 주소로 이미 쓰고 있습니다.' }
    }
  }

  let dup = supabase.from(TABLE[kind]).select('id').eq('slug', slug).limit(1)
  if (selfId) dup = dup.neq('id', selfId)
  const { data } = await dup

  return data && data.length > 0
    ? { ok: false, reason: 'taken', message: '이미 사용 중입니다.' }
    : { ok: true }
}


/* ── 보관 (DR-05 · DR-08) ────────────────────────────────────────── */

export async function archiveContent(_prev: RowState, form: FormData): Promise<RowState> {
  const me = await requireAdmin()
  if (!me) return { error: '보관은 운영 관리자만 할 수 있습니다.' }

  const kind = String(form.get('kind') ?? '')
  const id = String(form.get('id') ?? '')
  if (!isKind(kind) || !id) return { error: '잘못된 요청입니다.' }

  const supabase = await createClient()

  const { data: row } = await supabase
    .from(TABLE[kind]).select('id, title, slug, status').eq('id', id)
    .maybeSingle<{ id: string; title: string | null; slug: string | null; status: string }>()

  if (!row) return { error: '항목을 찾을 수 없습니다.' }
  if (row.status === 'archived') return { error: '이미 보관된 항목입니다.' }

  const { error } = await supabase
    .from(TABLE[kind]).update({ status: 'archived' }).eq('id', id)
  if (error) return { error: `보관하지 못했습니다. ${error.message}` }

  /* 발행된 적이 있으면 그 주소가 밖에 남아 있다. 보관했다고 404 를 내면 색인을 잃는다 —
     목록으로 넘긴다 (DR-08: archived 전이 시 301, 404 아님). */
  let notice = `「${row.title || '제목 없음'}」 을 보관했습니다.`
  if (row.slug) {
    await supabase.from('redirects').upsert({
      from_path: `${BASE[kind]}/${row.slug}`,
      to_path: BASE[kind],
    }, { onConflict: 'from_path' })
    notice += ` 이전 주소는 목록으로 넘어갑니다.`
  }

  updateTag(CONTENT_TAG)
  revalidatePath(`/admin/${kind}`)
  return { ok: true, notice }
}

export async function restoreContent(_prev: RowState, form: FormData): Promise<RowState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 할 수 있습니다.' }

  const kind = String(form.get('kind') ?? '')
  const id = String(form.get('id') ?? '')
  if (!isKind(kind) || !id) return { error: '잘못된 요청입니다.' }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from(TABLE[kind]).select('id, title, slug').eq('id', id)
    .maybeSingle<{ id: string; title: string | null; slug: string | null }>()
  if (!row) return { error: '항목을 찾을 수 없습니다.' }

  const { error } = await supabase
    .from(TABLE[kind]).update({ status: 'published' }).eq('id', id)
  if (error) return { error: `되돌리지 못했습니다. ${error.message}` }

  /* 보관하면서 만들어 둔 "목록으로" 리다이렉트를 걷어낸다.
     남겨두면 다시 발행해도 상세로 못 들어가고 목록으로 튕긴다. */
  if (row.slug) {
    await supabase.from('redirects').delete()
      .eq('from_path', `${BASE[kind]}/${row.slug}`)
      .eq('to_path', BASE[kind])
  }

  updateTag(CONTENT_TAG)
  revalidatePath(`/admin/${kind}`)
  return { ok: true, notice: `「${row.title || '제목 없음'}」 을 다시 발행했습니다.` }
}


/* ── 삭제 (FR-A02-02 · FR-A00-06) ────────────────────────────────── */

/** 삭제 확인창에 보여줄 파급 — 실제 건수를 세어 준다 (A-04 §삭제 시 추가 경고) */
export async function deleteImpact(kind: Kind, id: string): Promise<{
  title: string; status: string; slug: string | null; members: number
} | null> {
  const me = await requireAdmin()
  if (!me) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from(TABLE[kind]).select('title, status, slug').eq('id', id)
    .maybeSingle<{ title: string | null; status: string; slug: string | null }>()
  if (!data) return null

  let members = 0
  if (kind === 'work') {
    const { count } = await supabase
      .from('work_builders').select('work_id', { count: 'exact', head: true }).eq('work_id', id)
    members = count ?? 0
  }

  return { title: data.title || '(제목 없음)', status: data.status, slug: data.slug, members }
}

export async function deleteContent(_prev: RowState, form: FormData): Promise<RowState> {
  const me = await requireAdmin()
  if (!me) return { error: '삭제는 운영 관리자만 할 수 있습니다.' }

  const kind = String(form.get('kind') ?? '')
  const id = String(form.get('id') ?? '')
  if (!isKind(kind) || !id) return { error: '잘못된 요청입니다.' }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from(TABLE[kind]).select('id, title').eq('id', id)
    .maybeSingle<{ id: string; title: string | null }>()
  if (!row) return { error: '항목을 찾을 수 없습니다.' }

  /* ⚠ 하드 삭제다. DR-05 는 "소프트 삭제(보관) 우선" 이라 화면에서도 보관을 먼저 권한다.
     work_builders 는 on delete cascade 라 연결이 함께 끊긴다 — 확인창이 그것을 미리 알린다.
     ⛔ Storage 에 올린 이미지는 지우지 않는다. 다른 글이 같은 파일을 참조하고 있을 수 있고,
        되돌릴 방법이 없는 삭제를 여기서 하나 더 얹지 않는다. 정리는 별도 작업이다. */
  const { error } = await supabase.from(TABLE[kind]).delete().eq('id', id)
  if (error) return { error: `삭제하지 못했습니다. ${error.message}` }

  updateTag(CONTENT_TAG)
  revalidatePath(`/admin/${kind}`)
  return { ok: true, notice: `「${row.title || '제목 없음'}」 을 삭제했습니다.` }
}
