'use client'

import Link from 'next/link'
import { useEffect, type CSSProperties } from 'react'
import { useRibbonFlow, useReplayOnView, useAccordion } from '@/components/fx'
import FaqList from '@/components/FaqList'
import type { FaqTopic } from './_faq'

/* 스테퍼 점등 순서를 CSS 변수로 넘긴다 (CSS 커스텀 속성이라 캐스트가 필요하다) */
const step = (i: number) => ({ '--i': i }) as CSSProperties

/* ── 히어로 스트림 블록 데이터 (원본 index.html 열 1·2·3, 6블록 ×2 루프) ── */
type Block =
  | { kind: 'shot'; h: number; url: string; img: string; alt: string }
  | { kind: 'duo'; h: number; a: string; b: string }

const shot = (h: number, url: string, img: string, alt: string): Block => ({ kind: 'shot', h, url, img, alt })
const duo = (h: number, a: string, b: string): Block => ({ kind: 'duo', h, a, b })

const COL1: Block[] = [
  shot(196, 'toktokhan.dev', 'ref-toktokhan.webp', '똑똑한개발자 메인 화면'),
  duo(234, 'm-kream.webp', 'm-codle.webp'),
  shot(200, 'toss.im', 'ref-toss.webp', '토스 메인 화면'),
  duo(228, 'm-kakaobank.webp', 'm-29cm.webp'),
  shot(198, 'kakaobank.com', 'ref-kakaobank.webp', '카카오뱅크 서비스 화면'),
  shot(192, 'daangn.com', 'ref-daangn.webp', '당근 메인 화면'),
]
const COL2: Block[] = [
  shot(200, 'builderschool.ai', 'ref-builderschool.webp', 'AI빌더스쿨 메인 화면'),
  duo(230, 'm-builderschool.webp', 'm-aidt.webp'),
  shot(196, '29cm.co.kr', 'ref-29cm.webp', '29CM 메인 화면'),
  shot(198, 'ai.codle.io', 'ref-codle.webp', '코들 메인 화면'),
  shot(194, 'zigbang.com', 'ref-zigbang.webp', '직방 메인 화면'),
  duo(232, 'm-29cm.webp', 'm-kream.webp'),
]
const COL3: Block[] = [
  shot(176, 'zigbang.com', 'ref-zigbang.webp', '직방 메인 화면'),
  duo(208, 'm-aidt.webp', 'm-kakaobank.webp'),
  shot(172, 'daangn.com', 'ref-daangn.webp', '당근 메인 화면'),
  shot(176, '29cm.co.kr', 'ref-29cm.webp', '29CM 메인 화면'),
  duo(206, 'm-codle.webp', 'm-builderschool.webp'),
  shot(176, 'toss.im', 'ref-toss.webp', '토스 메인 화면'),
]

/* 히어로 스트림은 같은 블록을 **두 벌** 이어 붙여 무한 흐름을 만든다.
   뒤쪽 한 벌은 이음매를 위한 복제라 첫 화면에 절대 보이지 않는다 — 그것만 지연시킨다.

   ⚠ 앞 벌에는 loading="lazy" 를 걸면 안 된다. 한 번 걸어 봤다가 성능이 66 → 61 로 떨어졌다.
     이 스트림의 이미지가 LCP 요소라서, 지연시키는 순간 Lighthouse 가
     "LCP image was lazily loaded" 로 감점한다. */
function StreamBlock({ b, dup }: { b: Block; dup: boolean }) {
  const defer = dup ? { loading: 'lazy' as const } : {}

  if (b.kind === 'shot') {
    return (
      <div className="sc slot" style={{ height: b.h }}>
        <div className="bf">
          <div className="bf__bar"><i></i><i></i><i></i><span className="url">{b.url}</span></div>
          <img className="shot" src={`/assets/img/${b.img}`} alt={b.alt} decoding="async" {...defer} />
        </div>
        <div className="shotshade"></div>
      </div>
    )
  }
  return (
    <div className="sc sc--duo slot" style={{ height: b.h }}>
      <img src={`/assets/img/${b.a}`} alt="" decoding="async" {...defer} />
      <img src={`/assets/img/${b.b}`} alt="" decoding="async" {...defer} />
    </div>
  )
}

function StreamCol({ blocks, cls }: { blocks: Block[]; cls: string }) {
  return (
    <div className={cls}>
      <div className="col-in">
        {[...blocks, ...blocks].map((b, i) => (
          <StreamBlock key={i} b={b} dup={i >= blocks.length} />
        ))}
      </div>
    </div>
  )
}

/* ── 라우렐 잎 SVG ── */
function Lv({ r = false }: { r?: boolean }) {
  return (
    <svg className={r ? 'lv lv--r' : 'lv'} viewBox="0 0 36 76" aria-hidden="true">
      <path d="M31 70 C15 60 9 44 12 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <g fill="currentColor">
        <ellipse cx="24.5" cy="66" rx="8" ry="3" transform="rotate(128 24.5 66)" />
        <ellipse cx="16.3" cy="56.5" rx="8" ry="3" transform="rotate(142 16.3 56.5)" />
        <ellipse cx="10.8" cy="45" rx="8" ry="3" transform="rotate(158 10.8 45)" />
        <ellipse cx="8" cy="32.4" rx="8" ry="3" transform="rotate(174 8 32.4)" />
        <ellipse cx="8.1" cy="19.8" rx="7.6" ry="2.8" transform="rotate(190 8.1 19.8)" />
        <ellipse cx="10.9" cy="8.2" rx="6.8" ry="2.6" transform="rotate(206 10.9 8.2)" />
        <ellipse cx="14" cy="3" rx="5" ry="2.1" transform="rotate(230 14 3)" />
      </g>
    </svg>
  )
}

const LAURELS = [
  { box: 'laurbox rv', cls: 'laur laur--blue', top: 'YOUTUBE CREATOR', big: '8.4만', sub: 'SUBSCRIBERS' },
  { box: 'laurbox rv d1', cls: 'laur laur--gold laur--wide', top: 'SELECTED BY', big: 'FORBES KOREA', sub: '30 UNDER 30' },
  { box: 'laurbox rv d2', cls: 'laur laur--ink', top: 'KOREA MARKET', big: 'No.1', sub: 'FREELANCER PLATFORM' },
]

/* ── 브랜드 로고월 ── */
const BRANDS1: [string, string][] = [
  ['asiana', '아시아나IDT'], ['appsintoss', 'apps in toss'], ['bluegarage', 'BLUE GARAGE'],
  ['nhnacademy', 'NHN ACADEMY'], ['woowa', '우아한형제들'], ['kakao', 'kakao'], ['tmoney', 'Tmoney'],
  ['kt', 'kt'], ['hanssem', '한샘'], ['hhi', '현대중공업'], ['aerok', 'Aerok'], ['skbio', 'SK바이오사이언스'],
]
const BRANDS2: [string, string][] = [
  ['shinhan', '신한은행'], ['nice', 'NICE정보통신'], ['linegames', 'LINE GAMES'], ['ksoe', '한국조선해양'],
  ['fastfive', 'FASTFIVE'], ['millie', '밀리의서재'], ['kyobo', '교보문고'], ['kmong', '크몽'],
  ['riiid', 'Riiid'], ['sm', 'SM Entertainment'], ['krafton', 'KRAFTON'],
]

function Bset({ brands }: { brands: [string, string][] }) {
  return (
    <div className="bset">
      {brands.map(([file, alt]) => (
        <img key={file} src={`/assets/img/brands/${file}.webp`} alt={alt} loading="lazy" />
      ))}
    </div>
  )
}

/* FAQ·히어로 문구·지표는 서버(page.tsx)가 DB 에서 읽어 넘긴다.
   값이 없으면 기존 문구를 그대로 쓴다 — 관리자 화면을 안 채워도 사이트가 그대로 뜬다. */
export default function HomeView({
  faq, heroTitle, heroSub, builderCount, workCount, statRating,
}: {
  faq: FaqTopic[]
  heroTitle: string
  heroSub: string
  builderCount: number
  workCount: number
  /** 근거 없는 수치는 기본값을 두지 않는다 (기획서 C2) — 비면 지표를 아예 뺀다 */
  statRating: string
}) {
  /* v19.5 이음새 리본 — 문구 덱 로테이션(페이드 전환) + 곡선 흐름.
     구현은 components/fx.ts 의 useRibbonFlow 한 곳으로 모았다 — 전에는 같은 스크립트가
     여기에 통째로 복제돼 있어서 성능 수정을 두 군데 해야 했다. */
  useRibbonFlow({
    rsepA: [
      'AI 에이전트 ✳ 랜딩 페이지 ✳ 플랫폼 ✳ 모바일 앱 ✳ 업무 자동화 ✳ ',
      'PLAN ✳ DESIGN ✳ BUILD ✳ REVIEW ✳ 올인원 턴키 ✳ ',
      '아이디어만 가져오세요 ✳ WE BUILD THE REST ✳ NDA 가능 ✳ ',
      'PoC 먼저, 확장은 그다음 ✳ SHIP FAST, SHIP RIGHT ✳ ',
    ],
    rsepB: [
      'VIBE CODING ✳ 검증된 빌더 ✳ AI BUILDER GROUP ✳ 외주를 해드립니다 ✳ ',
      'AI가 짓고, 사람이 검수합니다 ✳ MADE WITH AI, FINISHED BY HUMANS ✳ ',
      '상담·견적 무료 ✳ 24시간 내 회신 ✳ AI BUILDER GROUP ✳ ',
      '대충 만든 결과물은 통과 못 함 ✳ QUALITY GATE: ON ✳ 검수 통과분만 전달 ✳ ',
    ],
  }, { rsepA: 5200, rsepB: 4500 })
  /* 0.85 — 스테퍼가 화면에 거의 다 들어왔을 때 시작한다. 낮게 잡으면 아직 화면 끄트머리에
     있을 때 재생이 끝나서, 정작 눈이 갔을 땐 이미 다 켜져 있다. */
  useReplayOnView('[data-stepflow]', 'lit', 0.85)
  useAccordion('.wg', '.wcard')

  /* S2 스크롤 연동 · S3 자동 순환 · S5 탭 · 모바일 캐러셀 · S6 패럴랙스 · S8 퍼짐 전환 · S9 FAQ */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.matchMedia('(max-width: 900px)')
    const cleanups: (() => void)[] = []

    /* S2 */
    const warns = document.querySelectorAll('[data-warn]')
    const s2now = document.querySelector('[data-s2now]')
    const s2Update = () => {
      /* v22: 모바일에서도 스크롤 연동 동작 — 모바일은 화면 아래쪽(72%)에서 전환 */
      const mid = window.innerHeight * (mobile.matches ? 0.72 : 0.55)
      let act = 0
      warns.forEach((w, i) => {
        const r = w.getBoundingClientRect()
        const on = r.top < mid && r.bottom > mid * 0.5
        w.classList.toggle('active', on)
        if (on) act = i
      })
      if (s2now) s2now.textContent = '0' + (act + 1)
      document.querySelectorAll('[data-ic]').forEach((ic, j) => ic.classList.toggle('on', j === act))
    }
    window.addEventListener('scroll', s2Update, { passive: true })
    s2Update()
    cleanups.push(() => window.removeEventListener('scroll', s2Update))

    /* S3: 자동 순환 스텝 — 클릭 전환 + 호버 일시정지 */
    const steps = document.querySelectorAll('[data-steps] .step')
    const s3now = document.querySelector('[data-s3now]')
    if (steps.length) {
      let si = 0
      let s3timer = 0
      const setStep = (n: number) => {
        si = n
        steps.forEach((s, j) => s.classList.toggle('on', j === n))
        if (s3now) s3now.textContent = '0' + (n + 1)
      }
      const startS3 = () => { s3timer = window.setInterval(() => setStep((si + 1) % steps.length), 3600) }
      const stopS3 = () => clearInterval(s3timer)
      startS3()
      const sg = document.querySelector('[data-steps]') as HTMLElement
      sg.addEventListener('mouseenter', stopS3)
      sg.addEventListener('mouseleave', startS3)
      steps.forEach((s, j) => s.addEventListener('click', () => setStep(j)))
      cleanups.push(() => { clearInterval(s3timer); sg.removeEventListener('mouseenter', stopS3); sg.removeEventListener('mouseleave', startS3) })
    }

    /* S5 모바일 탭 — 한 번에 한 장만 펼친다 */
    const openOnly = (card: Element | null) =>
      document.querySelectorAll('.mcard').forEach(x => x.classList.toggle('open', x === card))
    document.querySelectorAll('.mcard').forEach(c => {
      c.addEventListener('click', () => {
        if (!mobile.matches) return
        openOnly(c.classList.contains('open') ? null : c)
      })
    })

    /* v22: 모바일 캐러셀 탭 슬라이드 — 검수(S4)·매칭(S5) 공용.
       기준을 960 → 900px 로 내렸다. 상세 토글과 그 CSS 는 900px 기준인데 캐러셀만 960 이라,
       901~960px 구간에서는 캐러셀이 탭을 가로채는데 토글은 꺼져 있어 카드가 아예 안 열렸다. */
    const cmq = window.matchMedia('(max-width: 900px)')
    const isAtSnap = (grid: Element, card: Element) => {
      const pad = parseFloat(getComputedStyle(grid).scrollPaddingLeft) || 0
      return Math.abs(card.getBoundingClientRect().left - grid.getBoundingClientRect().left - pad) < 24
    }
    const slideTo = (card: Element) => card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
    const s4grid = document.querySelector('.s4x__grid')
    if (s4grid) {
      const s4cards = Array.prototype.slice.call(s4grid.querySelectorAll('.s4x-card')) as Element[]
      s4cards.forEach((card, i) => {
        card.addEventListener('click', () => {
          if (!cmq.matches) return
          slideTo(isAtSnap(s4grid, card) ? s4cards[(i + 1) % s4cards.length] : card)
        })
      })
    }
    const s5grid = document.querySelector('.s5 .g3')
    if (s5grid) {
      const s5tap = (e: Event) => {
        if (!cmq.matches) return
        const card = (e.target as Element).closest('.mcard')
        if (!card || isAtSnap(s5grid, card)) return /* 정렬된 카드 탭은 기존 상세 토글로 */
        e.stopPropagation()
        slideTo(card)
        /* 끌어오기만 하고 끝내면 '눌렀는데 설명이 안 나온다'가 된다. 실제로 그랬다 —
           화면 밖 카드는 탭이 여기서 막혀 카드 자신의 토글까지 도달하지 못했다.
           끌어오면서 같이 펼친다. */
        openOnly(card)
      }
      s5grid.addEventListener('click', s5tap, true)
      cleanups.push(() => s5grid.removeEventListener('click', s5tap, true))
    }

    /* S6 패럴랙스 */
    const pars = document.querySelectorAll<HTMLElement>('.wcard .par')
    const parUpdate = () => {
      if (reduced || mobile.matches) return
      pars.forEach(p => {
        const slot = p.closest('.slot')
        if (!slot) return
        const r = slot.getBoundingClientRect()
        const t = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight
        p.style.transform = 'translateY(' + t * 24 + 'px)'
      })
    }
    window.addEventListener('scroll', parUpdate, { passive: true })
    parUpdate()
    cleanups.push(() => window.removeEventListener('scroll', parUpdate))

    /* S8 퍼짐 전환 */
    const ov = document.querySelector('[data-ov]') as HTMLElement | null
    const goTimers: number[] = []
    document.querySelectorAll('[data-expand]').forEach(v => {
      v.addEventListener('click', () => {
        window.track?.('youtube_outbound', { utm: 'utm_source=builder-group&utm_medium=content' })
        if (reduced || !ov) { window.location.href = '/content'; return }
        const r = v.getBoundingClientRect()
        ov.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;opacity:1;'
        requestAnimationFrame(() => {
          ov.classList.add('go')
          ov.style.cssText += 'left:0;top:0;width:100vw;height:100vh;'
        })
        goTimers.push(window.setTimeout(() => { window.location.href = '/content' }, 520))
      })
    })
    cleanups.push(() => goTimers.forEach(t => clearTimeout(t)))


    return () => cleanups.forEach(fn => fn())
  }, [])

  /* 플로팅 독 — 스크롤 진입 후 표시, 최종 CTA·푸터 근처/닫기 시 숨김 */
  useEffect(() => {
    const dock = document.querySelector('[data-dock]')
    if (!dock) return
    let closed = false
    try { closed = sessionStorage.getItem('dock') === '1' } catch {}
    const xbtn = document.querySelector('[data-dock-x]') as HTMLElement
    const reopen = document.querySelector('[data-dock-open]') as HTMLElement | null
    const syncReopen = () => { if (reopen) reopen.classList.toggle('show', closed) }
    const endEl = document.querySelector('.s10') || document.querySelector('.cta-banner') || document.querySelector('footer')
    const upd = () => {
      if (closed) return
      const nearEnd = !!endEl && endEl.getBoundingClientRect().top < window.innerHeight * 0.9
      dock.classList.toggle('show', window.scrollY > window.innerHeight * 0.85 && !nearEnd)
    }
    const onClose = () => {
      closed = true
      dock.classList.remove('show')
      try { sessionStorage.setItem('dock', '1') } catch {}
      syncReopen()
    }
    const onReopen = () => {
      closed = false
      try { sessionStorage.removeItem('dock') } catch {}
      syncReopen(); upd()
    }
    xbtn.addEventListener('click', onClose)
    if (reopen) reopen.addEventListener('click', onReopen)
    window.addEventListener('scroll', upd, { passive: true })
    upd(); syncReopen()
    return () => {
      window.removeEventListener('scroll', upd)
      xbtn.removeEventListener('click', onClose)
      if (reopen) reopen.removeEventListener('click', onReopen)
    }
  }, [])

  return (
    <>
      <main id="main" style={{ paddingTop: 0 }}>

        {/* ===== S1 Hero — 스트림: 데스크톱 실물 + 모바일 듀오 교차 ===== */}
        <section className="hero">
          <div className="hero__bg" aria-hidden="true"></div>
          <div className="hero-real"><i>✓</i>실제 제작 화면입니다</div>

          <div className="streamwrap" aria-hidden="true">
            <div className="stream">
              <StreamCol blocks={COL1} cls="col" />
              <StreamCol blocks={COL2} cls="col col--rev" />
              <StreamCol blocks={COL3} cls="col col--slow" />
            </div>
          </div>

          <div className="wrap hero__in">
            <span className="h1-over"><i>✓</i><em>검증된</em></span>
            <h1 className="st st1"><span className="w300">바이브 코딩으로,</span><br /><mark>외주</mark>를 해드립니다</h1>
            {/* 관리자(A-08)에서 바꾼 문구가 있으면 그것을 쓰고, 없으면 원래 문구를 그대로 둔다 */}
            <p className="st st2">
              {heroSub || '기획부터 개발, 검수까지 한 팀이 끝까지 맡습니다.'}<br />
              {heroTitle || '아이디어만 가져오세요 — 나머지는 검증된 빌더의 일입니다.'}
            </p>
            <div className="st st3 hero-ctas">
              <Link className="btn btn--ink btn--pulse" href="/contact" data-track="cta_click" data-location="hero">프로젝트 문의 <span className="arr">→</span></Link>
              {/* ⛔ cta_click 을 붙이지 않는다 — 이 링크는 /contact 가 아니라 /work 로 간다.
                  문의가 아닌 클릭을 문의 전환으로 세면 GA4 의 전환율이 부풀려진다.
                  한 번 들어간 데이터는 되돌려 고칠 수 없어서 태그를 뗀다 (FR-C-07 · 백로그 §2.1). */}
              <Link className="cta-sub" href="/work">작업물 먼저 보기 <span className="arr">→</span></Link>
            </div>
            {/* 숫자는 DB 를 센 값이다. 손으로 적어두면 발행할 때마다 사실과 어긋난다 */}
            <p className="st st3 hero-proof">
              <a className="proof-link" href="#builders">검증된 빌더 <b className="num">{builderCount}</b>인</a><i></i>
              <a className="proof-link" href="#work">공개 프로젝트 <b className="num">{workCount}</b>건</a><i></i>
              <a className="proof-link" href="#system"><b>검수 시스템</b> 운영</a>
            </p>
          </div>
          <div className="hero__scroll">SCROLL</div>
        </section>

        {/* v19: 이음새 리본 A — 히어로 ↔ 검수 시스템 (잉크 리본 · 서비스 키워드) */}
        <div className="ribbon-sep" aria-hidden="true">
          <svg viewBox="0 0 1600 220" preserveAspectRatio="xMidYMid slice">
            <path id="rsepA" d="M -80,132 C 220,20 480,244 780,132 C 1080,20 1340,244 1700,132" fill="none" />
            <use href="#rsepA" className="edge2" />
            <use href="#rsepA" className="lane2" />
            <text className="t2">
              <textPath href="#rsepA" data-wflow data-unit="5" data-speed="0.026" data-dir="rev">AI 에이전트 ✳ 랜딩 ✳ 플랫폼 ✳ 모바일 앱 ✳ 자동화 ✳ AI 에이전트 ✳ 랜딩 ✳ 플랫폼 ✳ 모바일 앱 ✳ 자동화 ✳ </textPath>
            </text>
          </svg>
        </div>

        {/* ===== S4 v10 — 아이코닉 카드 (정지 구간) ===== */}
        <section className="s4x" id="system">
          <div className="wrap">
            <div className="s4x__head">
              <h2><mark>대충</mark> 만든 결과물은<br />통과하지 못합니다</h2>
            </div>
            <div className="s4x__grid">
              {LAURELS.map(l => (
                <div className={l.box} key={l.top}>
                  <div className={l.cls}>
                    <Lv />
                    <span className="laur__txt"><span className="l-star">✦</span><span className="l-top">{l.top}</span><b>{l.big}</b><span className="l-sub">{l.sub}</span></span>
                    <Lv r />
                  </div>
                </div>
              ))}
              <div className="s4x-card rv">
                <div className="vis2 v2--edu">
                  <img className="v2-person" src="/assets/img/p-kiesop.webp" alt="김이솝" />
                  <div className="ic-pill ic-pill--side"><span className="spark">✦</span>커리큘럼 수료<span className="ok">✓</span></div>
                </div>
                <div className="bd2"><b>교육 — 김이솝 커리큘럼</b><span>그가 설계한 과정을 <mark>수료한 빌더만 투입</mark></span></div>
              </div>
              <div className="s4x-card rv d1">
                <div className="vis2 v2--sys">
                  <div className="v2-tok"><span>+ O ✳</span><em>(주)똑똑한개발자</em></div>
                  <div className="ic-team">
                    <span className="bub">오늘 검수 2건 통과 ✓</span>
                    <div className="avs"><i>조</i><i>리</i><i className="core">✳</i><i>도</i><i className="more">+24</i></div>
                  </div>
                </div>
                <div className="bd2"><b>검수 — (주)똑똑한개발자</b><span>크몽 자회사 — <mark>전 결과물 기준 심사</mark></span></div>
              </div>
              <div className="s4x-card rv d2">
                <div className="vis2 v2--match">
                  <img className="v2-kmong" src="/assets/img/p-kmong.webp" alt="크몽" />
                  <div className="ic-match ic-match--side">
                    <div className="chip2"><i>유</i><div><b>빌더 유나</b><span>AI 서비스</span></div></div>
                    <span className="done">매칭 완료</span>
                  </div>
                </div>
                <div className="bd2"><b>매칭·보증 — 크몽</b><span>거래·정산을 <mark>마켓 안전망이 보증</mark></span></div>
              </div>
            </div>
            {/* --i = 점등 순서. 사이의 .fline 까지 한 칸씩 세므로 0,1,2,… 로 이어 붙인다.
                nth-child 로 세면 선까지 섞여 순서가 어긋난다. */}
            <div className="sys__flow2" data-stepflow aria-label="검증 프로세스" style={{ marginTop: 72 }}>
              <span className="fstep" style={step(0)}><span className="dot">01</span><span className="lb2">교육<small>커리큘럼 수료</small></span></span>
              <span className="fline" style={step(1)}></span>
              <span className="fstep" style={step(2)}><span className="dot">02</span><span className="lb2">제작<small>검증된 빌더</small></span></span>
              <span className="fline" style={step(3)}></span>
              <span className="fstep" style={step(4)}><span className="dot">03</span><span className="lb2">검수<small>9년차 기준 심사</small></span></span>
              <span className="fline" style={step(5)}></span>
              <span className="fstep fstep--last" style={step(6)}><span className="dot">✓</span><span className="lb2">고객 전달<small>검수 통과분만</small></span></span>
            </div>
          </div>
        </section>

        {/* ===== S4b 파트너 실적 — 로고월 + 스탯 ===== */}
        <section className="s4b">
          <div className="wrap">
            <div className="s4x__brands">
              <h3>똑똑한 개발자는 다양한 기업의<br />복잡한 문제를 함께 해결해 왔습니다</h3>
              <p className="bsub">이제 그 기준을 바이브 코딩에 적용합니다</p>
              <p className="bcta"><mark>믿고 맡기세요</mark></p>
              <div className="bwall">
                <div className="brow"><div className="btrack"><Bset brands={BRANDS1} /><Bset brands={BRANDS1} /></div></div>
                <div className="brow"><div className="btrack btrack--rev"><Bset brands={BRANDS2} /><Bset brands={BRANDS2} /></div></div>
              </div>
            </div>
            <div className="s4x__stats" style={{ marginTop: 36 }}>
              <span className="st2"><b>3<em>단계</em></b><span>모든 단계 확인 후 진행</span></span>
              <span className="st2"><b>17<em>화면</em></b><span>범위를 화면 단위로 확정</span></span>
              <span className="st2"><b>3<em>주</em></b><span>랜딩 표준 납기</span></span>
              <span className="st2"><b>30<em>일</em></b><span>무상 하자보수 보장</span></span>
            </div>
          </div>
        </section>

        {/* ===== S2 문제 제기 v8 — Fixed + 스크롤 연동 ===== */}
        <section className="s2">
          <div className="wrap">
            <div className="s2__grid">
              <div className="s2__left">
                <h2>요즘 바이브 코딩 외주,<br />이런 곳은 조심하세요</h2>
                <p className="note">스크롤을 내리면, 실제로 시장에서 벌어지고 있는 일들이 하나씩 나타납니다.</p>
                <div className="s2__icons" aria-hidden="true">
                  <span data-ic><svg viewBox="0 0 24 24"><rect x="2.5" y="3.5" width="19" height="17" rx="2.5" fill="#FFFFFF" stroke="#0E0E0C" strokeWidth="1.6" /><path d="M2.5 6a2.5 2.5 0 0 1 2.5-2.5h14a2.5 2.5 0 0 1 2.5 2.5v2.5h-19z" fill="#2F80EA" stroke="#0E0E0C" strokeWidth="1.6" /><circle cx="5.8" cy="6" r=".9" fill="#FFFFFF" /><circle cx="8.6" cy="6" r=".9" fill="#FFFFFF" /><g stroke="#E5484D" strokeWidth="2.5" strokeLinecap="round"><line x1="9.5" y1="12.5" x2="14.5" y2="17.5" /><line x1="14.5" y1="12.5" x2="9.5" y2="17.5" /></g></svg></span>
                  <span data-ic><svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><g stroke="#2F80EA" strokeWidth="2.5"><polyline points="17 2.5 21 6.5 17 10.5" /><path d="M3 11v-.5a4 4 0 0 1 4-4h14" /></g><g stroke="#F5A623" strokeWidth="2.5"><polyline points="7 21.5 3 17.5 7 13.5" /><path d="M21 13v.5a4 4 0 0 1-4 4H3" /></g></svg></span>
                  <span data-ic><svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z" fill="#F5C542" stroke="#0E0E0C" strokeWidth="1.6" /><circle cx="7" cy="7" r="1.5" fill="#FFFFFF" stroke="#0E0E0C" strokeWidth="1.2" /><line x1="10.3" y1="17.7" x2="17.7" y2="10.3" stroke="#E5484D" strokeWidth="2.5" strokeLinecap="round" /></svg></span>
                </div>
                <p className="s2__count"><b data-s2now>01</b> / 03</p>
              </div>
              <div className="s2__right">
                <div className="warn warn--a" data-warn>
                  <span className="wnum">01</span>
                  <div>
                    <h3>포트폴리오 수백 개,<br />전부 목업인 업체</h3>
                    <p>실서비스 URL을 물어보세요. <mark>답 못 하면 목업</mark>입니다.</p>
                  </div>
                  <div className="w-fig w-fig1"><i></i><i></i><i></i><i></i><i className="real"></i><i></i><i></i><i></i><i></i></div>
                </div>
                <div className="warn warn--b" data-warn>
                  <span className="wnum">02</span>
                  <div>
                    <h3>모든 섹션이 똑같이<br />움직이는 사이트</h3>
                    <p>전부 같은 애니메이션이면 — <mark>한 번에 뽑은 겁니다.</mark></p>
                  </div>
                  <div className="w-fig w-fig2"><i></i><i></i><i></i></div>
                </div>
                <div className="warn warn--c" data-warn>
                  <span className="wnum">03</span>
                  <div>
                    <h3>싼 가격만 내세우는<br />반값 외주</h3>
                    <p>반값의 결말은 <mark>다시 만드는 비용</mark>입니다.</p>
                  </div>
                  <div className="w-fig w-fig3"><span className="tagp"><s>-50%</s></span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== S3 일하는 방식 v9 — 자동 순환 (클릭 전환 · 호버 일시정지) ===== */}
        <section className="s3 grain" id="how">
          <div className="wrap">
            <div className="s3__head">
              <h2><span className="w300">그래서 우리는,</span><br />일하는 방식이 다릅니다</h2>
              <span className="s3__cnt"><b data-s3now>01</b> / 04</span>
            </div>
            <div className="s3__grid" data-steps>
              <div className="step on">
                <span className="no">01</span>
                <h3>기획</h3>
                <p>요구사항을 화면 목록과 기능 명세로 확정합니다. 여기서 정해진 범위가 모든 판단의 기준선이 됩니다.</p>
                <span className="out">산출물 — 기획서 · IA · 화면 정의</span>
                <div className="bar"><i></i></div>
              </div>
              <div className="step">
                <span className="no">02</span>
                <h3>디자인 · 목업</h3>
                <p>기능이 동작하는 가상 사이트(목업)로 확인합니다. 그림이 아니라 실제로 눌러보고 결정합니다.</p>
                <span className="out">산출물 — 동작 목업 · 디자인 시안</span>
                <div className="bar"><i></i></div>
              </div>
              <div className="step">
                <span className="no">03</span>
                <h3>개발</h3>
                <p>확정된 시안과 화면상 100% 동일한 완성도로 구현합니다. 검색 최적화 세팅까지 기본입니다.</p>
                <span className="out">산출물 — 배포 사이트 · SEO 세팅</span>
                <div className="bar"><i></i></div>
              </div>
              <div className="step">
                <span className="no">04</span>
                <h3>검수 · 이관</h3>
                <p>단계마다 확인을 받고 진행하며, 완료 후 모든 계정과 권한을 안전하게 이전합니다.</p>
                <span className="out">산출물 — 인계 문서 · 계정 이관</span>
                <div className="bar"><i></i></div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== S5 맞춤 매칭 ===== */}
        <section className="s5" id="builders">
          <div className="wrap">
            <div className="s5__head">
              <h2><span className="w300">개발사를 고르지 마세요.</span><br />맞는 개발자를 매칭해 드립니다</h2>
              {/* ⛔ 위 hero 보조 링크와 같은 이유로 cta_click 을 붙이지 않는다 — 목적지가 /work 다 */}
              <Link className="btn btn--ghost s5__cta" href="/work#builders">어떤 빌더들인지 보러가기 <span className="arr">→</span></Link>
            </div>
            {/* '카드에 마우스를 올려보세요' 안내는 뺐다 — 조작법을 적어두는 건 내부 시연용 문구다.
                호버·탭 반응은 카드 자체가 알려줘야 한다. */}
            <p className="t-lead">프로젝트 성격에 맞는 빌더를 선별해 배정합니다.</p>
            <div className="grid g3">
              <div className="mcard mcard--light" tabIndex={0}>
                <div className="bg bgi bgi-1"><span className="mring"></span><svg className="mico" viewBox="0 0 96 96" aria-hidden="true"><rect x="8" y="14" width="80" height="64" rx="10" fill="none" stroke="currentColor" strokeWidth="5" /><line x1="8" y1="32" x2="88" y2="32" stroke="currentColor" strokeWidth="5" /><circle cx="20" cy="23" r="3.2" fill="currentColor" /><circle cx="31" cy="23" r="3.2" fill="currentColor" /><rect x="20" y="42" width="34" height="8" rx="4" fill="currentColor" /><rect x="20" y="56" width="22" height="8" rx="4" fill="currentColor" /><path d="M60 50 L78 65 L69 66.5 L64.5 75 Z" fill="currentColor" /></svg><span className="mdeco md1">✳</span><span className="mdeco md2">✦</span></div>
                <div className="shade"></div>
                <div className="plus">+</div>
                <div className="in">
                  <span className="k">Match — 01</span>
                  <h3>랜딩 · 웹사이트</h3>
                  <p className="sub">브랜드 사이트, 수주용 랜딩</p>
                  <div className="detail">
                    <p>디자인 감도와 인터랙션 구현력이 검증된 빌더가 맡습니다. 전환 트래킹 설계까지 포함합니다.</p>
                    <span className="who">Builder — Design &amp; Interaction</span>
                  </div>
                </div>
              </div>
              <div className="mcard" tabIndex={0}>
                <div className="bg bgi bgi-2"><span className="mring"></span><svg className="mico" viewBox="0 0 96 96" aria-hidden="true"><rect x="8" y="10" width="80" height="76" rx="12" fill="none" stroke="currentColor" strokeWidth="5" /><line x1="34" y1="10" x2="34" y2="86" stroke="currentColor" strokeWidth="5" /><rect x="15" y="22" width="12" height="5" rx="2.5" fill="currentColor" /><rect x="15" y="34" width="12" height="5" rx="2.5" fill="currentColor" /><rect x="15" y="46" width="12" height="5" rx="2.5" fill="currentColor" /><rect x="43" y="52" width="9" height="22" rx="3" fill="currentColor" /><rect x="58" y="40" width="9" height="34" rx="3" fill="currentColor" /><rect x="73" y="28" width="9" height="46" rx="3" fill="currentColor" /></svg><span className="mdeco md1">✦</span><span className="mdeco md2">✳</span></div>
                <div className="shade"></div>
                <div className="plus">+</div>
                <div className="in">
                  <span className="k">Match — 02</span>
                  <h3>SaaS · 플랫폼</h3>
                  <p className="sub">관리자·데이터 구조가 있는 서비스</p>
                  <div className="detail">
                    <p>데이터 모델링과 권한 설계 경험이 있는 빌더를 배정합니다. 규모가 크면 시니어 개발자와 투트랙으로.</p>
                    <span className="who">Builder — Data &amp; Architecture</span>
                  </div>
                </div>
              </div>
              <div className="mcard mcard--light" tabIndex={0}>
                <div className="bg bgi bgi-3"><span className="mring"></span><svg className="mico" viewBox="0 0 96 96" aria-hidden="true"><g stroke="currentColor" strokeWidth="10" strokeLinecap="round"><line x1="48" y1="14" x2="48" y2="82" /><line x1="19" y1="31" x2="77" y2="65" /><line x1="77" y1="31" x2="19" y2="65" /></g><circle cx="80" cy="16" r="6" fill="currentColor" /></svg><span className="mdeco md1">✦</span><span className="mdeco md2">✳</span></div>
                <div className="shade"></div>
                <div className="plus">+</div>
                <div className="in">
                  <span className="k">Match — 03</span>
                  <h3>AI 서비스</h3>
                  <p className="sub">LLM 연동, AI 기능 탑재</p>
                  <div className="detail">
                    <p>AI API 연동과 프롬프트 설계를 실무로 다뤄본 빌더가 맡습니다. PoC부터 단계적으로 검증합니다.</p>
                    <span className="who">Builder — LLM &amp; Evaluation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== S6 Work 프리뷰 ===== */}
        <section id="work">
          <div className="wrap">
            <div className="sec-head">
              <h2>완성한 프로젝트</h2>
              <Link className="more-link" href="/work">프로젝트 전체 보기</Link>
            </div>
            <p className="t-lead">실제로 수행한 프로젝트만 올립니다.</p>
            <div className="wg">
              <Link className="wcard" href="/work-detail" data-track="work_card" data-cursor="VIEW →">
                <div className="slot mask">
                  <div className="bf"><div className="bf__bar"><i></i><i></i><i></i><span className="url">consult-bot.app</span></div><img className="shot" src="/assets/img/ref-toktokhan.webp" alt="" /></div>
                  <div className="par"></div>
                  <div className="slot__spec"><b>Asset — Work Cover</b><span>실서비스 메인 화면 (브라우저 프레임)</span><em>1520×1045px · 16:11 @2x</em></div>
                </div>
                <div className="meta">
                  <div className="mrow"><span className="tag">AI Service</span><span className="yr num">2026 · 2wks</span></div>
                  <h3>AI 상담 챗봇 구축</h3>
                  <p>반복 문의 70%가 몰리던 고객센터의 상담 자동화 — 2주 PoC로 실데이터 검증 후 전환 프로젝트로 확장.</p>
                  {/* 한 줄 텍스트였는데 테두리 칩으로 나눴다 — 항목 경계가 보여야 읽힌다 */}
                  <div className="builders"><span>빌더 3인</span><span>Next.js</span><span>LLM API</span></div>
                </div>
              </Link>
              <Link className="wcard" href="/work-detail" data-cursor="VIEW →">
                <div className="slot mask">
                  <div className="bf"><div className="bf__bar"><i></i><i></i><i></i><span className="url">brand-landing.kr</span></div><img className="shot" src="/assets/img/ref-builderschool.webp" alt="" /></div>
                  <div className="par"></div>
                  <div className="slot__spec"><b>Asset — Work Cover</b><span>실서비스 히어로 화면</span><em>1520×1140px @2x</em></div>
                </div>
                <div className="meta">
                  <div className="mrow"><span className="tag">Landing</span><span className="yr num">2026 · 3wks</span></div>
                  <h3>수주용 브랜드 랜딩</h3>
                  {/* 세 장의 구조를 맞춘다: 설명 한 줄 + 팀·스택 칩.
                      전에는 '… · 빌더 2인' 처럼 인원이 설명 문장에 섞여 장마다 형태가 달랐다.

                      ⚠ data-sample="stack" — 원문에 기술 스택이 없어 채워 넣은 샘플이다.
                      실제 프로젝트 사실과 다를 수 있으니 발행 전 확인할 것.
                      값은 지어내지 않고 사이트의 빌더 프로필에서 가져왔다
                      (전환 트래킹 → 빌더 리아의 'GA4 설계'). 찾으려면 data-sample 로 grep. */}
                  <p>수주 문의로 이어지는 흐름까지 설계한 브랜드 랜딩. 전환 트래킹 이벤트 정의를 포함합니다.</p>
                  <div className="builders" data-sample="stack"><span>빌더 2인</span><span>Next.js</span><span>GA4</span></div>
                </div>
              </Link>
              <Link className="wcard" href="/work-detail" data-cursor="VIEW →">
                <div className="slot mask">
                  <div className="bf"><div className="bf__bar"><i></i><i></i><i></i><span className="url">cms.studio.io</span></div><img className="shot" src="/assets/img/ref-codle.webp" alt="" /></div>
                  <div className="par"></div>
                  <div className="slot__spec"><b>Asset — Work Cover</b><span>관리자 콘솔 화면</span><em>1520×855px · 16:9 @2x</em></div>
                </div>
                <div className="meta">
                  <div className="mrow"><span className="tag">Platform</span><span className="yr num">2026 · 6wks</span></div>
                  <h3>콘텐츠 관리 플랫폼</h3>
                  <p>비개발자도 운영 가능한 관리자·에디터. 발행 워크플로와 권한 설계 포함.</p>
                  {/* ⚠ 샘플 — 위 02 주석 참조 (권한 설계 → 빌더 도현의 'Supabase · RBAC') */}
                  <div className="builders" data-sample="stack"><span>빌더 3인</span><span>Supabase</span><span>RBAC</span></div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== S7 Insight 프리뷰 — 정지 · 제목 우선 ===== */}
        <section className="s7">
          <div className="wrap">
            <div className="sec-head">
              <h2>우리의 생각</h2>
              <Link className="more-link" href="/insight">인사이트 전체 보기</Link>
            </div>
            {/* ⚠ data-sample="thumb" — /insight 목록의 썸네일을 주제가 가까운 것으로 빌려 왔다.
                그 이미지들에는 각자 다른 글 제목이 박혀 있어서, 이 크기(96×64)에서는 질감으로만
                읽히지만 확대하면 문구가 어긋난다. 글마다 전용 썸네일이 생기면 교체할 것.
                찾으려면 grep -rn 'data-sample' app/ */}
            <Link className="irow" href="/insight-detail">
              <img className="ithumb" data-sample="thumb" src="/assets/img/ins/ins-turnkey.webp" alt="" loading="lazy" decoding="async" />
              <span className="t">바이브 코딩 외주, 잘하는 곳과 못하는 곳의 차이</span>
              <span className="meta"><span className="tag">발주 가이드</span><span className="d num">2026.08.11</span></span>
            </Link>
            <Link className="irow" href="/insight-detail">
              <img className="ithumb" data-sample="thumb" src="/assets/img/ins/ins-native.webp" alt="" loading="lazy" decoding="async" />
              <span className="t">우리가 3주 만에 랜딩 페이지를 만드는 순서</span>
              <span className="meta"><span className="tag">일하는 방식</span><span className="d num">2026.08.09</span></span>
            </Link>
            <Link className="irow" href="/insight-detail">
              <img className="ithumb" data-sample="thumb" src="/assets/img/ins/ins-poc.webp" alt="" loading="lazy" decoding="async" />
              <span className="t">새 AI 툴을 실무에 붙일 때 우리가 확인하는 것들</span>
              <span className="meta"><span className="tag">AI 활용</span><span className="d num">2026.08.07</span></span>
            </Link>
          </div>
        </section>

        {/* v19: 이음새 리본 B — 인사이트 ↔ 콘텐츠(다크) (라임 리본 · 브랜드 문구) */}
        <div className="ribbon-sep" aria-hidden="true">
          <svg viewBox="0 0 1600 220" preserveAspectRatio="xMidYMid slice">
            <path id="rsepB" d="M -80,128 C 220,240 480,16 780,128 C 1080,240 1340,16 1700,128" fill="none" />
            <use href="#rsepB" className="edge" />
            <use href="#rsepB" className="lane" />
            <text>
              <textPath href="#rsepB" data-wflow data-unit="4" data-speed="0.02">VIBE CODING ✳ 검증된 빌더 ✳ AI BUILDER GROUP ✳ 외주를 해드립니다 ✳ VIBE CODING ✳ 검증된 빌더 ✳ AI BUILDER GROUP ✳ 외주를 해드립니다 ✳ </textPath>
            </text>
          </svg>
        </div>

        {/* ===== S8 콘텐츠·유튜브 ===== */}
        <section className="s8 grain">
          <div className="wrap">
            <div className="sec-head">
              <h2>영상으로 보는 우리의 작업</h2>
              <Link className="more-link" href="/content">콘텐츠 탭</Link>
            </div>
            <p className="t-lead">세 채널에서 매주 실전 바이브 코딩 콘텐츠가 올라옵니다.</p>
            <div className="vgrid">
              <div className="vcell slot" data-expand data-track="youtube_outbound" data-slug="featured">
                <img className="vimg" src="https://i.ytimg.com/vi/0dBSo3eDE-E/hqdefault.jpg" alt="똑똑한개발자 — 2025 상반기 워크샵" loading="lazy" />
                <div className="vshade"></div>
                <span className="dur num">15:47</span>
                <div className="play"><i>▶</i></div>
                <div className="cap"><b>2025 똑똑한개발자 상반기 워크샵</b><span>똑똑한개발자 · 오피셜</span></div>
                <div className="slot__spec"><b>Asset — YouTube</b><span>유튜브 썸네일 원본으로 교체</span><em>1280×720px · 16:9</em></div>
              </div>
              <div className="vside">
                <div className="vcell slot" data-expand style={{ aspectRatio: '16/8' }}>
                  <img className="vimg" src="https://i.ytimg.com/vi/ZIn53VIic14/hqdefault.jpg" alt="김이솝 — AI 동물 인터뷰 쇼츠 만들기" loading="lazy" />
                  <div className="vshade"></div>
                  <span className="dur num">7:57</span><div className="play"><i>▶</i></div>
                  <div className="cap"><b>AI 동물 인터뷰 쇼츠 만들기 7분만에 끝!</b></div>
                </div>
                <div className="vcell slot" data-expand style={{ aspectRatio: '16/8' }}>
                  <img className="vimg" src="https://i.ytimg.com/vi/TP6ArUCnt8c/hqdefault.jpg" alt="똑똑한개발자 — 원티드 하이파이브 컨퍼런스" loading="lazy" />
                  <div className="vshade"></div>
                  <span className="dur num">17:36</span><div className="play"><i>▶</i></div>
                  <div className="cap"><b>잘봐 이게 컨퍼런스다 — 똑똑한개발자 × 원티드</b></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== S9 FAQ ===== */}
        <section className="s9" id="faq">
          <div className="wrap">
            <div className="sec-head">
              <h2>자주 묻는 질문</h2>
              <Link className="more-link" href="/faq">질문 전체 보기</Link>
            </div>
            <p className="t-lead">문의 전에 가장 많이 받는 질문을 모았습니다.</p>
            {/* 데이터는 app/_faq.ts 한 곳에서 온다 — /faq 페이지와 같은 원본 */}
            <FaqList topics={faq} />
          </div>
        </section>

        {/* ===== S10 최종 CTA ===== */}
        {/* roomy(176px) 를 뺐다 — 앞 섹션의 아래 여백 136px 과 더해져 312px 이 비었다.
            마무리 CTA 라 위쪽은 조이고 아래(푸터 앞)만 넉넉히 둔다. */}
        <section className="s10">
          <div className="wrap">
            <span className="ast" aria-hidden="true">✳</span>
            <h2><span className="w300">만들고 싶은 것이</span><br />있으신가요?</h2>
            <p>지금 프로젝트를 문의해 주세요. 빠르게 연락드립니다.</p>
            <Link className="btn btn--lime" href="/contact" data-track="cta_click" data-location="footer_cta" style={{ fontSize: 17, padding: '18px 38px' }}>프로젝트 문의 <span className="arr">→</span></Link>
          </div>
        </section>

      </main>

      {/* 플로팅 CTA 독 — 히어로 CTA와 화면상 비중복 (히어로/최종CTA 노출 시 숨김) */}
      <div className="dock" data-dock>
        <div className="dock__txt"><b>검증된 바이브 코딩</b><span>무료 문의 — 부담 없이 남겨보세요</span></div>
        <Link className="btn btn--lime btn--sm" href="/contact" data-track="cta_click" data-location="floating">프로젝트 문의 <span className="arr">→</span></Link>
        <button className="dock__x" aria-label="닫기" data-dock-x>✕</button>
      </div>
      <button className="dock-open" data-dock-open aria-label="문의 바 다시 열기">💬</button>

      <div className="expand-ov" data-ov></div>
    </>
  )
}
