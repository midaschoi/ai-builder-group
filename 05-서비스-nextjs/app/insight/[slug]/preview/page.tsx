import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { previewInsight } from '@/lib/preview'
import PreviewBar from '@/components/PreviewBar'
import '../../../insight-detail/insight-detail.css'
import InsightArticle from '../view'

/* FR-A07-02 — 발행 전 미리보기. 근거는 app/work/[slug]/preview/page.tsx 주석과 같다. */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '미리보기 — Insight',
  robots: { index: false, follow: false },
}

export default async function InsightPreviewPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const draft = await previewInsight(slug)
  if (!draft) notFound()

  return (
    <>
      <PreviewBar status={draft.status} editHref={`/admin/insight/${draft.post.id}`} />
      {/* 관련 글은 발행분끼리만 의미가 있다 — 미리보기에서는 비운다 */}
      <InsightArticle post={draft.post} related={[]} />
    </>
  )
}
