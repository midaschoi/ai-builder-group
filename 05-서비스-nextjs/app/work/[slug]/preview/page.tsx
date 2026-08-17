import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { previewWork } from '@/lib/preview'
import PreviewBar from '@/components/PreviewBar'
import '../../../work-detail/work-detail.css'
import WorkArticle from '../view'

/* FR-A07-02 — 발행 전 미리보기.

   ⚠ 왜 `/work/[slug]` 안에서 처리하지 않고 하위 경로로 뺐는가 —
     `[slug]` 는 generateStaticParams 를 쓰는 캐시 렌더 라우트다. 그 안에서 cookies() 를
     건드리면 DYNAMIC_SERVER_USAGE 로 500 이 난다. 실제로 그렇게 만들었다가
     발행분에서 못 찾는 주소가 전부 500 이 됐다 (404 여야 한다).
     여기만 force-dynamic 으로 두면 공개 상세는 SSG 를 유지한다 (SR-01).

   ⛔ 화면은 공개 상세와 **같은 컴포넌트**다. 공개 레이아웃(GNB·푸터) 안에서 열리므로
     "공개 화면과 동일한 미리보기" 가 말 그대로 성립한다.

   ⚠ 권한 판정을 여기서 하지 않는다. previewWork() 가 쿠키 클라이언트를 쓰므로 RLS 가 건다 —
     빌더는 자기 것만, 관리자는 전부, 비로그인은 404. */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '미리보기 — Work',
  robots: { index: false, follow: false },
}

export default async function WorkPreviewPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const draft = await previewWork(slug)
  if (!draft) notFound()

  return (
    <>
      <PreviewBar status={draft.status} editHref={`/admin/work/${draft.work.id}`} />
      <WorkArticle work={draft.work} />
    </>
  )
}
