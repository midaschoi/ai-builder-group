import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { pageMeta } from '@/app/_meta'
import { getCategories, getInsight, getInsights, getRedirect } from '@/lib/content'
import { ArticleLd, BreadcrumbLd } from '@/components/JsonLd'
import '../insight.css'
import '../../insight-detail/insight-detail.css'
import InsightView from '../view'
import InsightArticle from './view'

/* P-04 카테고리 목록과 P-05 글 상세를 **한 라우트에서** 해석한다.

   ⚠ IA §1 이 `/insight/[category]` 와 `/insight/[slug]` 를 같은 깊이에 두고 있다.
     Next 는 같은 자리에 동적 세그먼트를 둘 둘 수 없으므로 여기서 순서대로 본다:
       ① 카테고리 슬러그인가 → 그 카테고리 목록
       ② 글 슬러그인가       → 글 상세
       ③ 옮겨간 주소인가     → 301
       ④ 아니면 404
     ①이 먼저라 글 슬러그가 카테고리 슬러그와 겹치면 글이 영영 가려진다.
     그래서 A-03 저장 시 카테고리 슬러그와 겹치는 값을 거부한다 (admin insight actions). */

export const dynamicParams = true
export const revalidate = 300

export async function generateStaticParams() {
  const [cats, posts] = await Promise.all([getCategories('insight'), getInsights()])
  return [...cats.map(c => ({ slug: c.slug })), ...posts.map(p => ({ slug: p.slug }))]
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params

  const cat = (await getCategories('insight')).find(c => c.slug === slug)
  if (cat) {
    return pageMeta({
      title: `${cat.name} — Insight`,
      description: `${cat.name} 카테고리의 인사이트 글 모음.`,
      path: `/insight/${slug}`,
    })
  }

  const post = await getInsight(slug)
  if (!post) return pageMeta({ title: 'Insight — AI 빌더 그룹', path: `/insight/${slug}` })

  return pageMeta({
    title: `${post.seo_title || post.title} — Insight`,
    description: post.seo_description || post.excerpt || undefined,
    path: `/insight/${slug}`,
  })
}

export default async function InsightSlugPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  /* ① 카테고리 */
  const categories = await getCategories('insight')
  if (categories.some(c => c.slug === slug)) {
    const all = await getInsights()
    const counts: Record<string, number> = {}
    for (const a of all) counts[a.category_slug] = (counts[a.category_slug] ?? 0) + 1

    return (
      <InsightView
        articles={all.filter(a => a.category_slug === slug)}
        categories={categories}
        counts={counts}
        active={slug}
      />
    )
  }

  /* ② 글 */
  const post = await getInsight(slug)
  if (post) {
    const related = (await getInsights())
      .filter(a => a.slug !== slug && a.category_slug === post.category_slug)
      .slice(0, 2)
    return (
      <>
        <ArticleLd
          headline={post.title}
          description={post.seo_description || post.excerpt}
          image={post.thumb_url}
          published={post.published_at}
          modified={post.updated_at}
          author={post.author}
          path={`/insight/${slug}`}
        />
        <BreadcrumbLd trail={[
          { name: 'Insight', path: '/insight' },
          ...(post.category_slug
            ? [{ name: post.category_name, path: `/insight/${post.category_slug}` }]
            : []),
          { name: post.title, path: `/insight/${slug}` },
        ]} />
        <InsightArticle post={post} related={related} />
      </>
    )
  }

  /* ③ 옮겨간 주소 (SR-06 · DR-08) */
  const to = await getRedirect(`/insight/${slug}`)
  if (to) permanentRedirect(to)

  notFound()
}
