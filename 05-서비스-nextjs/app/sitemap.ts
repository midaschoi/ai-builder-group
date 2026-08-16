import type { MetadataRoute } from 'next'
import { SITE_URL } from './_meta'
import { getCategories, getInsights, getWorks } from '@/lib/content'

/* 사이트맵이 없으면 색인은 링크를 타고 들어오는 만큼만 된다.

   고정 라우트는 손으로 적는다 — 파일 시스템을 훑으면 목업용 라우트까지 딸려 들어간다.
   발행 콘텐츠는 DB 에서 가져온다. 관리자에서 발행하면 CONTENT_TAG 로 이 캐시도 함께 비워져
   사이트맵이 목록·상세와 같은 시점에 갱신된다.

   제외:
   · /image-guide          내부 제작 문서. 페이지 자체도 noindex 다.
   · /submit               문의 접수 완료 화면. 검색으로 들어올 수 있는 주소가 아니다.
   · /work-detail          시안용 고정 1장. 실주소는 /work/[slug] 다 —
   · /insight-detail       둘 다 넣으면 같은 내용이 두 주소로 색인된다 (SR-02 중복 0).

   priority 는 구글이 무시한 지 오래지만 다른 크롤러가 참고하므로 남겨 둔다. */
const ROUTES: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, freq: 'weekly' },
  { path: '/work', priority: 0.9, freq: 'weekly' },
  { path: '/builder', priority: 0.7, freq: 'monthly' },
  { path: '/insight', priority: 0.8, freq: 'weekly' },
  { path: '/content', priority: 0.8, freq: 'weekly' },
  { path: '/faq', priority: 0.7, freq: 'monthly' },
  { path: '/contact', priority: 0.9, freq: 'monthly' },
  { path: '/privacy', priority: 0.3, freq: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [works, insights, categories] = await Promise.all([
    getWorks(), getInsights(), getCategories('insight'),
  ])

  /* lastModified 를 빌드 시각으로 두면 내용이 그대로여도 배포마다 바뀐다.
     크롤러가 "또 안 바뀌었네"를 반복해서 배우면 신호가 무뎌지므로 고정 라우트에는 넣지 않는다.
     발행 콘텐츠는 실제로 바뀐 시점을 알고 있으므로 넣는다. */
  const fixed = ROUTES.map(r => ({
    url: new URL(r.path, SITE_URL).toString(),
    changeFrequency: r.freq,
    priority: r.priority,
  }))

  const catPages = categories.map(c => ({
    url: new URL(`/insight/${c.slug}`, SITE_URL).toString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const workPages = works.map(w => ({
    url: new URL(`/work/${w.slug}`, SITE_URL).toString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const insightPages = insights.map(a => ({
    url: new URL(`/insight/${a.slug}`, SITE_URL).toString(),
    lastModified: a.published_at ? new Date(a.published_at) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...fixed, ...workPages, ...catPages, ...insightPages]
}
