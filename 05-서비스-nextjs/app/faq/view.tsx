'use client'

import Link from 'next/link'
import FaqList from '@/components/FaqList'
import type { FaqTopic } from '@/app/_faq'
import { useDock, useRibbonFlow } from '@/components/fx'

export default function FaqView({ topics, defaultTopic }: { topics: FaqTopic[]; defaultTopic?: string }) {
  useRibbonFlow({
    rsF: [
      '무엇이든 물어보세요 ✳ 상담·견적 무료 ✳ 24시간 내 회신 ✳ ',
      'ASK ANYTHING ✳ NDA 가능 ✳ 부담 없이 남겨보세요 ✳ ',
      '기획부터 검수까지 ✳ ONE TEAM ✳ AI BUILDER GROUP ✳ ',
    ],
  }, { rsF: 5000 })
  useDock('sub')

  return (
    <>
      <main id="main">
        <div className="page-head">
          <div className="wrap">
            {/* FAQ 라벨은 뺐다 — GNB 에 FAQ 항목이 생겨 같은 말을 두 번 하게 된다 */}
            <h1><span className="w300">자주 묻는</span> 질문</h1>
            <p>문의 전에 가장 많이 받는 질문을 모았습니다. 여기서 답을 못 찾으셨다면 바로 물어봐 주세요.</p>
          </div>
        </div>

        {/* 이음새 리본 — 제목단 ↔ 문항. 다른 서브 페이지와 같은 규칙 (근거는 home.css 주석) */}
        <div className="ribbon-sep" aria-hidden="true">
          <svg viewBox="0 0 1600 200" preserveAspectRatio="xMidYMid slice">
            <path id="rsF" d="M -80,100 C 220,185 480,15 780,100 C 1080,185 1340,15 1700,100" fill="none" />
            <use href="#rsF" className="edge2" />
            <use href="#rsF" className="lane2" />
            <text className="t2">
              <textPath href="#rsF" data-wflow data-unit="4" data-speed="0.022">무엇이든 물어보세요 ✳ 상담·견적 무료 ✳ 24시간 내 회신 ✳ 무엇이든 물어보세요 ✳ 상담·견적 무료 ✳ 24시간 내 회신 ✳ </textPath>
            </text>
          </svg>
        </div>

        <section className="faqpage">
          <div className="wrap">
            {/* 데이터는 app/_faq.ts 한 곳에서 온다 — 홈 프리뷰와 같은 원본 */}
            <FaqList topics={topics} defaultTopic={defaultTopic} expandAll />

            <div className="faq-cta">
              <div>
                <b>찾으시는 답이 없나요?</b>
                <span>프로젝트 내용을 남겨 주시면 24시간 안에 회신드립니다.</span>
              </div>
              <Link className="btn btn--ink" href="/contact" data-track="cta_click" data-location="faq_bottom">
                프로젝트 문의 <span className="arr">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 플로팅 CTA 독 */}
      <div className="dock" data-dock>
        <div className="dock__txt"><b>검증된 바이브 코딩</b><span>무료 문의 — 부담 없이 남겨보세요</span></div>
        <Link className="btn btn--lime btn--sm" href="/contact" data-track="cta_click" data-location="floating">프로젝트 문의 <span className="arr">→</span></Link>
        <button className="dock__x" aria-label="닫기" data-dock-x>✕</button>
      </div>
      <button className="dock-open" data-dock-open aria-label="문의 바 다시 열기">💬</button>
    </>
  )
}
