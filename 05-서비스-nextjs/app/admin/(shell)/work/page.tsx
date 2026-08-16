import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import ContentList, { PAGE_SIZE, type ListRow } from '../content-list'

/* A-04 Work 관리. 화면은 A-02 와 공유하고(../content-list.tsx) 여기는 데이터만 읽는다.

   ⚠ Insight 는 author_id 단일이라 "본인 것" 판정이 한 줄이지만, Work 는 work_builders 다대다다.
     본인 것 =  works.created_by = 나
            OR  work_builders 에 (work_id, 나) 행이 있다
     참여 빌더로만 연결된 프로젝트도 보여야 한다 — 못 보면 수정 요청을 할 수 없다 (A-04 §화면-빌더). */

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  title: string | null
  slug: string | null
  status: string
  updated_at: string
  thumb_url: string | null
  hero_url: string | null
  category: { name: string } | null
  members: { sort: number; builder: { name: string; is_active: boolean } | null }[]
}

/** `조쉬 +2` — 이름을 전부 늘어놓으면 행이 깨진다. 전체는 title 툴팁으로 준다 (A-04 §세부) */
function members(list: Row['members']) {
  const names = [...list]
    .sort((a, b) => a.sort - b.sort)
    .map(m => (m.builder ? `${m.builder.name}${m.builder.is_active ? '' : ' (비활성)'}` : null))
    .filter((n): n is string => Boolean(n))

  if (names.length === 0) return <>—</>
  return (
    <span title={names.join(', ')}>
      {names[0]}{names.length > 1 && <> +{names.length - 1}</>}
    </span>
  )
}

export default async function WorkListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const { status = '', q = '', page = '1' } = await searchParams
  const me = (await getCurrentBuilder())!
  const isAdmin = me.role === 'admin'
  const supabase = await createClient()

  const current = Math.max(1, Number(page) || 1)

  /* 빌더가 참여 빌더로 연결된 프로젝트 id — PostgREST 로는 조인 건너 OR 를 못 쓴다.
     먼저 id 를 받아 와서 or() 안에 넣는다. */
  let mineIds: string[] = []
  if (!isAdmin) {
    const { data } = await supabase
      .from('work_builders').select('work_id').eq('builder_id', me.id)
    mineIds = (data ?? []).map(r => (r as { work_id: string }).work_id)
  }
  const ownFilter = `created_by.eq.${me.id}${mineIds.length ? `,id.in.(${mineIds.join(',')})` : ''}`

  /* ⚠ A-02 와 같은 이유로 명시적으로 좁힌다. RLS 의 "published 는 누구나 읽기" 때문에
     필터가 없으면 빌더에게 남의 발행 프로젝트까지 보인다 (FR-A04-01). */
  const scope = () => {
    let query = supabase.from('works').select('status', { count: 'exact' })
    if (!isAdmin) query = query.or(ownFilter)
    return query
  }

  const { data: allRows } = await scope()
  const counts = (allRows ?? []).reduce<Record<string, number>>((acc, r) => {
    const s = (r as { status: string }).status
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const totalAll = (allRows ?? []).length - (counts.archived ?? 0)

  /* 검색 대상은 제목 · 참여 빌더 이름이다 (A-04 §세부).
     빌더 이름은 조인 테이블 너머라 ilike 로 바로 못 건다 — 이름으로 id 를 먼저 찾는다. */
  let searchIds: string[] | null = null
  if (q) {
    const { data: hit } = await supabase
      .from('work_builders')
      .select('work_id, builder:builders!inner(name)')
      .ilike('builders.name', `%${q}%`)
    searchIds = (hit ?? []).map(r => (r as unknown as { work_id: string }).work_id)
  }

  let list = supabase
    .from('works')
    .select(
      'id, title, slug, status, updated_at, thumb_url, hero_url, category:categories(name),' +
      ' members:work_builders(sort, builder:builders(name, is_active))',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .range((current - 1) * PAGE_SIZE, current * PAGE_SIZE - 1)

  if (!isAdmin) list = list.or(ownFilter)
  if (status) list = list.eq('status', status)
  else list = list.neq('status', 'archived')
  if (q) {
    list = searchIds && searchIds.length
      ? list.or(`title.ilike.%${q}%,id.in.(${searchIds.join(',')})`)
      : list.ilike('title', `%${q}%`)
  }

  const { data, count } = await list
  const source = (data ?? []) as unknown as Row[]

  const rows: ListRow[] = source.map(r => ({
    id: r.id,
    title: r.title,
    status: r.status,
    updated_at: r.updated_at,
    /* 썸네일을 비워두면 히어로를 쓴다 (A-05 §이미지) — 목록에서도 같은 규칙을 따른다 */
    thumb_url: r.thumb_url || r.hero_url,
    slug: r.slug,
    cells: [r.category?.name ?? '—', members(r.members ?? [])],
  }))

  return (
    <ContentList
      kind="work"
      base="/admin/work"
      heading="Work 관리"
      newHref="/admin/work/new"
      newLabel="+ 새 프로젝트"
      searchPlaceholder="제목·빌더 검색"
      headers={['카테고리', '참여 빌더']}
      rows={rows}
      counts={counts}
      totalAll={totalAll}
      total={count ?? 0}
      status={status}
      q={q}
      page={current}
      isAdmin={isAdmin}
      wideThumb
      empty={{
        all: '아직 등록된 프로젝트가 없습니다',
        mine: '참여한 프로젝트가 없습니다',
        filtered: '조건에 맞는 프로젝트가 없습니다',
      }}
      notice={!isAdmin ? <p className="adm-dim">내가 참여한 프로젝트만 표시됩니다.</p> : undefined}
    />
  )
}
