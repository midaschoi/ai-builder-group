import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { pageMeta } from '@/app/_meta'
import { getWork, getWorks, getRedirect } from '@/lib/content'
import { ArticleLd, BreadcrumbLd } from '@/components/JsonLd'
import PreviewBar from '@/components/PreviewBar'
import { previewWork } from '@/lib/preview'
import '../../work-detail/work-detail.css'
import WorkArticle from './view'

/* P-03 Work 상세 `/work/[slug]`.

   마크업은 `/work-detail` 시안을 그대로 가져왔고 데이터만 DB 에서 온다.
   시안 쪽은 손대지 않고 남겨 둔다 — 원작자 파일이고, 디자인 참조로 계속 쓴다. */

/* 발행된 것만 미리 만들어 두고, 그 뒤에 발행된 글은 요청이 오면 그때 만든다.
   false 로 두면 새 글이 배포 전까지 404 가 된다. */
export const dynamicParams = true
export const revalidate = 300

export async function generateStaticParams() {
  return (await getWorks()).map(w => ({ slug: w.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const work = await getWork(slug)
  if (!work) return pageMeta({ title: 'Work — AI 빌더 그룹', path: `/work/${slug}` })

  /* 비우면 제목·개요를 쓴다 (FR-A03-06 의 fallback 규칙을 Work 에도 그대로 적용) */
  return pageMeta({
    title: `${work.seo_title || work.title} — Work`,
    description: work.seo_description || work.summary || undefined,
    path: `/work/${slug}`,
  })
}

export default async function WorkDetailPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const work = await getWork(slug)

  if (!work) {
    /* 발행 전 미리보기 (FR-A07-02). 로그인한 사람에게만 보인다 — RLS 가 판정한다.
       ⚠ 여기서만 쿠키를 만진다. 발행분은 위에서 이미 돌아갔으므로 SSG 가 깨지지 않는다. */
    const draft = await previewWork(slug)
    if (draft) {
      return (
        <>
          <PreviewBar status={draft.status} editHref={`/admin/work/${draft.work.id}`} />
          <WorkArticle work={draft.work} />
        </>
      )
    }

    /* 슬러그가 바뀌었거나 보관된 글이면 새 주소로 넘긴다 (SR-06 · DR-08).
       ⚠ 미들웨어가 아니라 여기서 찾는다 — 정상 경로에는 비용이 0 이다.
       ⚠ 실제 응답은 301 이 아니라 308 이다. Next 의 permanentRedirect 가 308 을 쓴다
         (node_modules/next/dist/docs/…/redirect.md §Why does redirect use 307 and 308).
         301 은 브라우저가 POST 를 GET 으로 바꿔버리는 문제가 있어 308 이 그 자리를 대신한다.
         검색엔진은 둘을 같게 취급한다. PRD 문구는 '301' 이라 정정 대상이다 (백로그 §1.7). */
    const to = await getRedirect(`/work/${slug}`)
    if (to) permanentRedirect(to)
    notFound()
  }

  return (
    <>
      {/* SR-04 — 리치결과용. 화면에는 아무것도 그리지 않는다 */}
      <ArticleLd
        headline={work.title}
        description={work.seo_description || work.summary}
        image={work.og_image_url || work.hero_url}
        published={work.published_at}
        modified={work.updated_at}
        author={work.builders[0]?.name}
        path={`/work/${slug}`}
      />
      <BreadcrumbLd trail={[
        { name: 'Work', path: '/work' },
        { name: work.title, path: `/work/${slug}` },
      ]} />
      <WorkArticle work={work} />
    </>
  )
}
