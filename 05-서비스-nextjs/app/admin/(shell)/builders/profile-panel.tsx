'use client'

import { useActionState, useCallback, useState } from 'react'
import { saveProfile, uploadAvatar, createResetLink, type ProfileState, type RowState } from './actions'

const P: ProfileState = {}
const R: RowState = {}

export type Profile = {
  id: string
  name: string
  email: string
  slug: string
  role: 'admin' | 'builder'
  role_label: string | null
  one_liner: string | null
  avatar_url: string | null
  /* 아래는 공개 프로필(/builder)이 쓰는 값 — 0006 에서 추가했다 */
  bio: string | null
  focus: string | null
  stack: string[] | null
  principles: { title: string; body: string }[] | null
  badge: string | null
  link_label: string | null
  link_url: string | null
}

/* A-06 §프로필 편집 (FR-A06-04).

   ⛔ 이메일과 역할은 읽기 전용이다 (A-06 §프로필 편집 표).
      이메일은 인증 주체라 바꾸면 재인증이 필요하고, 역할은 DB 직접 변경으로만 바꾼다.
      화면에 입력칸을 두지 않는 것이 요점이다 — 막힌 칸을 두면 언젠가 누가 연다. */
export default function ProfilePanel({
  profile, canSendReset, isAdmin, onClose,
}: {
  profile: Profile
  /** 관리자만 남에게 재설정 메일을 보낼 수 있다 */
  canSendReset: boolean
  /** 배지는 편집자 표식이라 관리자만 단다 (0007). DB 에서도 막혀 있다 */
  isAdmin: boolean
  onClose?: () => void
}) {
  const [state, action, pending] = useActionState(saveProfile, P)
  const [mail, mailAction, mailPending] = useActionState(createResetLink, R)

  const [name, setName] = useState(profile.name)
  const [slug, setSlug] = useState(profile.slug)
  const [roleLabel, setRoleLabel] = useState(profile.role_label ?? '')
  const [oneLiner, setOneLiner] = useState(profile.one_liner ?? '')
  const [avatar, setAvatar] = useState(profile.avatar_url ?? '')
  const [uploadError, setUploadError] = useState('')

  /* 공개 프로필용 */
  const [bio, setBio] = useState(profile.bio ?? '')
  const [focus, setFocus] = useState(profile.focus ?? '')
  const [badge, setBadge] = useState(profile.badge ?? '')
  const [stack, setStack] = useState((profile.stack ?? []).join(', '))
  const [linkLabel, setLinkLabel] = useState(profile.link_label ?? '')
  const [linkUrl, setLinkUrl] = useState(profile.link_url ?? '')
  const [principles, setPrinciples] = useState<{ title: string; body: string }[]>(
    profile.principles ?? [],
  )
  const setP = (i: number, p: Partial<{ title: string; body: string }>) =>
    setPrinciples(principles.map((x, idx) => (idx === i ? { ...x, ...p } : x)))

  const pickAvatar = useCallback(async (file: File) => {
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadAvatar(fd)
    if (res.error) { setUploadError(res.error); return }
    if (res.url) setAvatar(res.url)
  }, [])

  return (
    <div className="bd-panel">
      <div className="bd-panel-head">
        <b>빌더 프로필</b>
        {onClose && (
          <button type="button" className="bd-x" onClick={onClose} aria-label="닫기">✕</button>
        )}
      </div>

      <form action={action} className="bd-panel-body">
        <input type="hidden" name="id" value={profile.id} />
        <input type="hidden" name="avatar_url" value={avatar} />

        {state.error && <p className="adm-error" role="alert">{state.error}</p>}
        {state.ok && (
          <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
            저장했습니다.
          </p>
        )}
        {uploadError && <p className="adm-error" role="alert">{uploadError}</p>}

        <div className="bd-avatar-row">
          {avatar
            ? <img className="bd-avatar bd-avatar--lg" src={avatar} alt="" />
            : <span className="bd-avatar bd-avatar--lg" data-initial="">{profile.name.slice(0, 1)}</span>}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="adm-btn adm-btn--ghost ed-upload">
              이미지 변경
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) pickAvatar(f); e.target.value = '' }} />
            </label>
            <small className="adm-dim">1:1 · 최대 1MB</small>
            {avatar && (
              <button type="button" className="adm-manage" onClick={() => setAvatar('')}>제거</button>
            )}
          </span>
        </div>

        <div className="adm-field">
          <label htmlFor="bd-name">이름 <span aria-hidden="true">*</span></label>
          <input id="bd-name" name="name" value={name} maxLength={40}
            onChange={e => setName(e.target.value)} />
        </div>

        <div className="adm-field">
          <label htmlFor="bd-slug">슬러그 <span aria-hidden="true">*</span></label>
          <input id="bd-slug" name="slug" value={slug} spellCheck={false} maxLength={40}
            onChange={e => setSlug(e.target.value)} />
          <small className="adm-dim">
            <code>/builders/{slug || '…'}</code> · 영문 소문자·숫자·하이픈.
            <br />2차 빌더 프로필(P-11)의 주소가 됩니다.
          </small>
        </div>

        <div className="adm-field">
          <label htmlFor="bd-role-label">역할 라벨</label>
          <input id="bd-role-label" name="role_label" value={roleLabel} maxLength={30}
            onChange={e => setRoleLabel(e.target.value)} placeholder="랜딩 · 인터랙션" />
        </div>

        <div className="adm-field">
          <label htmlFor="bd-one-liner">한 줄 소개</label>
          <textarea id="bd-one-liner" name="one_liner" value={oneLiner} rows={2} maxLength={80}
            onChange={e => setOneLiner(e.target.value)} />
          <small className="adm-dim">
            {oneLiner.length}/80 · 공개 사이트의 빌더 카드에 나오는 문장입니다.
            <br />⚠ <b>비어 있으면 공개 목록에 나오지 않습니다</b> — 운영용 계정이 사람 목록에
            섞이지 않게 하는 기준입니다.
          </small>
        </div>

        {/* ── 공개 프로필 (/builder) ─────────────────────────
            여기 값이 곧 공개 페이지다. 비워두면 그 항목이 화면에서 빠진다. */}
        <input type="hidden" name="stack" value={stack} />
        <input type="hidden" name="principles" value={JSON.stringify(principles)} />

        <div className="bd-sep"><span>공개 프로필</span></div>

        <div className="adm-field">
          <label htmlFor="bd-bio">소개</label>
          <textarea id="bd-bio" name="bio" value={bio} rows={4} maxLength={400}
            onChange={e => setBio(e.target.value)}
            placeholder="어떻게 일하는 사람인지 서너 문장으로" />
          <small className="adm-dim">{bio.length}/400 · 프로필 페이지 상단에 나옵니다.</small>
        </div>

        <div className="adm-field">
          <label htmlFor="bd-focus">주력 분야</label>
          <input id="bd-focus" name="focus" value={focus} maxLength={60}
            onChange={e => setFocus(e.target.value)} placeholder="어드민 · 정산 · 권한 설계" />
        </div>

        <div className="adm-field">
          <label htmlFor="bd-stack">기술 스택</label>
          <input id="bd-stack" value={stack} maxLength={120}
            onChange={e => setStack(e.target.value)} placeholder="Next.js, Supabase, RBAC" />
          <small className="adm-dim">쉼표로 구분합니다.</small>
        </div>

        {/* 배지는 관리자만 단다. 막힌 칸을 두지 않고 아예 감춘다 —
            빌더에게 보여주면 저장할 때 권한 오류로 떨어진다 (0007). */}
        {isAdmin && (
          <div className="adm-field">
            <label htmlFor="bd-badge">배지</label>
            <input id="bd-badge" name="badge" value={badge} maxLength={20}
              onChange={e => setBadge(e.target.value)} placeholder="✳ 이달의 빌더 · NEW" />
            <small className="adm-dim">비우면 배지를 달지 않습니다. 운영 관리자만 답니다.</small>
          </div>
        )}

        <div className="adm-field">
          <label>일하는 원칙</label>
          {principles.map((p, i) => (
            <div className="bd-principle" key={i}>
              <input value={p.title} placeholder="제목" maxLength={30}
                onChange={e => setP(i, { title: e.target.value })} />
              <textarea value={p.body} placeholder="설명" rows={2} maxLength={200}
                onChange={e => setP(i, { body: e.target.value })} />
              <button type="button" className="adm-manage"
                onClick={() => setPrinciples(principles.filter((_, x) => x !== i))}>제거</button>
            </div>
          ))}
          {principles.length < 5 && (
            <button type="button" className="adm-manage"
              onClick={() => setPrinciples([...principles, { title: '', body: '' }])}>
              + 원칙 추가
            </button>
          )}
          <small className="adm-dim">비워두면 이 영역이 화면에서 빠집니다. 3개 정도가 적당합니다.</small>
        </div>

        <div className="adm-field">
          <label htmlFor="bd-link-label">부가 링크</label>
          <input id="bd-link-label" name="link_label" value={linkLabel} maxLength={40}
            onChange={e => setLinkLabel(e.target.value)} placeholder="인터뷰 보기" />
          <input name="link_url" value={linkUrl} maxLength={200} type="url"
            onChange={e => setLinkUrl(e.target.value)} placeholder="https://…" />
          <small className="adm-dim">둘 다 채워야 표시됩니다.</small>
        </div>

        <div className="bd-sep"><span>변경할 수 없는 것</span></div>

        {/* 읽기 전용 두 가지 — 왜 못 바꾸는지도 함께 적는다 */}
        <dl className="bd-locked">
          <dt>이메일</dt>
          <dd>{profile.email} <em>변경 ⛔ 인증 주체입니다</em></dd>
          <dt>역할</dt>
          <dd>
            {profile.role === 'admin' ? '운영 관리자' : '빌더'}
            <em>변경 ⛔ DB 에서만 바꿉니다</em>
          </dd>
        </dl>

        <div className="bd-panel-foot">
          <button className="adm-btn" type="submit" disabled={pending}>
            {pending ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>

      {canSendReset && (
        <form action={mailAction} className="bd-panel-mail">
          <input type="hidden" name="email" value={profile.email} />
          {mail.error && <p className="adm-error" role="alert">{mail.error}</p>}
          {mail.ok && mail.link && (
            <>
              <p className="adm-notice" role="status">{mail.notice}</p>
              {/* ⚠ 이 링크는 곧 비밀번호다. 한 번만 보여주고 다시 조회할 수 없다 */}
              <div className="bd-secret">
                <code>{mail.link}</code>
                <button type="button" className="adm-btn adm-btn--ghost"
                  onClick={() => navigator.clipboard?.writeText(mail.link!)}>복사</button>
              </div>
            </>
          )}
          <button className="adm-btn adm-btn--ghost" type="submit" disabled={mailPending}>
            {mailPending ? '만드는 중…' : '비밀번호 재설정 링크 만들기'}
          </button>
          <small className="adm-dim" style={{ fontSize: 11.5 }}>
            메일은 보내지 않습니다 — 링크를 만들어 드리면 슬랙·문자 등 편한 경로로 전달하세요.
            <br />본인이 로그인 화면의 <b>비밀번호를 잊으셨나요?</b> 로 직접 요청하면 메일도 갑니다.
          </small>
        </form>
      )}
    </div>
  )
}
