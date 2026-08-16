import { unstable_cache } from 'next/cache'
import { createPublicClient, SUPABASE_READY } from './supabase'

/* 공개 웹이 읽는 콘텐츠. 관리자에서 발행한 것만 나간다.

   ⚠ createPublicClient() 를 쓴다 — 쿠키를 만지지 않는 클라이언트다.
     unstable_cache 안에서는 cookies() 를 호출할 수 없어서, 일반 createClient() 를 넣으면
     캐시가 통째로 터진다. 캐시를 포기하면 공개 11페이지가 전부 동적 렌더로 바뀐다(SSG 포기).

   ⚠ select * 를 쓰지 않는다 (DR-03). 컬럼을 명시해 비공개 필드가 딸려 나가지 않게 한다.

   태그 정책 — 관리자가 발행하면 revalidateTag(CONTENT_TAG) 로 이 캐시를 통째로 비운다.
   경로별로 나누면 목록·상세·사이트맵 중 하나를 빠뜨려 "발행했는데 안 보인다"가 생긴다. */

export const CONTENT_TAG = 'public-content'
const TTL = 300   /* 관리자 발행은 태그로 즉시 비우므로, 이 값은 안전망일 뿐이다 */

export type WorkCard = {
  id: string
  slug: string
  title: string
  summary: string
  category_slug: string
  category_name: string
  thumb_url: string | null
  year: string
  members: string[]
}

export type WorkDetail = WorkCard & {
  hero_url: string | null
  og_image_url: string | null
  body_problem: string
  body_solution: string
  body_result: string
  tech_tags: string[]
  period_label: string | null
  scope_label: string | null
  result_url: string | null
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  updated_at: string | null
  builders: { name: string; slug: string; avatar_url: string | null; role_label: string | null }[]
}

export type InsightCard = {
  id: string
  slug: string
  title: string
  excerpt: string
  category_slug: string
  category_name: string
  thumb_url: string | null
  author: string
  published_at: string | null
}

export type InsightDetail = InsightCard & {
  body_html: string
  tags: string[]
  seo_title: string | null
  seo_description: string | null
  updated_at: string | null
}

export type Category = { slug: string; name: string }

const WORK_LIST =
  'id, slug, title, summary, thumb_url, hero_url, published_at,' +
  ' category:categories(slug, name),' +
  ' members:work_builders(sort, builder:builders(name, slug, avatar_url, role_label))'

const WORK_FULL = WORK_LIST +
  ', og_image_url, body_problem, body_solution, body_result, tech_tags,' +
  ' period_label, scope_label, result_url, seo_title, seo_description, updated_at'

const INSIGHT_LIST =
  'id, slug, title, excerpt, thumb_url, published_at,' +
  ' category:categories(slug, name), author:builders(name)'

const INSIGHT_FULL = INSIGHT_LIST + ', body_html, tags, seo_title, seo_description, updated_at'

type RawMember = { sort: number; builder: { name: string; slug: string; avatar_url: string | null; role_label: string | null } | null }

function sortedMembers(list: RawMember[] | null | undefined) {
  return [...(list ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map(m => m.builder)
    .filter((b): b is NonNullable<RawMember['builder']> => Boolean(b))
}

function year(iso: string | null) {
  return iso ? String(new Date(iso).getFullYear()) : ''
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toWorkCard(r: any): WorkCard {
  const people = sortedMembers(r.members)
  return {
    id: r.id,
    slug: r.slug,
    title: r.title ?? '',
    summary: r.summary ?? '',
    category_slug: r.category?.slug ?? '',
    category_name: r.category?.name ?? '',
    /* 썸네일을 비우면 히어로를 쓴다 (A-05 §이미지) — 읽는 쪽에서 대체한다 */
    thumb_url: r.thumb_url || r.hero_url || null,
    year: year(r.published_at),
    members: people.map(b => b.name),
  }
}

function toInsightCard(r: any): InsightCard {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title ?? '',
    excerpt: r.excerpt ?? '',
    category_slug: r.category?.slug ?? '',
    category_name: r.category?.name ?? '',
    thumb_url: r.thumb_url ?? null,
    author: r.author?.name ?? '운영팀',
    published_at: r.published_at ?? null,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */


/* ── 목록 ──────────────────────────────────────────────────────────── */

export const getWorks = unstable_cache(
  async (): Promise<WorkCard[]> => {
    if (!SUPABASE_READY) return []
    const { data } = await createPublicClient()
      .from('works').select(WORK_LIST)
      .eq('status', 'published').not('slug', 'is', null)
      .order('published_at', { ascending: false })
    return (data ?? []).map(toWorkCard)
  },
  ['public-works-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)

export const getInsights = unstable_cache(
  async (): Promise<InsightCard[]> => {
    if (!SUPABASE_READY) return []
    const { data } = await createPublicClient()
      .from('insights').select(INSIGHT_LIST)
      .eq('status', 'published').not('slug', 'is', null)
      .order('published_at', { ascending: false })
    return (data ?? []).map(toInsightCard)
  },
  ['public-insights-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)

export const getCategories = unstable_cache(
  async (type: 'work' | 'insight'): Promise<Category[]> => {
    if (!SUPABASE_READY) return []
    const { data } = await createPublicClient()
      .from('categories').select('slug, name').eq('type', type).order('sort')
    return (data ?? []) as Category[]
  },
  ['public-categories-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)


/* ── 상세 ──────────────────────────────────────────────────────────── */

export const getWork = unstable_cache(
  async (slug: string): Promise<WorkDetail | null> => {
    if (!SUPABASE_READY) return null
    const { data } = await createPublicClient()
      .from('works').select(WORK_FULL)
      .eq('slug', slug).eq('status', 'published').maybeSingle()
    if (!data) return null

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const r = data as any
    return {
      ...toWorkCard(r),
      hero_url: r.hero_url ?? null,
      og_image_url: r.og_image_url ?? null,
      body_problem: r.body_problem ?? '',
      body_solution: r.body_solution ?? '',
      body_result: r.body_result ?? '',
      tech_tags: r.tech_tags ?? [],
      period_label: r.period_label ?? null,
      scope_label: r.scope_label ?? null,
      result_url: r.result_url ?? null,
      seo_title: r.seo_title ?? null,
      seo_description: r.seo_description ?? null,
      published_at: r.published_at ?? null,
      updated_at: r.updated_at ?? null,
      builders: sortedMembers(r.members),
    }
  },
  ['public-work-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)

export const getInsight = unstable_cache(
  async (slug: string): Promise<InsightDetail | null> => {
    if (!SUPABASE_READY) return null
    const { data } = await createPublicClient()
      .from('insights').select(INSIGHT_FULL)
      .eq('slug', slug).eq('status', 'published').maybeSingle()
    if (!data) return null

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const r = data as any
    return {
      ...toInsightCard(r),
      body_html: r.body_html ?? '',
      tags: r.tags ?? [],
      seo_title: r.seo_title ?? null,
      seo_description: r.seo_description ?? null,
      updated_at: r.updated_at ?? null,
    }
  },
  ['public-insight-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)


/* ── 301 리다이렉트 (SR-06 · DR-08) ────────────────────────────────── */

/* ⚠ 미들웨어에 넣지 않는다. 모든 요청마다 DB 를 한 번 더 때리게 된다.
   상세 라우트가 "그런 글 없음"으로 떨어졌을 때만 찾아보면 충분하고,
   정상 경로에는 비용이 0 이다. */
export const getRedirect = unstable_cache(
  async (fromPath: string): Promise<string | null> => {
    if (!SUPABASE_READY) return null
    const { data } = await createPublicClient()
      .from('redirects').select('to_path').eq('from_path', fromPath).maybeSingle()
    return (data as { to_path: string } | null)?.to_path ?? null
  },
  ['public-redirect-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)
