'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRibbonFlow, useDock } from '@/components/fx'
import type { Category, InsightCard } from '@/lib/content'

/* ⚠ 아래 ARTICLES 는 **시연용 샘플**이다. 발행된 글이 하나도 없을 때만 쓴다.
     하나라도 발행되면 목록 전체가 DB 로 바뀐다 (page.tsx 가 넘겨준다). */
type Article = { c: string; img: string; title: string; cat: string; desc: string; meta: string; href?: string; cover?: string | null }
const ARTICLES: Article[] = [
  { c: 'ai-ax', img: 'ins-poc.webp', title: "AI PoC란? 기업 AI 도입 전 반드시 필요한 'PoC' 알아보기", cat: 'AI · AX', desc: '기업 AI 도입, 전면 구축 전에 PoC로 먼저 검증해야 하는 이유.', meta: '똑똑한개발자 · 2026.08.03' },
  { c: 'ai-ax', img: 'ins-agent.webp', title: '우리 회사에도 AI 에이전트가 필요할까? 5분 체크리스트', cat: 'AI · AX', desc: '도입이 필요한 조직의 신호 — 5분 만에 자가진단해 보세요.', meta: '똑똑한개발자 · 2026.07.22' },
  { c: 'guide', img: 'ins-quote.webp', title: '500만 원 vs 2,000만 원, 개발 외주 견적 비교 제대로 하는 법', cat: '발주 가이드', desc: '같은 앱인데 견적이 4배 차이 나는 이유를 뜯어봅니다.', meta: '똑똑한개발자 · 2026.07.03' },
  { c: 'guide', img: 'ins-turnkey.webp', title: '외주개발, 왜 올인원 턴키 팀과 함께 해야 할까?', cat: '발주 가이드', desc: '기획·디자인·개발을 따로 맡기면 실패하는 구조적 이유.', meta: '똑똑한개발자 · 2026.07.03' },
  { c: 'ai-ax', img: 'ins-ax.webp', title: 'AI 도입과 AX는 다르다 — 성과를 만드는 업무 설계 3가지', cat: 'AI · AX', desc: '도입했는데 성과가 없다면, AX와의 결정적 차이를 봐야 합니다.', meta: '똑똑한개발자 · 2026.07.16' },
  { c: 'project', img: 'ins-toss.webp', title: '토스 안에서 미니게임을? 똑똑한개발자 × 앱인토스', cat: '프로젝트', desc: '토스와 함께 미니게임을 만든 프로젝트 비하인드.', meta: '똑똑한개발자 · 2026.07.03' },
  { c: 'how', img: 'ins-native.webp', title: '기획·디자인·개발을 하나로 — AI 네이티브 에이전시 운영법', cat: '일하는 방식', desc: "'프로덕트 빌더'로 팀을 운영하는 방식, 빌더 조쉬와의 대화.", meta: '똑똑한개발자 · 2026.04.22' },
  { c: 'ai-ax', img: 'ins-gov.webp', title: '기업용 AI 도입, 왜 거버넌스가 먼저 필요할까?', cat: 'AI · AX', desc: '데이터 유출·통제 불능을 막는 AI 거버넌스 설계법.', meta: '똑똑한개발자 · 2026.07.14' },
]

function fromDb(list: InsightCard[]): Article[] {
  return list.map(a => ({
    c: a.category_slug,
    img: '',
    title: a.title,
    cat: a.category_name,
    desc: a.excerpt,
    meta: `${a.author} · ${a.published_at ? new Date(a.published_at).toLocaleDateString('ko-KR') : ''}`,
    href: `/insight/${a.slug}`,
    cover: a.thumb_url,
  }))
}

export default function InsightView({
  articles = [], categories = [], active = '', counts = {},
}: {
  articles?: InsightCard[]
  categories?: Category[]
  /** 카테고리 경로로 들어온 경우의 현재 슬러그. 빈 문자열이면 전체 */
  active?: string
  counts?: Record<string, number>
}) {
  /* DB 모드에서는 서버가 이미 걸러서 내려준다 — 카테고리는 링크(경로)가 되고,
     아래 useEffect 의 클라이언트 필터는 샘플 모드에서만 의미가 있다.
     IA §1 이 /insight/[category] 를 요구하므로 경로 쪽이 정답이다 (TR-04). */
  const live = articles.length > 0
  const all = live ? fromDb(articles) : ARTICLES
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  /* ── FR-P04-03 페이지네이션 (12건) ────────────────────────────────────
     서버 searchParams 로 하면 이 라우트가 통째로 동적 렌더가 된다 (SSG 포기).
     그래서 클라이언트에서 자르고 주소만 맞춘다 — `?category=` 를 다루는
     work/view.tsx 와 같은 방식이다.

     ⚠ 2페이지 이후 글이 HTML 에 없다는 뜻이지만, 색인은 사이트맵이 담당한다.
       sitemap.ts 가 발행된 글 **전부**의 상세 주소를 내보내므로 크롤 경로는 끊기지 않는다. */
  const PER = 12
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(all.length / PER))
  const cur = Math.min(page, pages)
  const rows = pages > 1 ? all.slice((cur - 1) * PER, cur * PER) : all

  /* 공유받은 `?page=3` 링크로 바로 들어올 수 있어야 한다 */
  useEffect(() => {
    const n = Number(new URLSearchParams(location.search).get('page'))
    if (Number.isInteger(n) && n > 1) setPage(n)
  }, [])

  const goto = (n: number) => {
    setPage(n)
    const url = n === 1 ? location.pathname : `${location.pathname}?page=${n}`
    history.replaceState(null, '', url)
    document.getElementById('main')?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  useRibbonFlow({
    rsI: [
      '발주 가이드 ✳ 일하는 방식 ✳ AI · AX ✳ 프로젝트 비하인드 ✳ ',
      'READ BEFORE YOU BUILD ✳ 외주 전 필독 ✳ ',
      '실패하는 발주에는 패턴이 있다 ✳ INSIGHT WEEKLY ✳ ',
      'AI BUILDER GROUP ✳ 우리의 생각을 공개합니다 ✳ ',
    ],
  }, { rsI: 5500 })
  useDock('sub')

  /* 카테고리 필터 */
  useEffect(() => {
    const rows = document.querySelectorAll<HTMLElement>('[data-list] .arow')
    const empty = document.querySelector('[data-empty]') as HTMLElement | null
    document.querySelectorAll<HTMLElement>('.cats button').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.cats button').forEach(x => x.classList.remove('on'))
        b.classList.add('on')
        const cat = b.dataset.cat
        let n = 0
        rows.forEach(r => {
          const show = cat === 'all' || r.dataset.c === cat
          r.style.display = show ? '' : 'none'
          if (show) n++
        })
        if (empty) empty.hidden = n > 0
        history.replaceState(null, '', cat === 'all' ? '#' : '#' + cat)
      })
    })
  }, [])

  return (
    <>
      <main id="main">
        <div className="page-head">
          <div className="wrap">
            <h1><span className="w300">우리의</span> 생각</h1>
            <p>파트너 똑똑한개발자의 실제 인사이트를 함께 발행합니다.</p>
          </div>
        </div>

        {/* v19: 이음새 리본 — 페이지 헤드 ↔ 목록 */}
        <div className="ribbon-sep" aria-hidden="true">
          <svg viewBox="0 0 1600 200" preserveAspectRatio="xMidYMid slice">
            <path id="rsI" d="M -80,100 C 220,185 480,15 780,100 C 1080,185 1340,15 1700,100" fill="none" />
            <use href="#rsI" className="edge" />
            <use href="#rsI" className="lane" />
            <text>
              <textPath href="#rsI" data-wflow data-unit="4" data-speed="0.02">발주 가이드 ✳ 일하는 방식 ✳ AI · AX ✳ 프로젝트 비하인드 ✳ 발주 가이드 ✳ 일하는 방식 ✳ AI · AX ✳ 프로젝트 비하인드 ✳ </textPath>
            </text>
          </svg>
        </div>

        <div className="wrap ins">
          {/* 카테고리: 전환 시 URL 경로 변경 (실서비스: /insight/[category]) */}
          <nav className="cats" aria-label="카테고리">
            {live ? (
              <>
                <Link className={active === '' ? 'on' : undefined} href="/insight">
                  전체 <span className="cnt">{pad(total)}</span>
                </Link>
                {categories.map(c => (
                  <Link key={c.slug} href={`/insight/${c.slug}`}
                    className={active === c.slug ? 'on' : undefined}>
                    {c.name} <span className="cnt">{pad(counts[c.slug] ?? 0)}</span>
                  </Link>
                ))}
              </>
            ) : (
              <>
                <button className="on" data-cat="all">전체 <span className="cnt">08</span></button>
                <button data-cat="ai-ax">AI · AX <span className="cnt">04</span></button>
                <button data-cat="guide">발주 가이드 <span className="cnt">02</span></button>
                <button data-cat="how">일하는 방식 <span className="cnt">01</span></button>
                <button data-cat="project">프로젝트 <span className="cnt">01</span></button>
              </>
            )}
          </nav>

          <div data-list>
            {rows.map(a => (
              <Link className="arow" href={a.href ?? '/insight-detail'} data-c={a.c}
                key={a.href ?? a.title}>
                {(a.cover ?? (a.img ? `/assets/img/ins/${a.img}` : null))
                  ? <img className="athumb" src={a.cover ?? `/assets/img/ins/${a.img}`} alt="" loading="lazy" />
                  : <span className="athumb" aria-hidden="true" />}
                <div>
                  <h3>{a.title}</h3>
                  <span className="cat">{a.cat}</span>
                  <p>{a.desc}</p>
                  <span className="meta">{a.meta}</span>
                </div>
              </Link>
            ))}

            <div className="empty" data-empty hidden style={{ marginTop: 24 }}>
              <h3>이 주제의 첫 글을 준비 중입니다</h3>
              <p>다른 카테고리의 글을 먼저 읽어보세요.</p>
            </div>

            {/* FR-P04-03 — 1페이지뿐이면 아예 그리지 않는다 */}
            {pages > 1 && (
              <nav className="pager" aria-label="페이지">
                <button type="button" onClick={() => goto(cur - 1)} disabled={cur === 1}>← 이전</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                  <button type="button" key={n} onClick={() => goto(n)}
                    className={n === cur ? 'on' : undefined}
                    aria-current={n === cur ? 'page' : undefined}>
                    {n}
                  </button>
                ))}
                <button type="button" onClick={() => goto(cur + 1)} disabled={cur === pages}>다음 →</button>
              </nav>
            )}
          </div>
        </div>
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
