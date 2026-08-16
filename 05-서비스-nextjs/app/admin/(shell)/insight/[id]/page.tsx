import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import Forbidden from '../../forbidden'
import InsightEditor, { type Category, type Record_ } from './editor'
import '../../../editor.css'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Row = {
  id: string
  title: string | null
  slug: string | null
  excerpt: string | null
  body_html: string | null
  thumb_url: string | null
  category_id: string | null
  seo_title: string | null
  seo_description: string | null
  tags: string[] | null
  status: string
  reject_reason: string | null
  author_id: string | null
  updated_at: string | null
  author: { name: string } | null
}

export default async function InsightEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = (await getCurrentBuilder())!      /* 셸 레이아웃이 보장한다 */
  const isAdmin = me.role === 'admin'
  const supabase = await createClient()

  /* uuid 가 아니면 조회 자체가 에러를 던진다. 먼저 걸러낸다. */
  if (!UUID.test(id)) return <NotFound />

  const [{ data: raw }, { data: cats }] = await Promise.all([
    supabase
      .from('insights')
      .select('id, title, slug, excerpt, body_html, thumb_url, category_id, seo_title, seo_description, tags, status, reject_reason, author_id, updated_at, author:builders(name)')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('categories').select('id, name').eq('type', 'insight').order('sort'),
  ])

  const row = raw as unknown as Row | null
  if (!row) return <NotFound />

  /* 타인 글은 404 가 아니라 403 이다 (PRD §2.2) */
  if (!isAdmin && row.author_id !== me.id) return <Forbidden />

  /* 제출 후 잠금(DR-07) · 발행·보관은 관리자만 편집 */
  const readOnly = !isAdmin && ['pending', 'published', 'archived'].includes(row.status)

  const record: Record_ = {
    id: row.id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    excerpt: row.excerpt ?? '',
    body_html: row.body_html ?? '',
    thumb_url: row.thumb_url ?? '',
    category_id: row.category_id ?? '',
    seo_title: row.seo_title ?? '',
    seo_description: row.seo_description ?? '',
    tags: row.tags ?? [],
    status: row.status,
    reject_reason: row.reject_reason,
    author_name: row.author?.name ?? null,
    updated_at: row.updated_at,
  }

  return (
    <InsightEditor
      record={record}
      categories={(cats ?? []) as Category[]}
      isAdmin={isAdmin}
      readOnly={readOnly}
    />
  )
}

function NotFound() {
  return (
    <>
      <h1 className="adm-title">글을 찾을 수 없습니다</h1>
      <div className="adm-card">
        <div className="adm-empty">
          <p className="adm-dim">삭제되었거나 주소가 잘못되었습니다.</p>
          <Link className="adm-btn adm-btn--ghost" href="/admin/insight">목록으로</Link>
        </div>
      </div>
    </>
  )
}
