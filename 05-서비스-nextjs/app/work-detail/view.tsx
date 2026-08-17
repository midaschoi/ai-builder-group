'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function WorkDetailView() {
  useEffect(() => {
    window.track?.('work_detail_view', { slug: 'ai-상담챗봇', category: 'ai' })
  }, [])

  return (
    <main id="main">
      <div className="wrap wd-head">
        <Link className="backlink" href="/work">Work 목록으로</Link>
        <h1>AI 상담 챗봇 구축</h1>
        <p className="sum">반복 문의에 지친 고객센터를 위해, 2주 만에 검증한 상담 자동화 프로토타입</p>
        <div className="tags"><span className="tag">AI Service</span><span className="tag">Next.js</span><span className="tag num">2026</span></div>
      </div>

      <div className="wrap wd-cover">
        <div className="slot mask">
          <div className="bf">
            <div className="bf__bar"><i></i><i></i><i></i><span className="url">consult-bot.app</span></div>
            <div className="bf__body">
              <div className="row"><div className="bl" style={{ width: '22%', height: 12 }}></div><div className="bl bl--lime" style={{ width: 70, height: 12, borderRadius: 999 }}></div></div>
              <div className="bl" style={{ width: '52%', height: 26 }}></div>
              <div className="row" style={{ marginTop: 'auto' }}><div className="bl" style={{ flex: 3, height: 96 }}></div><div className="bl bl--soft" style={{ flex: 2, height: 96 }}></div></div>
            </div>
          </div>
          <div className="slot__spec"><b>Asset — Case Hero</b><span>실서비스 대표 화면 · 최고 퀄리티 1장</span><em>2100×1000px · 21:10 @2x</em></div>
        </div>
      </div>

      <div className="wrap wd-body">
        <article className="wd-art">
          <h2><span className="no">01</span>문제</h2>
          <p>클라이언트의 고객센터는 하루 문의의 70%가 동일한 유형의 반복 질문이었습니다. 상담 인력은 이미 포화 상태였고, 응대 품질은 시간대에 따라 크게 흔들렸습니다. AI 도입을 검토했지만 &quot;우리 데이터로 정말 되는지&quot;를 확인할 방법이 없어 결정을 미루고 있었습니다.</p>

          <h2><span className="no">02</span>해결</h2>
          <p>전면 도입 대신 2주짜리 PoC를 제안했습니다. 실제 상담 로그 중 빈도 상위 유형만 추려 지식 베이스를 만들고, 답변 정확도를 사람이 검수하는 구조로 붙였습니다.</p>

          {/* 서술 사이에 끼어드는 스크린샷 (significa 리듬) */}
          <figure className="shot">
            <div className="slot mask">
              <div className="bf">
                <div className="bf__bar"><i></i><i></i><i></i><span className="url">consult-bot.app/chat</span></div>
                <div className="bf__body">
                  <div className="bl" style={{ width: '40%', height: 16, borderRadius: '10px 10px 10px 3px' }}></div>
                  <div className="bl bl--soft" style={{ width: '52%', height: 24, borderRadius: '10px 10px 3px 10px', marginLeft: 'auto' }}></div>
                  <div className="bl" style={{ width: '46%', height: 20, borderRadius: '10px 10px 10px 3px' }}></div>
                  <div className="row" style={{ marginTop: 'auto' }}><div className="bl" style={{ flex: 1, height: 18, borderRadius: 999 }}></div><div className="bl bl--lime" style={{ width: 40, height: 18, borderRadius: 999 }}></div></div>
                </div>
              </div>
              <div className="slot__spec"><b>Asset — 상담 플로우</b><span>실제 대화 화면 (개인정보 마스킹)</span><em>1440×810px · 16:9</em></div>
            </div>
            <figcaption>FIG.01 — 상담 플로우. 애매한 질문은 자동으로 상담사에게 이관된다.</figcaption>
          </figure>

          <p>애매한 질문은 자동으로 상담사에게 넘어가도록 경계를 명확히 설계했습니다. AI가 다 하는 것처럼 보이게 만드는 것이 아니라, AI가 잘하는 범위를 정직하게 긋는 것이 이 프로젝트의 핵심 판단이었습니다.</p>

          <figure className="shot shot--pair">
            <div className="slot mask">
              <div className="bf">
                <div className="bf__bar"><i></i><i></i><i></i><span className="url">console — 검수 큐</span></div>
                <div className="bf__body">
                  <div className="bl" style={{ width: '56%', height: 12 }}></div>
                  <div className="bl" style={{ width: '100%', height: 16 }}></div><div className="bl bl--soft" style={{ width: '100%', height: 16 }}></div><div className="bl" style={{ width: '100%', height: 16 }}></div><div className="bl" style={{ width: '74%', height: 16 }}></div>
                </div>
              </div>
              <div className="slot__spec"><b>Asset — 검수 콘솔</b><span>답변 검수 큐 화면</span><em>800×1000px · 4:5</em></div>
            </div>
            <div className="slot mask">
              <div className="bf">
                <div className="bf__bar"><i></i><i></i><i></i><span className="url">console — 지표</span></div>
                <div className="bf__body">
                  <div className="row"><div className="bl bl--lime" style={{ flex: 1, height: 34 }}></div><div className="bl" style={{ flex: 1, height: 34 }}></div></div>
                  <div className="bl" style={{ width: '100%', height: 52, marginTop: 8 }}></div>
                  <div className="bl" style={{ width: '48%', height: 10, marginTop: 'auto' }}></div>
                </div>
              </div>
              <div className="slot__spec"><b>Asset — 지표 대시보드</b><span>정확도·이관율 차트 화면</span><em>800×1000px · 4:5</em></div>
            </div>
          </figure>

          <h2><span className="no">03</span>결과</h2>
          <p>2주 후 클라이언트는 실데이터 기반의 판단 근거를 얻었고, 반복 유형 응대를 자동화 전환하는 다음 단계 프로젝트로 이어졌습니다.</p>

          <blockquote>&quot;도입할지 말지를 2주 만에 데이터로 결정할 수 있었던 게 가장 컸습니다.&quot;
            <cite>— 클라이언트 담당자 인터뷰</cite></blockquote>

        </article>

        <aside className="aside">
          <div className="aside__head"><span>Project Sheet</span><span>W—001</span></div>
          <dl>
            <div className="row"><dt>기간</dt><dd className="num">2주 (PoC)</dd></div>
            <div className="row"><dt>연도</dt><dd className="num">2026</dd></div>
            <div className="row"><dt>범위</dt><dd>챗봇 · 관리 콘솔</dd></div>
            <div className="row"><dt>기술</dt><dd>Next.js · Supabase · LLM API</dd></div>
            <div className="row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}><dt>참여 빌더</dt><dd style={{ textAlign: 'left' }}>
              <Link className="b-chip" href="/builder?b=yuna" style={{ textDecoration: 'none' }}><i style={{ backgroundImage: 'url(/assets/img/av-yuna.webp)', backgroundSize: 'cover' }}></i>빌더 유나 · 개발</Link>
              <Link className="b-chip" href="/builder?b=josh" style={{ textDecoration: 'none' }}><i style={{ backgroundImage: 'url(/assets/img/av-josh.webp)', backgroundSize: 'cover' }}></i>빌더 조쉬 · 설계</Link>
            </dd></div>
          </dl>
          <p className="note">빌더 칩을 누르면 프로필과 작업물로 이동합니다.</p>
        </aside>
      </div>

      <section style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="wrap">
          <div className="cta-banner">
            <div>
              <h3>비슷한 프로젝트를 계획 중이신가요?</h3>
              <p>지금 상황을 알려주시면, 맞는 빌더와 진행 방식을 제안드립니다.</p>
            </div>
            <Link className="btn btn--lime" href="/contact" data-track="cta_click" data-location="work_detail">프로젝트 문의 <span className="arr">→</span></Link>
          </div>
        </div>
      </section>

    </main>
  )
}
