import Link from 'next/link'
import RowMenu from './row-menu'
import type { Kind } from './content-actions'

/* A-02 · A-04 공용 목록.

   ⛔ 목록 화면을 두 벌 따로 짜지 않는다 (A-04 §검수 항목).
      두 벌이면 상태 탭·페이지네이션·빈 상태를 한쪽만 고치게 되고, 그때부터 두 화면이 갈라진다.
      데이터를 읽는 일은 각 page.tsx 가 하고, 여기는 "어떻게 보이는가"만 담당한다.
      컬럼이 다른 부분은 cells 로 받는다 — Insight 는 작성자, Work 는 참여 빌더가 들어온다. */

export const PAGE_SIZE = 12

export const STATUSES = [
  { key: '',          label: '전체' },
  { key: 'draft',     label: '초안' },
  { key: 'pending',   label: '승인대기' },
  { key: 'published', label: '발행' },
  /* 0건이어도 탭을 숨기지 않는다 — 반려가 사라진 줄 알게 된다 (A-02 §상태 탭) */
  { key: 'rejected',  label: '반려' },
  { key: 'archived',  label: '보관', adminOnly: true },
] as const

export const LABEL: Record<string, string> = {
  draft: '초안', pending: '승인대기', published: '발행', rejected: '반려', archived: '보관',
}

/** `08-14 · 3일 전` — 상대시간만 쓰면 승인 업무에서 정확한 날짜를 못 본다 (A-00 §3.2) */
export function when(iso: string) {
  const d = new Date(iso)
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  const rel = days <= 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`
  return `${md} · ${rel}`
}

export type ListRow = {
  id: string
  title: string | null
  status: string
  updated_at: string
  thumb_url: string | null
  /** 발행된 것만 공개 주소가 있다 — [관리 ▾] 의 미리보기에 쓴다 */
  slug: string | null
  /** headers 와 같은 순서·길이. 제목과 상태 사이에 들어간다 */
  cells: React.ReactNode[]
}

export default function ContentList({
  kind, base, heading, newHref, newLabel, searchPlaceholder,
  headers, rows, counts, totalAll, total,
  status, q, page, isAdmin, wideThumb, empty, notice,
}: {
  /** 서버 액션이 어느 표를 건드릴지 정한다 */
  kind: Kind
  base: string
  heading: string
  newHref: string
  newLabel: string
  searchPlaceholder: string
  headers: string[]
  rows: ListRow[]
  counts: Record<string, number>
  totalAll: number
  total: number
  status: string
  q: string
  page: number
  isAdmin: boolean
  /** Work 는 프로젝트를 이미지로 식별한다 — 48×27 (A-04 §세부) */
  wideThumb?: boolean
  empty: { all: string; mine: string; filtered: string }
  notice?: React.ReactNode
}) {
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const filtered = Boolean(status || q)

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams()
    Object.entries({ status, q, ...patch }).forEach(([k, v]) => { if (v) p.set(k, v) })
    const s = p.toString()
    return s ? `${base}?${s}` : base
  }

  return (
    <>
      <h1 className="adm-title">{heading}</h1>

      {notice}

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

      {/* action 이 문자열이라 평범한 GET 폼이다 — 서버 액션이 아니므로 React 가 폼을 초기화하지 않는다 */}
      <form className="adm-filters" action={base}>
        {status && <input type="hidden" name="status" value={status} />}
        <input
          className="adm-input adm-grow" type="search" name="q" defaultValue={q}
          placeholder={searchPlaceholder} aria-label={searchPlaceholder}
        />
        <button className="adm-btn adm-btn--ghost" type="submit">검색</button>
        {filtered && <Link className="adm-btn adm-btn--ghost" href={base}>필터 초기화</Link>}
        <Link className="adm-btn" href={newHref}>{newLabel}</Link>
      </form>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <p>{filtered ? empty.filtered : isAdmin ? empty.all : empty.mine}</p>
            {filtered
              ? <Link className="adm-btn adm-btn--ghost" href={base}>필터 초기화</Link>
              : <Link className="adm-btn" href={newHref}>{newLabel}</Link>}
          </div>
        ) : (
          <>
            <div className="adm-scroll">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>제목</th>
                    {headers.map(h => <th key={h}>{h}</th>)}
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
                          {/* 썸네일이 없어도 빈 칸으로 두지 않는다 — 행 높이가 들쭉날쭉해진다 (A-04 §세부) */}
                          {r.thumb_url
                            ? <img className={`adm-thumb${wideThumb ? ' adm-thumb--wide' : ''}`}
                                src={r.thumb_url} alt="" />
                            : <span className={`adm-thumb${wideThumb ? ' adm-thumb--wide' : ''}`}
                                data-empty="" aria-hidden="true" />}
                          {/* 행 이름 전체가 링크다 — 작은 버튼을 조준하게 만들지 않는다 */}
                          <Link className="adm-name" href={`${base}/${r.id}`}
                            data-none={r.title ? undefined : ''}>
                            {r.title || '(제목 없음)'}
                          </Link>
                        </div>
                      </td>
                      {r.cells.map((c, i) => <td key={headers[i] ?? i} className="adm-dim">{c}</td>)}
                      <td><span className="adm-badge" data-s={r.status}>{LABEL[r.status] ?? r.status}</span></td>
                      <td className="adm-dim adm-num">{when(r.updated_at)}</td>
                      <td>
                        <RowMenu
                          kind={kind} id={r.id} title={r.title || '(제목 없음)'}
                          slug={r.slug} status={r.status} isAdmin={isAdmin}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="adm-tfoot">
              <span className="adm-num">{total}건 중 {from}-{to}</span>
              <span style={{ display: 'flex', gap: 6 }}>
                {page > 1 && <Link className="adm-manage" href={href({ page: String(page - 1) })}>이전</Link>}
                {to < total && <Link className="adm-manage" href={href({ page: String(page + 1) })}>다음</Link>}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  )
}
