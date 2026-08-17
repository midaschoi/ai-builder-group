import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import Forbidden from '../forbidden'
import FaqView, { type Row, type Topic } from './view'
import '../site-content.css'

/* A-09 FAQ 관리 — 범위 변경분 (백로그 §1.8). 운영 관리자 전용. */

export const dynamic = 'force-dynamic'

export default async function FaqAdminPage() {
  const me = await requireAdmin()
  if (!me) return <Forbidden />

  const supabase = await createClient()
  const [{ data: topics }, { data: items }] = await Promise.all([
    supabase.from('faq_topics').select('id, slug, label').order('sort'),
    supabase.from('faqs').select('topic_id, question, answer, show_on_home, is_active').order('sort'),
  ])

  return (
    <FaqView
      topics={(topics ?? []) as Topic[]}
      rows={(items ?? []) as Row[]}
    />
  )
}
