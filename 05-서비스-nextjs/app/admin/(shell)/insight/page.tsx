import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import ContentList, { PAGE_SIZE, type ListRow } from '../content-list'

/* A-02 Insight 관리 — 로그인 후 첫 화면 (FR-A00-03).
   대시보드는 만들지 않는다 (E10). 여기가 곧 작업 큐다.

   화면 자체는 A-04 와 공유한다 (../content-list.tsx). 여기는 데이터를 읽는 일만 한다. */

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  title: string | null
  status: string
  updated_at: string
  thumb_url: string | null
  slug: string | null
  category: { name: string } | null
  author: { name: string } | null
}

export default async function InsightListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const { status = '', q = '', page = '1' } = await searchParams
  const me = (await getCurrentBuilder())!          /* 셸 레이아웃이 이미 보장한다 */
  const isAdmin = me.role === 'admin'
  const supabase = await createClient()

  const current = Math.max(1, Number(page) || 1)

  /* ⚠ RLS 의 "published 는 누구나 읽기" 정책 때문에, 필터를 걸지 않으면 빌더에게
     남의 발행 글까지 보인다. 관리 목록은 본인 것만이므로 여기서 명시적으로 좁힌다
     (FR-A02-01). 응답 본문에 남의 글이 들어가지 않아야 한다. */
  const scope = () => {
    let query = supabase.from('insights').select('status', { count: 'exact' })
    if (!isAdmin) query = query.eq('author_id', me.id)
    return query
  }

  /* 탭 카운트 — 한 번에 받아서 세면 쿼리가 하나로 끝난다 */
  const { data: allRows } = await scope()
  const counts = (allRows ?? []).reduce<Record<string, number>>((acc, r) => {
    const s = (r as { status: string }).status
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  /* 전체 탭은 보관을 뺀 수다 (A-02 §상태 탭) */
  const totalAll = (allRows ?? []).length - (counts.archived ?? 0)

  let list = supabase
    .from('insights')
    .select('id, title, slug, status, updated_at, thumb_url, category:categories(name), author:builders(name)',
      { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((current - 1) * PAGE_SIZE, current * PAGE_SIZE - 1)

  if (!isAdmin) list = list.eq('author_id', me.id)
  if (status) list = list.eq('status', status)
  else list = list.neq('status', 'archived')
  if (q) list = list.ilike('title', `%${q}%`)

  const { data, count } = await list
  const source = (data ?? []) as unknown as Row[]

  const rows: ListRow[] = source.map(r => ({
    id: r.id,
    title: r.title,
    status: r.status,
    updated_at: r.updated_at,
    thumb_url: r.thumb_url,
    slug: r.slug,
    cells: isAdmin
      ? [r.category?.name ?? '—', r.author?.name ?? '—']
      : [r.category?.name ?? '—'],
  }))

  return (
    <ContentList
      kind="insight"
      base="/admin/insight"
      heading="Insight 관리"
      newHref="/admin/insight/new"
      newLabel="+ 새 글 작성"
      searchPlaceholder="제목으로 검색"
      headers={isAdmin ? ['카테고리', '작성자'] : ['카테고리']}
      rows={rows}
      counts={counts}
      totalAll={totalAll}
      total={count ?? 0}
      status={status}
      q={q}
      page={current}
      isAdmin={isAdmin}
      empty={{
        all: '아직 등록된 글이 없습니다',
        mine: '아직 작성한 글이 없습니다',
        filtered: '조건에 맞는 글이 없습니다',
      }}
      notice={
        <>
          {isAdmin && (counts.pending ?? 0) > 0 && (
            <p className="adm-notice">
              승인을 기다리는 항목이 {counts.pending}건 있습니다
              <Link href="/admin/approvals">확인하러 가기 →</Link>
            </p>
          )}
          {!isAdmin && <p className="adm-dim">내가 쓴 글만 표시됩니다.</p>}
        </>
      }
    />
  )
}
