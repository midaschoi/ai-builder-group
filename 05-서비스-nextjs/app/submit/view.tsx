'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function SubmitView() {
  /* ★ 전환 측정 지점 — 가짜 전환 방어: src=pluug 토큰 확인 (검증 통과 시에만 발화) */
  useEffect(() => {
    if (new URLSearchParams(location.search).get('src') === 'pluug') {
      window.track?.('contact_submit', { verified: true })
    }
  }, [])

  return (
    <main id="main">
      <div className="wrap done">
        <svg className="check" viewBox="0 0 88 88" aria-hidden="true">
          <circle cx="44" cy="44" r="40" />
          <path d="M28 45 L40 57 L61 34" />
        </svg>
        <h1><span className="w300">문의가</span> 정상적으로 접수되었습니다</h1>
        <p>담당자가 확인 후 남겨주신 연락처로 연락드리겠습니다.</p>

        <div className="next">
          {/* 시안 고정 페이지(/insight-detail)를 가리키고 있었다. 문의를 막 넣은 사람을
              검색에서 빼둔 중복 페이지로 보내던 자리라 실제 발행 글로 바꾼다. */}
          <Link className="ncard" href="/insight/turnkey-team">
            <b>외주개발, 왜 올인원 턴키 팀과 함께 해야 할까?</b>
          </Link>
          <Link className="ncard" href="/content">
            <b>영상으로 보는 우리의 작업 →</b>
          </Link>
        </div>

        <Link className="btn btn--ghost" href="/">홈으로 돌아가기</Link>
      </div>
    </main>
  )
}
