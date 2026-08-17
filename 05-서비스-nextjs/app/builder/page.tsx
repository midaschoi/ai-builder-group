import type { Metadata } from 'next'
import { pageMeta } from '@/app/_meta'
import { getBuilder, getBuilders } from '@/lib/content'
import './builder.css'
import BuilderView, { type Other, type Profile } from './view'

/* 빌더 프로필 `/builder?b=<슬러그>`.

   ⚠ IA §1 은 2차에 `/builders/[slug]` 를 요구한다. 1차는 쿼리스트링 그대로 두되
     데이터는 이미 DB 에서 온다 — 2차에 라우트만 바꾸면 된다.

   ⚠ 전에는 슬러그를 못 찾으면 화면이 조용히 "조쉬" 를 보여줬다 (view.tsx 의 `|| BUILDERS.josh`).
     실제로 발행한 프로젝트의 참여 빌더를 눌러도 엉뚱한 사람이 떴다. DB 값을 먼저 본다. */

export const revalidate = 300

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ b?: string }> },
): Promise<Metadata> {
  const { b = '' } = await searchParams
  const found = b ? await getBuilder(b) : null

  return pageMeta({
    title: found ? `${found.name} — 빌더 프로필` : '빌더 프로필 — AI 빌더 그룹',
    description: found ? (found.oneLiner || found.bio || undefined) : undefined,
    /* 쿼리는 canonical 에 넣지 않는다 — 같은 문서가 여러 주소로 색인된다 */
    path: '/builder',
  })
}

export default async function BuilderPage(
  { searchParams }: { searchParams: Promise<{ b?: string }> },
) {
  const { b = '' } = await searchParams

  const [found, all] = await Promise.all([
    b ? getBuilder(b) : Promise.resolve(null),
    getBuilders(),
  ])

  /* 등록된 빌더가 없으면 props 를 넘기지 않는다 — view 가 기존 하드코딩으로 그린다 */
  const profile: Profile | null = found
    ? {
      no: `B—${String(all.findIndex(x => x.slug === found.slug) + 1).padStart(3, '0')}`,
      name: found.name,
      fname: found.name.replace(/^빌더\s*/, ''),
      lv: found.badge ?? '',
      lead: (found.badge ?? '').includes('✳'),
      fresh: (found.badge ?? '').toUpperCase() === 'NEW',
      role: found.roleLabel,
      img: found.avatarUrl ?? '',
      bio: found.bio || found.oneLiner,
      focus: found.focus,
      stack: found.stack,
      done: found.workCount,
      principles: found.principles,
      extra: found.linkLabel && found.linkUrl
        ? { label: found.linkLabel, href: found.linkUrl }
        : null,
      works: found.works.map(w => ({
        href: `/work/${w.slug}`,
        img: w.thumb ?? '',
        tag: w.category,
        yr: w.year,
        title: w.title,
        desc: w.summary,
      })),
    }
    : null

  const others: Other[] = all
    .filter(x => x.slug !== b)
    .map(x => ({ slug: x.slug, name: x.name, role: x.roleLabel, img: x.avatarUrl ?? '' }))

  return <BuilderView profile={profile} others={profile ? others : []} />
}
