'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { CONTENT_TAG } from '@/lib/content'
import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'

/* A-09 FAQ · A-10 콘텐츠(유튜브) 저장.

   ⚠ 범위 변경분이다 (기획서 §5.6 은 관리자 범위를 네 개로 못박았다). 백로그 §1.8 참고.

   두 화면 모두 "목록 전체를 한 번에 저장" 한다. 항목마다 저장 버튼을 두면
   순서를 바꾸는 동안 절반만 저장된 상태가 생긴다 — A-05 의 참여 빌더와 같은 방식이다.
   ⛔ 관리자 전용이다. RLS 도 같은 것을 막지만 여기서 먼저 끊는다. */

export type SaveState = { error?: string; ok?: boolean }

function parse<T>(raw: string): T[] {
  try {
    const v = JSON.parse(raw || '[]')
    return Array.isArray(v) ? v : []
  } catch { return [] }
}

const str = (v: unknown) => String(v ?? '').trim()


/* ── FAQ ─────────────────────────────────────────────────────────── */

type FaqIn = { topic_id: string; question: string; answer: string; show_on_home: boolean; is_active: boolean }

export async function saveFaqs(_prev: SaveState, form: FormData): Promise<SaveState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 수정할 수 있습니다.' }

  const items = parse<FaqIn>(String(form.get('items') ?? ''))

  /* 빈 질문·답변은 화면에서도 막지만, 요청을 직접 만들면 우회된다 */
  for (const [i, it] of items.entries()) {
    if (!str(it.question)) return { error: `${i + 1}번 항목의 질문이 비어 있습니다.` }
    if (!str(it.answer)) return { error: `${i + 1}번 항목의 답변이 비어 있습니다.` }
    if (!str(it.topic_id)) return { error: `${i + 1}번 항목의 토픽이 선택되지 않았습니다.` }
  }

  const supabase = await createClient()

  /* 지우고 다시 넣는다 — 순서(sort)까지 맞추려면 차집합 계산보다 단순하고,
     faqs 를 참조하는 곳이 없어 잃을 데이터가 없다 (A-05 의 work_builders 와 같은 판단). */
  const { error: delErr } = await supabase.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) return { error: `저장하지 못했습니다. ${delErr.message}` }

  if (items.length > 0) {
    const { error } = await supabase.from('faqs').insert(items.map((it, i) => ({
      topic_id: it.topic_id,
      question: str(it.question),
      answer: str(it.answer),
      show_on_home: Boolean(it.show_on_home),
      is_active: it.is_active !== false,
      sort: i,
    })))
    if (error) return { error: `저장하지 못했습니다. ${error.message}` }
  }

  updateTag(CONTENT_TAG)
  revalidatePath('/admin/faq')
  return { ok: true }
}


/* ── 유튜브 ──────────────────────────────────────────────────────── */

type VideoIn = {
  youtube_id: string; title: string; subtitle: string
  channel_name: string; duration: string; is_active: boolean
}

/** 주소를 통째로 붙여넣어도 id 만 뽑는다 — 사람이 11자리를 골라내게 하지 않는다 */
function youtubeId(raw: string): string {
  const v = str(raw)
  const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  if (m) return m[1]
  return /^[A-Za-z0-9_-]{11}$/.test(v) ? v : ''
}

export async function saveVideos(_prev: SaveState, form: FormData): Promise<SaveState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 수정할 수 있습니다.' }

  const items = parse<VideoIn>(String(form.get('items') ?? ''))

  const rows = []
  for (const [i, it] of items.entries()) {
    const id = youtubeId(it.youtube_id)
    if (!id) return { error: `${i + 1}번 영상의 주소가 올바르지 않습니다. 유튜브 링크나 11자리 ID 를 넣어주세요.` }
    if (!str(it.title)) return { error: `${i + 1}번 영상의 제목이 비어 있습니다.` }
    if (!str(it.channel_name)) return { error: `${i + 1}번 영상의 채널명이 비어 있습니다.` }
    rows.push({
      youtube_id: id,
      title: str(it.title),
      subtitle: str(it.subtitle) || null,
      channel_name: str(it.channel_name),
      duration: str(it.duration) || null,
      is_active: it.is_active !== false,
      sort: i,
    })
  }

  const supabase = await createClient()
  const { error: delErr } = await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) return { error: `저장하지 못했습니다. ${delErr.message}` }

  if (rows.length > 0) {
    const { error } = await supabase.from('videos').insert(rows)
    if (error) return { error: `저장하지 못했습니다. ${error.message}` }
  }

  updateTag(CONTENT_TAG)
  revalidatePath('/admin/videos')
  return { ok: true }
}
