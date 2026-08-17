'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { issueBuilder, setActive, type IssueState, type RowState } from './actions'
import ProfilePanel from './profile-panel'

const I: IssueState = {}
const S: RowState = {}

export type BuilderRow = {
  id: string
  auth_user_id: string | null
  name: string
  email: string
  slug: string
  role: 'admin' | 'builder'
  role_label: string | null
  one_liner: string | null
  avatar_url: string | null
  is_active: boolean
  must_change_password: boolean
  last_sign_in: string | null
  published_posts: number
  joined_works: number
  bio: string | null
  focus: string | null
  stack: string[] | null
  principles: { title: string; body: string }[] | null
  badge: string | null
  link_label: string | null
  link_url: string | null
}

function day(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BuildersView({
  rows, counts, meId, q, state, editing,
}: {
  rows: BuilderRow[]
  counts: { all: number; active: number; inactive: number }
  meId: string
  q: string
  state: string
  editing: BuilderRow | null
}) {
  const router = useRouter()
  const [issueOpen, setIssueOpen] = useState(false)
  /* ⚠ 발급 모달을 닫을 때마다 이 값을 올려 IssueModal 을 통째로 다시 마운트한다.
     useActionState 는 스스로 초기화되지 않아서, 그냥 두면 창을 다시 열었을 때
     지난번 결과가 그대로 남는다 — 임시 비밀번호가 다시 보인다는 뜻이고
     "닫으면 다시 볼 수 없다"(A-06 §계정 발급)를 어긴다. */
  const [issueSeq, setIssueSeq] = useState(0)
  const [revoking, setRevoking] = useState<BuilderRow | null>(null)

  const [active, activeAction, activePending] = useActionState(setActive, S)

  const closeIssue = () => { setIssueOpen(false); setIssueSeq(n => n + 1) }

  /* 회수·활성화가 끝나면 확인창을 닫는다.
     ⚠ 의존성은 active.ok 가 아니라 active 객체다. ok 는 한 번 true 가 되면 계속 true 라
       두 번째 동작부터 effect 가 다시 돌지 않는다 — 첫 회수만 닫히고 그다음은 창이 남았다.
       서버 액션은 호출마다 새 객체를 돌려주므로 객체를 보면 매번 걸린다. */
  useEffect(() => { if (active.ok) setRevoking(null) }, [active])

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams()
    Object.entries({ q, state, ...patch }).forEach(([k, v]) => { if (v) p.set(k, v) })
    const s = p.toString()
    return s ? `/admin/builders?${s}` : '/admin/builders'
  }

  return (
    <>
      <h1 className="adm-title">빌더 관리</h1>

      {active.ok && active.notice && (
        <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
          {active.notice}
        </p>
      )}
      {active.error && <p className="adm-error" role="alert">{active.error}</p>}

      <div className="adm-tabs">
        <Link href={href({ state: '' })} aria-current={state === '' ? 'page' : undefined}>
          전체<b>{counts.all}</b>
        </Link>
        <Link href={href({ state: 'active' })} aria-current={state === 'active' ? 'page' : undefined}>
          활성<b>{counts.active}</b>
        </Link>
        <Link href={href({ state: 'inactive' })} aria-current={state === 'inactive' ? 'page' : undefined}>
          비활성<b>{counts.inactive}</b>
        </Link>
      </div>

      <form className="adm-filters" action="/admin/builders">
        {state && <input type="hidden" name="state" value={state} />}
        <input className="adm-input adm-grow" type="search" name="q" defaultValue={q}
          placeholder="이름·이메일 검색" aria-label="이름·이메일 검색" />
        <button className="adm-btn adm-btn--ghost" type="submit">검색</button>
        {(q || state) && <Link className="adm-btn adm-btn--ghost" href="/admin/builders">필터 초기화</Link>}
        <button className="adm-btn" type="button" onClick={() => setIssueOpen(true)}>+ 계정 발급</button>
      </form>

      <div className="adm-card">
        {rows.length === 0 ? (
          <div className="adm-empty">
            <p>{q || state ? '조건에 맞는 계정이 없습니다' : '아직 계정이 없습니다'}</p>
            <button className="adm-btn" type="button" onClick={() => setIssueOpen(true)}>+ 계정 발급</button>
          </div>
        ) : (
          <div className="adm-scroll">
            <table className="adm-table bd-table">
              <thead>
                <tr>
                  <th>이름</th><th>이메일</th><th>역할</th><th>상태</th><th>최근 로그인</th><th>관리</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} data-off={r.is_active ? undefined : ''}>
                    <td>
                      <div className="adm-cell">
                        {r.avatar_url
                          ? <img className="bd-avatar" src={r.avatar_url} alt="" />
                          : <span className="bd-avatar" data-initial="">{r.name.slice(0, 1)}</span>}
                        <Link className="adm-name" href={href({ edit: r.id })}>{r.name}</Link>
                      </div>
                    </td>
                    <td className="adm-dim">{r.email}</td>
                    <td>
                      {r.role === 'admin'
                        ? <span className="adm-badge bd-admin">관리자</span>
                        : <span className="adm-dim">빌더</span>}
                    </td>
                    <td>
                      <span className="adm-badge" data-s={r.is_active ? 'published' : 'archived'}>
                        {r.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="adm-num">
                      {/* 발급했는데 안 들어온 계정을 찾기 위한 신호다 (A-06 §컬럼) */}
                      {day(r.last_sign_in) ?? <b className="bd-never">없음</b>}
                    </td>
                    <td>
                      <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <Link className="adm-manage" href={href({ edit: r.id })}>프로필</Link>
                        {r.id === meId
                          ? <span className="adm-dim" style={{ fontSize: 11.5, alignSelf: 'center' }}>본인</span>
                          : (
                            <button type="button" className="adm-manage"
                              onClick={() => setRevoking(r)}>
                              {r.is_active ? '회수' : '활성화'}
                            </button>
                          )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 프로필 패널 ─────────────────────────────────────── */}
      {editing && (
        <div className="bd-overlay" onClick={e => { if (e.target === e.currentTarget) router.push(href({ edit: '' })) }}>
          <ProfilePanel profile={editing} canSendReset onClose={() => router.push(href({ edit: '' }))} />
        </div>
      )}

      {/* ── 계정 발급 (FR-A06-02) ───────────────────────────── */}
      {issueOpen && <IssueModal key={issueSeq} onClose={closeIssue} />}

      {/* ── 계정 회수 · 활성화 (FR-A06-03) ──────────────────── */}
      {revoking && (
        <div className="bd-overlay" onClick={e => { if (e.target === e.currentTarget && !activePending) setRevoking(null) }}>
          <form action={activeAction} className="bd-modal">
            <input type="hidden" name="id" value={revoking.id} />
            <input type="hidden" name="active" value={revoking.is_active ? 'false' : 'true'} />

            <h2>
              {revoking.name} 님의 계정을
              {revoking.is_active ? ' 회수할까요?' : ' 다시 활성화할까요?'}
            </h2>

            {revoking.is_active ? (
              <>
                <ul className="bd-bullets">
                  <li>즉시 로그인이 차단됩니다</li>
                  <li>진행 중인 세션도 끊깁니다</li>
                </ul>
                {/* 이 문단이 이 화면에서 가장 중요하다. 콘텐츠가 사라진다고 오해하면 회수를 못 한다 */}
                <div className="bd-keep">
                  <b>✅ 작성한 콘텐츠는 그대로 유지됩니다</b>
                  <span>발행 글 {revoking.published_posts}건 · 참여 프로젝트 {revoking.joined_works}건</span>
                  <span>공개 페이지는 아무 것도 바뀌지 않습니다.</span>
                </div>
                <p className="adm-dim" style={{ fontSize: 12.5, margin: 0 }}>
                  나중에 <b>활성화</b>로 되돌릴 수 있습니다.
                </p>
              </>
            ) : (
              <p className="adm-dim" style={{ fontSize: 13, margin: 0 }}>
                로그인이 다시 허용됩니다. 비밀번호를 잊었을 수 있으니 프로필에서
                재설정 메일을 함께 보내주세요.
              </p>
            )}

            {active.error && <p className="adm-error" role="alert">{active.error}</p>}

            <div className="bd-modal-foot">
              <button type="button" className="adm-btn adm-btn--ghost"
                onClick={() => setRevoking(null)} disabled={activePending}>취소</button>
              <button type="submit" className="adm-btn" disabled={activePending}
                style={revoking.is_active
                  ? { background: '#A32318', borderColor: '#A32318', color: '#fff' }
                  : undefined}>
                {activePending ? '처리 중…' : revoking.is_active ? '회수하기' : '활성화'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

/* 발급 모달을 따로 뺀 이유는 위 issueSeq 주석 참고 — key 로 통째로 다시 마운트해
   useActionState 를 초기화한다. */
function IssueModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [issue, issueAction, issuePending] = useActionState(issueBuilder, I)

  /* 제어 컴포넌트다 (React 19 의 form.reset 때문. insight/[id]/editor.tsx 주석 참고).
     ⚠ 기본값이 스펙(A-06 은 초대 메일 권장)과 다르다.
       초대 메일은 Supabase 메일 템플릿을 TokenHash 로 바꿔야 링크가 동작한다
       (supabase/EMAIL-TEMPLATES.md). 설정 전에는 임시 비밀번호만 바로 쓸 수 있어
       동작하는 쪽을 기본으로 둔다. 설정을 마치면 초대 메일로 옮기는 편이 낫다. */
  const [f, setF] = useState({ name: '', email: '', slug: '', role_label: '', method: 'temp' })
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="bd-overlay" onClick={e => { if (e.target === e.currentTarget && !issuePending) onClose() }}>
          <div className="bd-modal">
            {issue.ok ? (
              <>
                <h2>{issue.name} 님 계정을 발급했습니다</h2>
                {issue.tempPassword ? (
                  <>
                    {/* ⚠ 다시 볼 수 없다. 닫기 전에 옮겨 적어야 한다 (A-06 §계정 발급) */}
                    <p className="adm-error" style={{ background: '#FFEDD0', color: '#9A5B00' }}>
                      임시 비밀번호는 <b>지금 한 번만</b> 표시됩니다. 창을 닫으면 다시 볼 수 없습니다.
                    </p>
                    <div className="bd-secret">
                      <code>{issue.tempPassword}</code>
                      <button type="button" className="adm-btn adm-btn--ghost"
                        onClick={() => navigator.clipboard?.writeText(issue.tempPassword!)}>복사</button>
                    </div>
                    <p className="adm-dim" style={{ fontSize: 12.5 }}>
                      본인에게 안전한 경로로 전달하세요. 첫 로그인 시 비밀번호 변경이 강제됩니다.
                    </p>
                  </>
                ) : (
                  <p className="adm-notice" style={{ background: '#DBF3E4', color: '#14663C' }}>
                    {issue.invitedEmail} 로 초대 메일을 보냈습니다. 링크에서 본인이 비밀번호를 정합니다.
                  </p>
                )}
                <div className="bd-modal-foot">
                  <button type="button" className="adm-btn"
                    onClick={() => { onClose(); router.refresh() }}>
                    확인
                  </button>
                </div>
              </>
            ) : (
              <form action={issueAction}>
                <h2>빌더 계정 발급</h2>
                {issue.error && <p className="adm-error" role="alert">{issue.error}</p>}

                <div className="adm-field">
                  <label htmlFor="is-name">이름 <span aria-hidden="true">*</span></label>
                  <input id="is-name" name="name" value={f.name} maxLength={40} required
                    onChange={e => set('name')(e.target.value)} />
                </div>

                <div className="adm-field">
                  <label htmlFor="is-email">이메일 <span aria-hidden="true">*</span></label>
                  <input id="is-email" name="email" type="email" value={f.email} required
                    spellCheck={false} onChange={e => set('email')(e.target.value)} />
                  <small className="adm-dim">ⓘ 이 주소로 초대 메일이 갑니다.</small>
                </div>

                <div className="adm-field">
                  <label htmlFor="is-slug">슬러그 <span aria-hidden="true">*</span></label>
                  <input id="is-slug" name="slug" value={f.slug} required spellCheck={false}
                    maxLength={40} onChange={e => set('slug')(e.target.value)} />
                  <small className="adm-dim"><code>/builders/{f.slug || '…'}</code> (2차 대비)</small>
                </div>

                <div className="adm-field">
                  <label htmlFor="is-role-label">역할 라벨</label>
                  <input id="is-role-label" name="role_label" value={f.role_label} maxLength={30}
                    placeholder="랜딩 · 인터랙션" onChange={e => set('role_label')(e.target.value)} />
                </div>

                <fieldset className="bd-method">
                  <legend>발급 방식</legend>
                  <label>
                    <input type="radio" name="method" value="temp"
                      checked={f.method === 'temp'} onChange={() => set('method')('temp')} />
                    <span><b>임시 비밀번호 생성</b><em>첫 로그인 시 변경을 강제합니다</em></span>
                  </label>
                  <label>
                    <input type="radio" name="method" value="invite"
                      checked={f.method === 'invite'} onChange={() => set('method')('invite')} />
                    <span>
                      <b>초대 메일</b>
                      <em>본인이 비밀번호를 직접 설정합니다</em>
                      <em>⚠ Supabase 메일 템플릿 설정이 먼저 필요합니다 (supabase/EMAIL-TEMPLATES.md)</em>
                    </span>
                  </label>
                </fieldset>

                {/* ⛔ 역할 선택지가 없다. 항상 builder 로 만든다 (PRD §2.2) */}
                <p className="adm-dim" style={{ fontSize: 12, margin: 0 }}>
                  발급되는 역할은 <b>빌더</b>로 고정입니다. 운영 관리자 승격은 DB 에서만 합니다.
                </p>

                <div className="bd-modal-foot">
                  <button type="button" className="adm-btn adm-btn--ghost"
                    onClick={onClose} disabled={issuePending}>취소</button>
                  <button type="submit" className="adm-btn" disabled={issuePending}>
                    {issuePending ? '발급 중…' : '발급하기'}
                  </button>
                </div>
              </form>
            )}
          </div>
    </div>
  )
}
