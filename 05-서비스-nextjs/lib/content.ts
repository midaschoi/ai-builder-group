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


/* ══════════════════════════════════════════════════════════════════
   0006 — 공개 웹에 하드코딩돼 있던 것들
   ══════════════════════════════════════════════════════════════════ */

export type BuilderCard = {
  slug: string
  name: string
  roleLabel: string
  oneLiner: string
  avatarUrl: string | null
  stack: string[]
  badge: string | null
  /** work_builders 를 센 값. 저장하지 않는다 — 저장하면 발행마다 손으로 맞춰야 한다 */
  workCount: number
}

export type BuilderProfile = BuilderCard & {
  bio: string
  focus: string
  principles: { title: string; body: string }[]
  linkLabel: string | null
  linkUrl: string | null
  /** 참여한 발행 프로젝트 */
  works: { slug: string; title: string; summary: string; thumb: string | null; category: string; year: string }[]
}

const BUILDER_FIELDS =
  'id, slug, name, role_label, one_liner, avatar_url, stack, badge, bio, focus,' +
  ' principles, link_label, link_url, sort'

/* eslint-disable @typescript-eslint/no-explicit-any */
function toBuilderCard(r: any, workCount: number): BuilderCard {
  return {
    slug: r.slug,
    name: r.name,
    roleLabel: r.role_label ?? '',
    oneLiner: r.one_liner ?? '',
    avatarUrl: r.avatar_url ?? null,
    stack: r.stack ?? [],
    badge: r.badge ?? null,
    workCount,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** 공개 목록에 쓰는 빌더 카드. 회수된 계정은 나가지 않는다 */
export const getBuilders = unstable_cache(
  async (): Promise<BuilderCard[]> => {
    if (!SUPABASE_READY) return []
    const db = createPublicClient()
    const [{ data }, { data: joins }] = await Promise.all([
      db.from('builders').select(BUILDER_FIELDS).eq('is_active', true).order('sort').order('name'),
      db.from('work_builders').select('builder_id'),
    ])
    const count = new Map<string, number>()
    for (const j of joins ?? []) {
      const id = (j as { builder_id: string }).builder_id
      count.set(id, (count.get(id) ?? 0) + 1)
    }
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => toBuilderCard(r, count.get(r.id) ?? 0))
  },
  ['public-builders-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)

export const getBuilder = unstable_cache(
  async (slug: string): Promise<BuilderProfile | null> => {
    if (!SUPABASE_READY) return null
    const db = createPublicClient()
    const { data } = await db.from('builders').select(BUILDER_FIELDS)
      .eq('slug', slug).eq('is_active', true).maybeSingle()
    if (!data) return null

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const r = data as any

    /* 참여한 발행 프로젝트. 조인 너머라 id 를 먼저 모은다 */
    const { data: joins } = await db.from('work_builders').select('work_id').eq('builder_id', r.id)
    const ids = (joins ?? []).map(j => (j as { work_id: string }).work_id)

    let works: BuilderProfile['works'] = []
    if (ids.length > 0) {
      const { data: rows } = await db.from('works')
        .select('slug, title, summary, thumb_url, hero_url, published_at, category:categories(name)')
        .in('id', ids).eq('status', 'published').not('slug', 'is', null)
        .order('published_at', { ascending: false })
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      works = (rows ?? []).map((w: any) => ({
        slug: w.slug, title: w.title ?? '', summary: w.summary ?? '',
        thumb: w.thumb_url || w.hero_url || null,
        category: w.category?.name ?? '',
        year: w.published_at ? String(new Date(w.published_at).getFullYear()) : '',
      }))
    }

    return {
      ...toBuilderCard(r, works.length),
      bio: r.bio ?? '',
      focus: r.focus ?? '',
      principles: Array.isArray(r.principles) ? r.principles : [],
      linkLabel: r.link_label ?? null,
      linkUrl: r.link_url ?? null,
      works,
    }
  },
  ['public-builder-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)


/* ── FAQ (P-07) ─────────────────────────────────────────────────── */

export type FaqItem = { id: string; question: string; answer: string; showOnHome: boolean }
export type FaqTopic = { slug: string; label: string; items: FaqItem[] }

export const getFaq = unstable_cache(
  async (): Promise<FaqTopic[]> => {
    if (!SUPABASE_READY) return []
    const db = createPublicClient()
    const [{ data: topics }, { data: items }] = await Promise.all([
      db.from('faq_topics').select('id, slug, label').order('sort'),
      db.from('faqs').select('id, topic_id, question, answer, show_on_home')
        .eq('is_active', true).order('sort'),
    ])
    return (topics ?? []).map(t => ({
      slug: (t as { slug: string }).slug,
      label: (t as { label: string }).label,
      items: (items ?? [])
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .filter((i: any) => i.topic_id === (t as { id: string }).id)
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .map((i: any) => ({ id: i.id, question: i.question, answer: i.answer, showOnHome: i.show_on_home })),
    }))
  },
  ['public-faq-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)


/* ── 유튜브 (P-06 · IR-08) ──────────────────────────────────────── */

export type VideoItem = {
  id: string; youtubeId: string; title: string; subtitle: string
  channel: string; duration: string
}
export type VideoChannel = { slug: string; name: string; url: string }

export const getVideos = unstable_cache(
  async (): Promise<{ videos: VideoItem[]; channels: VideoChannel[] }> => {
    if (!SUPABASE_READY) return { videos: [], channels: [] }
    const db = createPublicClient()
    const [{ data: v }, { data: c }] = await Promise.all([
      db.from('videos').select('id, youtube_id, title, subtitle, channel_name, duration')
        .eq('is_active', true).order('sort'),
      db.from('video_channels').select('slug, name, url').order('sort'),
    ])
    return {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      videos: (v ?? []).map((r: any) => ({
        id: r.id, youtubeId: r.youtube_id, title: r.title,
        subtitle: r.subtitle ?? '', channel: r.channel_name, duration: r.duration ?? '',
      })),
      channels: (c ?? []) as VideoChannel[],
    }
  },
  ['public-videos-v1'], { tags: [CONTENT_TAG], revalidate: TTL },
)
