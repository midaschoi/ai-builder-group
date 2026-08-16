'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PLUUG_FORM_URL, pluugUrl } from '@/app/_integrations'

/* formUrl 은 관리자 화면(A-08)에서 저장한 주소다. 넘어오지 않으면 환경변수로 되돌아간다.
   260812 2차 미팅 요구사항 — 클라이언트가 배포 없이 폼 주소를 바꿀 수 있어야 한다. */
export default function ContactView({ formUrl = '' }: { formUrl?: string }) {
  const formBase = formUrl || PLUUG_FORM_URL

  /* pluug 폼 주소는 클라이언트에서만 만든다 — 유입 utm_source 를 location 에서 읽기 때문에
     서버 렌더 결과와 달라져 하이드레이션이 어긋난다. 마운트 후에 채운다. */
  const [formSrc, setFormSrc] = useState('')
  useEffect(() => { setFormSrc(pluugUrl('contact_page', undefined, formBase)) }, [formBase])

  /* 필 라디오 토글 */
  useEffect(() => {
    document.querySelectorAll('[data-pills]').forEach(group => {
      group.querySelectorAll('.pill').forEach(p => {
        p.addEventListener('click', () => {
          group.querySelectorAll('.pill').forEach(x => x.classList.remove('on'))
          p.classList.add('on')
        })
      })
    })
  }, [])

  /* 제출 → pluug "제출 후 이동 링크" = /submit (전환 측정 성립 조건) */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.location.href = '/submit?src=pluug'
  }

  return (
    <main id="main">
      <div className="page-head">
        <div className="wrap">
          <h1><span className="w300">프로젝트</span> 문의</h1>
          <p>부담 없이 남겨주세요. 하루 안에 확인하고 연락드립니다.</p>
        </div>
      </div>

      <div className="wrap c-wrap">
        <div className="c-shell">

          {/* 좌측 — 신뢰 패널 */}
          <div className="c-left">
            <span className="k">Project Inquiry</span>
            <h2>프로젝트 이야기를<br /><em>들려주세요</em></h2>
            <p className="sub">아이디어 단계여도 괜찮습니다. 지금 상황 그대로 적어주시면 저희가 길을 잡아드립니다.</p>

            <div className="proms">
              <div className="prom"><i>✓</i>상담·견적은 무료입니다</div>
              <div className="prom"><i>✓</i>보통 24시간 안에 회신드립니다</div>
              <div className="prom"><i>✓</i>프로젝트에 맞는 빌더를 매칭합니다</div>
            </div>

            <div className="psteps">
              <span className="t">이후 진행</span>
              <div className="pstep"><span className="no">01</span><div><b>문의 접수</b><span>내용 확인</span></div></div>
              <div className="pstep"><span className="no">02</span><div><b>담당자 배정</b><span>맞는 빌더 매칭</span></div></div>
              <div className="pstep"><span className="no">03</span><div><b>상담 · 견적</b><span>범위·일정 확정</span></div></div>
              <div className="pstep"><span className="no">04</span><div><b>착수</b><span>단계별 확인 진행</span></div></div>
            </div>

            <div className="team">
              <div className="avs">
                <img src="/assets/img/av-josh.jpg" alt="빌더 조쉬" />
                <img src="/assets/img/av-ria.jpg" alt="빌더 리아" />
                <img src="/assets/img/av-yuna.jpg" alt="빌더 유나" />
                {/* 아바타 3장 + 나머지. 합이 Work 의 빌더 수(10)와 맞아야 한다 */}
                <span className="more">+7</span>
              </div>
              <p><b>검증된 빌더 10인</b>이<br />다음 프로젝트를 기다리고 있어요</p>
            </div>
          </div>

          {/* 우측 — 폼.
              pluug 주소가 설정돼 있으면 실제 폼을 얹는다. 문의 데이터는 우리 DB 로 오지 않고
              pluug 가 받는다 (README §절대 규칙).
              주소가 없으면 아래 목업 폼이 그대로 남는다 — 키 없이도 화면이 죽지 않아야 한다.
              ⚠ pluug 쪽 '제출 후 이동 링크'를 이 사이트의 /submit 으로 맞춰야 전환 측정이 성립한다. */}
          {formBase ? (
            <div className="c-form c-form--embed">
              {formSrc && (
                <iframe
                  src={formSrc}
                  title="프로젝트 문의 폼"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
              <p className="after-note">
                폼이 보이지 않으면 <a href={formSrc || formBase} target="_blank" rel="noopener noreferrer">새 창에서 열기</a> ·
                하루 안에 회신드려요
              </p>
            </div>
          ) : (
          <form className="c-form" data-form onSubmit={onSubmit}>
            <div className="f-2col">
              <div className="f-row"><label>회사 / 담당자명 <span className="req">*</span></label>
                <input required placeholder="회사명 · 성함" /></div>
              <div className="f-row"><label>연락처 <span className="req">*</span></label>
                <input required type="tel" placeholder="010-0000-0000" /></div>
            </div>
            <div className="f-row"><label>이메일 <span className="req">*</span></label>
              <input type="email" required placeholder="you@company.com" /></div>

            <div className="f-group"><label>프로젝트 유형 <span className="opt-t">선택</span></label>
              <div className="pills" data-pills>
                <button type="button" className="pill on">랜딩 · 웹사이트</button>
                <button type="button" className="pill">SaaS · 플랫폼</button>
                <button type="button" className="pill">AI 서비스</button>
                <button type="button" className="pill">모바일 앱</button>
                <button type="button" className="pill">기타</button>
              </div>
            </div>
            <div className="f-group"><label>예산 규모 <span className="opt-t">선택 — 미정이어도 괜찮아요</span></label>
              <div className="pills" data-pills>
                <button type="button" className="pill on">미정</button>
                <button type="button" className="pill">~1,000만</button>
                <button type="button" className="pill">1,000만~3,000만</button>
                <button type="button" className="pill">3,000만 이상</button>
              </div>
            </div>

            <div className="f-row"><label>프로젝트 내용 <span className="req">*</span></label>
              <textarea required placeholder="예) 예약 관리가 되는 학원용 웹서비스를 만들고 싶어요. 지금은 엑셀로 관리 중이고, 10월 오픈이 목표예요."></textarea>
              <p className="hint">만들고 싶은 것 · 현재 상황 · 희망 일정 — 이 세 가지면 충분합니다.</p>
            </div>

            <label className="agree"><input type="checkbox" required />
              <span>개인정보 수집·이용에 동의합니다. <Link href="/privacy">전문 보기</Link></span></label>

            <button className="btn btn--lime" type="submit">문의 보내기 <span className="arr">→</span></button>
            <p className="after-note">제출하면 <b>하루 안에</b> 회신드려요 · 광고성 연락은 하지 않습니다</p>
          </form>
          )}
        </div>
      </div>
    </main>
  )
}
