'use client'

import { useActionState, useState } from 'react'
import { requestReset, updatePassword, type RequestState, type UpdateState } from './actions'

const REQ: RequestState = {}
const UPD: UpdateState = {}

export default function ResetView({
  hasSession, email, linkError,
}: {
  hasSession: boolean
  email: string
  linkError: string
}) {
  const [reqState, reqAction, reqPending] = useActionState(requestReset, REQ)
  const [updState, updAction, updPending] = useActionState(updatePassword, UPD)

  /* 제어 컴포넌트로 둔다 — React 19 는 폼 액션이 끝나면 form.reset() 을 호출한다.
     비밀번호가 짧아 실패했을 때 두 칸이 다 비워지면 처음부터 다시 쳐야 한다. */
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [reqEmail, setReqEmail] = useState('')

  return (
    <div className="adm">
      <div className="adm-auth">
        <div className="adm-auth-card">
          {hasSession ? (
            <form className="adm-auth-box" action={updAction}>
              <div className="adm-auth-head">
                <i aria-hidden="true">A</i>
                <b>비밀번호 설정<span>{email}</span></b>
              </div>

              {updState.error && <p className="adm-error" role="alert">{updState.error}</p>}

              <div className="adm-field">
                <label htmlFor="password">새 비밀번호 <span aria-hidden="true">*</span></label>
                <input
                  id="password" name="password" type="password" required minLength={10}
                  autoComplete="new-password" autoFocus
                  value={pw} onChange={e => setPw(e.target.value)}
                />
                <small className="adm-dim" style={{ fontSize: 12 }}>10자 이상.</small>
              </div>

              <div className="adm-field">
                <label htmlFor="confirm">다시 입력 <span aria-hidden="true">*</span></label>
                <input
                  id="confirm" name="confirm" type="password" required
                  autoComplete="new-password"
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                />
                {confirm !== '' && pw !== confirm && (
                  <small style={{ fontSize: 12, color: '#A32318' }}>두 비밀번호가 다릅니다.</small>
                )}
              </div>

              <button className="adm-btn" type="submit" disabled={updPending}>
                {updPending ? '저장 중…' : '비밀번호 설정하고 시작하기'}
              </button>
            </form>
          ) : (
            <form className="adm-auth-box" action={reqAction}>
              <div className="adm-auth-head">
                <i aria-hidden="true">A</i>
                <b>비밀번호 재설정<span>AI 빌더 그룹 관리자</span></b>
              </div>

              {linkError && <p className="adm-error" role="alert">{linkError}</p>}

              {reqState.error && <p className="adm-error" role="alert">{reqState.error}</p>}

              {reqState.sent ? (
                /* ⚠ "보냈다"고만 답한다. 등록 여부를 알려주면 계정 목록을 확인해 주는 통로가 된다 */
                <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
                  등록된 계정이라면 메일을 보냈습니다. 받은 편지함을 확인해 주세요.
                  스팸함도 함께 확인하세요.
                </p>
              ) : (
                <>
                  <div className="adm-field">
                    <label htmlFor="email">이메일 <span aria-hidden="true">*</span></label>
                    <input
                      id="email" name="email" type="email" required autoFocus
                      autoComplete="email" spellCheck={false}
                      value={reqEmail} onChange={e => setReqEmail(e.target.value)}
                    />
                  </div>
                  <button className="adm-btn" type="submit" disabled={reqPending}>
                    {reqPending ? '보내는 중…' : '재설정 메일 받기'}
                  </button>
                </>
              )}
            </form>
          )}

          <p className="adm-auth-back"><a href="/admin/login">← 로그인으로</a></p>
        </div>
      </div>
    </div>
  )
}
