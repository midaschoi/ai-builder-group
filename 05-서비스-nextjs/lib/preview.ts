import { createClient } from './supabase'
import { getCurrentBuilder } from './session'
import type { InsightDetail, WorkDetail } from './content'

/* FR-A07-02 · A-03/A-05 §미리보기 — "공개 화면과 동일한 미리보기".

   따로 미리보기 화면을 만들지 않는다. **공개 라우트를 그대로 쓴다.**
   `/work/<슬러그>` 가 발행분에서 못 찾으면 여기로 와서, 로그인한 사람에게만 초안을 돌려준다.
   시안을 두 벌 유지하면 "미리보기에서는 멀쩡했는데" 가 반드시 생긴다.

   ⚠ 권한 판정을 여기서 직접 하지 않는다. 쿠키 클라이언트를 쓰므로 RLS 가 그대로 걸린다 —
     빌더는 자기 것만, 관리자는 전부 보인다. 화면과 DB 가 같은 규칙을 두 번 적지 않는다.
   ⚠ 캐시하지 않는다. 초안은 저장하자마자 확인해야 하고, unstable_cache 안에서는
     cookies() 를 부를 수도 없다. */

const WORK_FIELDS =
  'id, slug, title, summary, thumb_url, hero_url, og_image_url, published_at, updated_at,' +
  ' body_problem, body_solution, body_result, tech_tags, period_label, scope_label,' +
  ' result_url, seo_title, seo_description, status,' +
  ' category:categories(slug, name),' +
  ' members:work_builders(sort, builder:builders(name, slug, avatar_url, role_label))'

const INSIGHT_FIELDS =
  'id, slug, title, excerpt, thumb_url, published_at, updated_at, body_html, tags,' +
  ' seo_title, seo_description, status,' +
  ' category:categories(slug, name), author:builders(name)'

/* eslint-disable @typescript-eslint/no-explicit-any */
function people(list: any[] | null | undefined) {
  return [...(list ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map(m => m.builder)
    .filter(Boolean)
}
const year = (iso: string | null) => (iso ? String(new Date(iso).getFullYear()) : '')

export async function previewWork(slug: string): Promise<{ work: WorkDetail; status: string } | null> {
  if (!(await getCurrentBuilder())) return null

  const supabase = await createClient()
  const { data } = await supabase.from('works').select(WORK_FIELDS).eq('slug', slug).maybeSingle()
  if (!data) return null

  const r = data as any
  const members = people(r.members)

  return {
    status: r.status,
    work: {
      id: r.id,
      slug: r.slug,
      title: r.title ?? '',
      summary: r.summary ?? '',
      category_slug: r.category?.slug ?? '',
      category_name: r.category?.name ?? '',
      thumb_url: r.thumb_url || r.hero_url || null,
      /* 아직 발행 전이면 연도가 없다 — 올해로 보여준다. 빈 칸은 배지가 깨져 보인다 */
      year: year(r.published_at) || String(new Date().getFullYear()),
      members: members.map((b: any) => b.name),
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
      builders: members,
    },
  }
}

export async function previewInsight(slug: string): Promise<{ post: InsightDetail; status: string } | null> {
  if (!(await getCurrentBuilder())) return null

  const supabase = await createClient()
  const { data } = await supabase.from('insights').select(INSIGHT_FIELDS).eq('slug', slug).maybeSingle()
  if (!data) return null

  const r = data as any
  return {
    status: r.status,
    post: {
      id: r.id,
      slug: r.slug,
      title: r.title ?? '',
      excerpt: r.excerpt ?? '',
      category_slug: r.category?.slug ?? '',
      category_name: r.category?.name ?? '',
      thumb_url: r.thumb_url ?? null,
      author: r.author?.name ?? '운영팀',
      published_at: r.published_at ?? null,
      body_html: r.body_html ?? '',
      tags: r.tags ?? [],
      seo_title: r.seo_title ?? null,
      seo_description: r.seo_description ?? null,
      updated_at: r.updated_at ?? null,
    },
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
