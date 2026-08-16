import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'

/* A-02 Insight 관리 — 로그인 후 첫 화면 (FR-A00-03).
   대시보드는 만들지 않는다 (E10). 여기가 곧 작업 큐다. */

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

const STATUSES = [
  { key: '',          label: '전체' },
  { key: 'draft',     label: '초안' },
  { key: 'pending',   label: '승인대기' },
  { key: 'published', label: '발행' },
  /* 0건이어도 탭을 숨기지 않는다 — 반려가 사라진 줄 알게 된다 (A-02 §상태 탭) */
  { key: 'rejected',  label: '반려' },
  { key: 'archived',  label: '보관', adminOnly: true },
] as const

const LABEL: Record<string, string> = {
  draft: '초안', pending: '승인대기', published: '발행', rejected: '반려', archived: '보관',
}

type Row = {
  id: string
  title: string | null
  status: string
  updated_at: string
  thumb_url: string | null
  category: { name: string } | null
  author: { name: string } | null
}

/** `08-14 · 3일 전` — 상대시간만 쓰면 승인 업무에서 정확한 날짜를 못 본다 (A-00 §3.2) */
function when(iso: string) {
  const d = new Date(iso)
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  const rel = days <= 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`
  return `${md} · ${rel}`
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
    acc[(r as { status: string }).status] = (acc[(r as { status: string }).status] ?? 0) + 1
    return acc
  }, {})
  /* 전체 탭은 보관을 뺀 수다 (A-02 §상태 탭) */
  const totalAll = (allRows ?? []).length - (counts.archived ?? 0)

  let list = supabase
    .from('insights')
    .select('id, title, status, updated_at, thumb_url, category:categories(name), author:builders(name)',
      { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((current - 1) * PAGE_SIZE, current * PAGE_SIZE - 1)

  if (!isAdmin) list = list.eq('author_id', me.id)
  if (status) list = list.eq('status', status)
  else list = list.neq('status', 'archived')
  if (q) list = list.ilike('title', `%${q}%`)

  const { data, count } = await list
  const rows = (data ?? []) as unknown as Row[]
  const total = count ?? 0
  const from = total === 0 ? 0 : (current - 1) * PAGE_SIZE + 1
  const to = Math.min(current * PAGE_SIZE, total)

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams()
    const merged = { status, q, ...patch }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    const s = p.toString()
    return s ? `/admin/insight?${s}` : '/admin/insight'
  }

  const filtered = Boolean(status || q)

  return (
    <>
      <h1 className="adm-title">Insight 관리</h1>

      {isAdmin && (counts.pending ?? 0) > 0 && (
        <p className="adm-notice">
          승인을 기다리는 항목이 {counts.pending}건 있습니다
          <Link href="/admin/approvals">확인하러 가기 →</Link>
        </p>
      )}

      {!isAdmin && <p className="adm-dim">내가 쓴 글만 표시됩니다.</p>}

      <div className="adm-tabs">
        {STATUSES.filter(s => !('adminOnly' in s && s.adminOnly) || isAdmin).map(s => (
          <Link
            key={s.key || 'all'}
            href={href({ status: s.key, page: '' })}
            aria-current={status === s.key ? 'page' : undefined}
          >
            {s.label}<b>{s.key ? (counts[s.key] ?? 0) : totalAll}</b>
          </Link>
        ))}
      </div>

      <form className="adm-filters" action="/admin/insight">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          className="adm-input adm-grow" type="search" name="q" defaultValue={q}
          placeholder="제목으로 검색" aria-label="제목으로 검색"
        />
        <button className="adm-btn adm-btn--ghost" type="submit">검색</button>
        {filtered && <Link className="adm-btn adm-btn--ghost" href="/admin/insight">필터 초기화</Link>}
        <Link className="adm-btn" href="/admin/insight/new">+ 새 글 작성</Link>
      </form>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <p>
              {filtered
                ? '조건에 맞는 글이 없습니다'
                : isAdmin ? '아직 등록된 글이 없습니다' : '아직 작성한 글이 없습니다'}
            </p>
            {filtered
              ? <Link className="adm-btn adm-btn--ghost" href="/admin/insight">필터 초기화</Link>
              : <Link className="adm-btn" href="/admin/insight/new">+ 새 글 작성</Link>}
          </div>
        ) : (
          <>
            <div className="adm-scroll">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>제목</th>
                    <th>카테고리</th>
                    {isAdmin && <th>작성자</th>}
                    <th>상태</th>
                    <th>수정일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="adm-cell">
                          {r.thumb_url
                            ? <img className="adm-thumb" src={r.thumb_url} alt="" width={40} height={40} />
                            : <span className="adm-thumb" data-empty="" aria-hidden="true" />}
                          {/* 행 전체가 링크다 — 작은 버튼을 조준하게 만들지 않는다 */}
                          <Link className="adm-name" href={`/admin/insight/${r.id}`} data-none={r.title ? undefined : ''}>
                            {r.title || '(제목 없음)'}
                          </Link>
                        </div>
                      </td>
                      <td className="adm-dim">{r.category?.name ?? '—'}</td>
                      {isAdmin && <td className="adm-dim">{r.author?.name ?? '—'}</td>}
                      <td><span className="adm-badge" data-s={r.status}>{LABEL[r.status] ?? r.status}</span></td>
                      <td className="adm-dim adm-num">{when(r.updated_at)}</td>
                      <td>
                        <Link className="adm-manage" href={`/admin/insight/${r.id}`}>관리 ▾</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="adm-tfoot">
              <span className="adm-num">{total}건 중 {from}-{to}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                {current > 1 && <Link className="adm-manage" href={href({ page: String(current - 1) })}>이전</Link>}
                {to < total && <Link className="adm-manage" href={href({ page: String(current + 1) })}>다음</Link>}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  )
}
