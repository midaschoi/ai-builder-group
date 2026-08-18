'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRibbonFlow, useDock } from '@/components/fx'
import type { Category, InsightCard } from '@/lib/content'

/* ⛔ 시연용 견본 배열(ARTICLES 8건)을 걷어냈다 — 사용자 요청.
     예전에는 발행 글이 0건이면 견본으로 되돌아갔고, 그래서 글을 지울 때마다
     가짜 글 8개가 되살아났다. 이제 화면은 항상 DB 만 본다. */
type Article = { c: string; img: string; title: string; cat: string; desc: string; meta: string; href?: string; cover?: string | null }
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
  /* 서버가 이미 걸러서 내려준다 — 카테고리는 링크(경로)다.
     IA §1 이 /insight/[category] 를 요구하므로 경로 쪽이 정답이다 (TR-04). */
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const all = fromDb(articles)

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

  /* ⛔ 예전의 클라이언트 카테고리 필터(.cats button 클릭 → 행 숨기기)는 걷어냈다.
       견본 모드 전용이었고, 그 버튼이 사라진 지금은 붙일 대상이 없다.
       카테고리 전환은 /insight/[category] 경로가 담당한다. */

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
            <Link className={active === '' ? 'on' : undefined} href="/insight">
              전체 <span className="cnt">{pad(total)}</span>
            </Link>
            {categories.map(c => (
              <Link key={c.slug} href={`/insight/${c.slug}`}
                className={active === c.slug ? 'on' : undefined}>
                {c.name} <span className="cnt">{pad(counts[c.slug] ?? 0)}</span>
              </Link>
            ))}
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

            {/* 견본이 사라졌으니 빈 화면은 서버가 직접 말해 준다.
                문구를 둘로 나눈다 — 사이트 전체가 비었는지, 이 카테고리만 비었는지는
                읽는 사람에게 전혀 다른 이야기다. */}
            {all.length === 0 && (
              <div className="empty" data-empty style={{ marginTop: 24 }}>
                {total === 0 ? (
                  <>
                    <h3>아직 발행된 글이 없습니다</h3>
                    <p>첫 인사이트를 준비하고 있습니다.</p>
                  </>
                ) : (
                  <>
                    <h3>이 주제의 첫 글을 준비 중입니다</h3>
                    <p>다른 카테고리의 글을 먼저 읽어보세요.</p>
                  </>
                )}
              </div>
            )}

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
