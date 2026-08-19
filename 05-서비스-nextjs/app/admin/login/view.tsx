'use client'

import { useActionState, useState } from 'react'
import { signIn, type LoginState } from './actions'

const INITIAL: LoginState = {}

export default function LoginView({ next, changed = false }: { next: string; changed?: boolean }) {
  const [state, action, pending] = useActionState(signIn, INITIAL)

  /* 이메일은 제어 컴포넌트로 둔다. React 19 는 폼 액션이 끝나면 form.reset() 을 호출하므로
     비밀번호만 틀려도 이메일까지 지워져 매번 다시 입력해야 한다.
     비밀번호는 반대로 비워지는 편이 낫다 — 그대로 남겨두면 화면을 떠나도 남는다. */
  const [email, setEmail] = useState('')

  return (
    <div className="adm">
      <div className="adm-auth">
        <div className="adm-auth-card">
          <form className="adm-auth-box" action={action}>
            <div className="adm-auth-head">
              <i aria-hidden="true">A</i>
              <b>AI 빌더 그룹<span>관리자</span></b>
            </div>

            {changed && !state.error && (
              <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
                비밀번호를 바꿨습니다. <b>새 비밀번호로 다시 로그인</b>해 주세요.
                <br />다른 기기에 열려 있던 창은 모두 로그아웃되었습니다.
              </p>
            )}

            {state.error && (
              <p className="adm-error" role="alert">{state.error}</p>
            )}

            <input type="hidden" name="next" value={next} />

            <div className="adm-field">
              <label htmlFor="email">이메일 <span aria-hidden="true">*</span></label>
              <input
                id="email" name="email" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" autoFocus
                /* 검증은 blur·제출 시점에만 — 입력 중에 빨간 줄이 뜨면 방해만 된다 */
                spellCheck={false}
              />
            </div>

            <div className="adm-field">
              <label htmlFor="password">비밀번호 <span aria-hidden="true">*</span></label>
              <input
                id="password" name="password" type="password" required
                autoComplete="current-password"
              />
            </div>

            {/* 연타로 자기 레이트 리밋을 소진하는 것을 막는다 (A-01 §동작 스펙) */}
            <button className="adm-btn" type="submit" disabled={pending}>
              {pending ? '로그인 중…' : '로그인'}
            </button>

            {/* ⛔ 회원가입 링크를 두지 않는다 — 계정은 관리자가 발급한다 (FR-A01-02) */}
            <p className="adm-auth-foot adm-dim" style={{ justifyContent: 'center' }}>
              <a href="/admin/reset">비밀번호를 잊으셨나요?</a>
            </p>
          </form>

          <p className="adm-auth-back"><a href="/">← 사이트로 돌아가기</a></p>
        </div>
      </div>
    </div>
  )
}
