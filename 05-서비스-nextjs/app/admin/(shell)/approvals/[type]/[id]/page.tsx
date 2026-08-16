import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import Forbidden from '../../../forbidden'
import ReviewBar from './review'
import './review.css'

/* A-07 검토 화면.

   ⚠ 미리보기는 인증 안쪽에 있다 (PRD D3 — 공개 토큰 URL 금지).
     링크가 새면 승인 전 콘텐츠가 그대로 노출된다.

   ⚠ 공개 템플릿(P-05·P-03)이 아직 정적 한 장짜리라(백로그 §1.1) 여기서는 임시 렌더를 쓴다.
     저장 시 정제된 body_html 을 그대로 그리므로 sanitize 결과를 눈으로 확인하는 용도도 겸한다.
     공개 웹 DB 연결 작업에서 실제 템플릿으로 교체한다. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type InsightRow = {
  id: string; title: string | null; excerpt: string | null; body_html: string | null
  thumb_url: string | null; slug: string | null; status: string; updated_at: string
  author: { name: string } | null
  category: { name: string } | null
}
type WorkRow = {
  id: string; title: string | null; summary: string | null; slug: string | null
  hero_url: string | null; body_problem: string | null; body_solution: string | null
  body_result: string | null; tech_tags: string[] | null; status: string; updated_at: string
  creator: { name: string } | null
  category: { name: string } | null
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  if (!(await requireAdmin())) return <Forbidden />

  const { type, id } = await params
  if ((type !== 'insight' && type !== 'work') || !UUID.test(id)) return <NotFound />

  const supabase = await createClient()

  if (type === 'insight') {
    const { data } = await supabase
      .from('insights')
      .select('id, title, excerpt, body_html, thumb_url, slug, status, updated_at, author:builders(name), category:categories(name)')
      .eq('id', id).maybeSingle()
    const row = data as unknown as InsightRow | null
    if (!row) return <NotFound />

    return (
      <>
        <Head kind="Insight" row={{ title: row.title, author: row.author?.name ?? null, status: row.status, slug: row.slug, category: row.category?.name ?? null }} />

        <article className="rv-preview">
          {row.thumb_url && <img className="rv-hero" src={row.thumb_url} alt="" />}
          <h1>{row.title || '(제목 없음)'}</h1>
          {row.excerpt && <p className="rv-lede">{row.excerpt}</p>}
          {/* 저장 시 서버에서 정제된 HTML 이다 (lib/sanitize.ts) */}
          <div className="rv-body" dangerouslySetInnerHTML={{ __html: row.body_html ?? '' }} />
        </article>

        <ReviewBar kind="insight" id={row.id} title={row.title || '(제목 없음)'} />
      </>
    )
  }

  const { data } = await supabase
    .from('works')
    .select('id, title, summary, slug, hero_url, body_problem, body_solution, body_result, tech_tags, status, updated_at, creator:builders(name), category:categories(name)')
    .eq('id', id).maybeSingle()
  const row = data as unknown as WorkRow | null
  if (!row) return <NotFound />

  return (
    <>
      <Head kind="Work" row={{ title: row.title, author: row.creator?.name ?? null, status: row.status, slug: row.slug, category: row.category?.name ?? null }} />

      <article className="rv-preview">
        {row.hero_url && <img className="rv-hero" src={row.hero_url} alt="" />}
        <h1>{row.title || '(제목 없음)'}</h1>
        {row.summary && <p className="rv-lede">{row.summary}</p>}

        {row.tech_tags && row.tech_tags.length > 0 && (
          <p className="rv-tags">{row.tech_tags.map(t => <span key={t}>{t}</span>)}</p>
        )}

        <div className="rv-body">
          <h2>문제</h2><div dangerouslySetInnerHTML={{ __html: row.body_problem ?? '' }} />
          <h2>해결</h2><div dangerouslySetInnerHTML={{ __html: row.body_solution ?? '' }} />
          <h2>결과</h2><div dangerouslySetInnerHTML={{ __html: row.body_result ?? '' }} />
        </div>
      </article>

      <ReviewBar kind="work" id={row.id} title={row.title || '(제목 없음)'} />
    </>
  )
}

function Head({
  kind, row,
}: {
  kind: string
  row: { title: string | null; author: string | null; status: string; slug: string | null; category: string | null }
}) {
  return (
    <div className="rv-head">
      <Link className="adm-manage" href="/admin/approvals">← 승인 대기</Link>
      <span className="adm-badge" data-s="pending">{kind}</span>
      <b>{row.title || '(제목 없음)'}</b>
      <span className="adm-dim">
        {row.author ?? '—'}
        {row.category ? ` · ${row.category}` : ''}
        {row.slug ? ` · /${kind.toLowerCase()}/${row.slug}` : ' · 슬러그 없음'}
      </span>
    </div>
  )
}

function NotFound() {
  return (
    <>
      <h1 className="adm-title">항목을 찾을 수 없습니다</h1>
      <div className="adm-card">
        <div className="adm-empty">
          <p className="adm-dim">이미 처리되었거나 주소가 잘못되었습니다.</p>
          <Link className="adm-btn adm-btn--ghost" href="/admin/approvals">승인 대기로</Link>
        </div>
      </div>
    </>
  )
}
