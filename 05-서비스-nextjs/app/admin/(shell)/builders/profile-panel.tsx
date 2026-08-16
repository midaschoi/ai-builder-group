'use client'

import { useActionState, useCallback, useState } from 'react'
import { saveProfile, uploadAvatar, resendInvite, type ProfileState, type RowState } from './actions'

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
}

/* A-06 §프로필 편집 (FR-A06-04).

   ⛔ 이메일과 역할은 읽기 전용이다 (A-06 §프로필 편집 표).
      이메일은 인증 주체라 바꾸면 재인증이 필요하고, 역할은 DB 직접 변경으로만 바꾼다.
      화면에 입력칸을 두지 않는 것이 요점이다 — 막힌 칸을 두면 언젠가 누가 연다. */
export default function ProfilePanel({
  profile, canSendReset, onClose,
}: {
  profile: Profile
  /** 관리자만 남에게 재설정 메일을 보낼 수 있다 */
  canSendReset: boolean
  onClose?: () => void
}) {
  const [state, action, pending] = useActionState(saveProfile, P)
  const [mail, mailAction, mailPending] = useActionState(resendInvite, R)

  const [name, setName] = useState(profile.name)
  const [slug, setSlug] = useState(profile.slug)
  const [roleLabel, setRoleLabel] = useState(profile.role_label ?? '')
  const [oneLiner, setOneLiner] = useState(profile.one_liner ?? '')
  const [avatar, setAvatar] = useState(profile.avatar_url ?? '')
  const [uploadError, setUploadError] = useState('')

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
          <small className="adm-dim">{oneLiner.length}/80</small>
        </div>

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
          {mail.ok && <p className="adm-notice" role="status">{mail.notice}</p>}
          <button className="adm-btn adm-btn--ghost" type="submit" disabled={mailPending}>
            {mailPending ? '보내는 중…' : '비밀번호 재설정 메일 보내기'}
          </button>
        </form>
      )}
    </div>
  )
}
