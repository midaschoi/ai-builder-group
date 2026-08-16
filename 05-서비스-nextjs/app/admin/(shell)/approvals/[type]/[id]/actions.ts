'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'

/* A-07 승인·반려.

   상태 전이는 서버 한 곳에서만 판정한다 (DR-06).
   빌더는 여기 접근 자체가 403 이다 (FR-A07-05). */

export type ReviewState = { error?: string }

const TABLE = { insight: 'insights', work: 'works' } as const
type Kind = keyof typeof TABLE

function isKind(v: string): v is Kind {
  return v === 'insight' || v === 'work'
}

export async function approve(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 승인할 수 있습니다.' }

  const kind = String(form.get('type') ?? '')
  const id = String(form.get('id') ?? '')
  if (!isKind(kind) || !id) return { error: '잘못된 요청입니다.' }

  const supabase = await createClient()

  const { data: row } = await supabase
    .from(TABLE[kind])
    .select('status, published_at')
    .eq('id', id)
    .maybeSingle<{ status: string; published_at: string | null }>()

  if (!row) return { error: '항목을 찾을 수 없습니다.' }
  /* 표에 없는 전이는 거부한다 (DR-06). pending 에서만 승인할 수 있다. */
  if (row.status !== 'pending') return { error: `승인대기 상태가 아닙니다. (현재: ${row.status})` }

  const { error } = await supabase
    .from(TABLE[kind])
    .update({
      status: 'published',
      /* 첫 발행에만 찍는다 — 재발행마다 갱신하면 목록 정렬이 뒤집힌다 */
      published_at: row.published_at ?? new Date().toISOString(),
      reject_reason: null,
    })
    .eq('id', id)

  if (error) return { error: `발행하지 못했습니다. ${error.message}` }

  /* ⚠ /insight/[slug]·/work/[slug] 동적 라우트가 아직 없다(백로그 §1.1).
     지금은 목록만 유효하고, 공개 웹 DB 연결 작업에서 상세가 켜지면 그대로 동작한다. */
  revalidatePath(kind === 'insight' ? '/insight' : '/work')
  revalidatePath('/admin/approvals')
  revalidatePath(`/admin/${kind}`)

  redirect('/admin/approvals')
}

export async function reject(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 반려할 수 있습니다.' }

  const kind = String(form.get('type') ?? '')
  const id = String(form.get('id') ?? '')
  const reason = String(form.get('reason') ?? '').trim()

  if (!isKind(kind) || !id) return { error: '잘못된 요청입니다.' }

  /* 사유 없이 반려할 수 없다 (FR-A07-04).
     "안됨" 한 마디로 돌려보내면 작성자가 뭘 고칠지 모른다 — DB CHECK 도 10자를 요구한다. */
  if (reason.length < 10) {
    return { error: '반려 사유를 10자 이상 적어주세요. 작성자에게 그대로 전달됩니다.' }
  }

  const supabase = await createClient()

  const { data: row } = await supabase
    .from(TABLE[kind]).select('status').eq('id', id)
    .maybeSingle<{ status: string }>()

  if (!row) return { error: '항목을 찾을 수 없습니다.' }
  if (row.status !== 'pending') return { error: `승인대기 상태가 아닙니다. (현재: ${row.status})` }

  const { error } = await supabase
    .from(TABLE[kind])
    .update({ status: 'rejected', reject_reason: reason })
    .eq('id', id)

  if (error) return { error: `반려하지 못했습니다. ${error.message}` }

  revalidatePath('/admin/approvals')
  revalidatePath(`/admin/${kind}`)

  redirect('/admin/approvals')
}
