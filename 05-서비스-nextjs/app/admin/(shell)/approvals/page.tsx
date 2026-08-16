import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import Forbidden from '../forbidden'

/* A-07 승인 대기 — 빌더가 쓴 것이 검수 없이 고객 앞에 나가는 것을 막는 마지막 문.
   승인 게이트는 타협 불가 항목이다 (PRD R8). */

type Pending = {
  id: string
  type: 'insight' | 'work'
  title: string | null
  author: string | null
  at: string
}

/** 며칠 묵었는지. 오래 방치된 건이 아래로 밀려 잊히는 것을 막는다. */
function aging(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  const label = days <= 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`
  return { days, label }
}

function md(iso: string) {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  /* 빌더가 접근하면 403 이다 (FR-A07-05). 메뉴를 숨기는 것만으로는 부족하다. */
  if (!(await requireAdmin())) return <Forbidden />

  const { type = '' } = await searchParams
  const supabase = await createClient()

  const [ins, wks] = await Promise.all([
    supabase.from('insights')
      .select('id, title, updated_at, author:builders(name)')
      .eq('status', 'pending'),
    supabase.from('works')
      .select('id, title, updated_at, creator:builders(name)')
      .eq('status', 'pending'),
  ])

  const rows: Pending[] = [
    ...((ins.data ?? []) as unknown as Array<{ id: string; title: string | null; updated_at: string; author: { name: string } | null }>)
      .map(r => ({ id: r.id, type: 'insight' as const, title: r.title, author: r.author?.name ?? null, at: r.updated_at })),
    ...((wks.data ?? []) as unknown as Array<{ id: string; title: string | null; updated_at: string; creator: { name: string } | null }>)
      .map(r => ({ id: r.id, type: 'work' as const, title: r.title, author: r.creator?.name ?? null, at: r.updated_at })),
  ]
    /* 기본 정렬은 오래된 순이다. 최신순으로 두면 오래된 건이 아래로 밀려 잊힌다. */
    .sort((a, b) => a.at.localeCompare(b.at))

  const shown = type ? rows.filter(r => r.type === type) : rows
  const counts = {
    all: rows.length,
    insight: rows.filter(r => r.type === 'insight').length,
    work: rows.filter(r => r.type === 'work').length,
  }

  return (
    <>
      <h1 className="adm-title">승인 대기</h1>

      <div className="adm-tabs">
        <Link href="/admin/approvals" aria-current={!type ? 'page' : undefined}>전체<b>{counts.all}</b></Link>
        <Link href="/admin/approvals?type=insight" aria-current={type === 'insight' ? 'page' : undefined}>Insight<b>{counts.insight}</b></Link>
        <Link href="/admin/approvals?type=work" aria-current={type === 'work' ? 'page' : undefined}>Work<b>{counts.work}</b></Link>
      </div>

      <div className="adm-card">
        {shown.length === 0 ? (
          <div className="adm-empty">
            {/* 여기서 빈 상태는 좋은 소식이다 */}
            <p>✓ 승인을 기다리는 항목이 없습니다</p>
          </div>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>타입</th><th>제목</th><th>작성자</th><th>제출</th><th>검토</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => {
                  const age = aging(r.at)
                  return (
                    <tr key={`${r.type}-${r.id}`}>
                      <td>
                        <span className="adm-badge" data-s={r.type === 'insight' ? 'draft' : 'archived'}>
                          {r.type === 'insight' ? 'Insight' : 'Work'}
                        </span>
                      </td>
                      <td>
                        <Link className="adm-name" href={`/admin/approvals/${r.type}/${r.id}`}>
                          {r.title || '(제목 없음)'}
                        </Link>
                      </td>
                      <td className="adm-dim">{r.author ?? '—'}</td>
                      <td
                        className="adm-num"
                        /* 3일 넘으면 주황, 7일 넘으면 빨강 */
                        style={{ color: age.days >= 7 ? '#A32318' : age.days >= 3 ? '#9A5B00' : undefined,
                                 fontWeight: age.days >= 3 ? 700 : undefined }}
                      >
                        {md(r.at)} · {age.label}
                      </td>
                      <td>
                        <Link className="adm-manage" href={`/admin/approvals/${r.type}/${r.id}`}>검토</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="adm-dim" style={{ fontSize: 12 }}>
        ⓘ &lsquo;제출&rsquo; 은 마지막 수정 시각입니다. 제출 후에는 작성자가 편집할 수 없으므로 사실상 제출 시각과 같습니다.
      </p>
    </>
  )
}
