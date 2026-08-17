'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRibbonFlow, useDock, useCountUp } from '@/components/fx'
import type { BuilderCard, WorkCard } from '@/lib/content'

/* ── 수행 프로젝트 데이터 ──

   ⚠ 아래 PROJECTS 는 **시연용 샘플**이다. 관리자에 발행된 프로젝트가 하나도 없을 때만 쓴다.
     하나라도 발행되면 DB 쪽으로 통째로 바뀐다 (page.tsx 가 넘겨준다).
     오픈 전에 이 배열과 대응 이미지는 지워야 한다 — README §절대 규칙(미동의 샘플). */
type Project = {
  c: string; tag: string; yr: string; title: string; desc: string
  withTeam?: string; img: string; alt: string
  /** DB 에서 온 것만 채워진다 — 있으면 이 주소를 그대로 쓴다 */
  href?: string; cover?: string | null
}
const PROJECTS: Project[] = [
  { c: 'commerce', tag: 'Commerce', yr: '2026', title: 'iloom — 리빙 커머스 리뉴얼', desc: '가구 브랜드 일룸의 커머스 경험 개편. 상품 탐색부터 상담 전환까지 여정 재설계.', withTeam: 'with 똑똑한개발자 · 빌더 조쉬', img: 'work-iloom.png', alt: 'iloom 리빙 커머스 화면' },
  { c: 'aiax', tag: 'AI · AX', yr: '2026', title: 'DAISY — 대홍기획', desc: '광고 그룹의 AI 업무 플랫폼 · 빌더 유나', img: 'work-daisy.png', alt: 'DAISY AI 업무 플랫폼 화면' },
  { c: 'platform', tag: 'O2O', yr: '2025', title: 'Aerok User — 사용자 앱', desc: '예약·이용 플로우 전면 구축 · 빌더 리아', img: 'work-aerok-user.jpg', alt: 'Aerok 사용자 앱 화면' },
  { c: 'finance', tag: 'Finance', yr: '2025', title: 'NICE 정보통신 — 결제 인프라 어드민', desc: '결제 데이터 대시보드와 운영 콘솔. 금융 수준 권한·감사 로그 설계 포함.', withTeam: 'with 똑똑한개발자 · 빌더 도현', img: 'work-nice.png', alt: 'NICE 정보통신 결제 어드민 화면' },
  { c: 'platform', tag: 'SaaS · Admin', yr: '2025', title: 'Aerok Admin — 운영 콘솔', desc: '지점·정산 통합 관리 · 빌더 도현', img: 'work-aerok-admin.jpg', alt: 'Aerok 운영 콘솔 화면' },
  { c: 'commerce', tag: 'Media', yr: '2024', title: 'Btv 우리동네광고 — SK브로드밴드', desc: '소상공인 TV 광고 셀프 집행 플랫폼 · 빌더 조쉬', img: 'work-btv.png', alt: 'Btv 우리동네광고 화면' },
  { c: 'platform', tag: 'SaaS · Admin', yr: '2025', title: '마크스폰 EDK', desc: '기업 복지 커머스 운영 시스템 · 빌더 도현', img: 'work-markspon.png', alt: '마크스폰 EDK 화면' },
  { c: 'aiax', tag: 'AI · AX', yr: '2023', title: 'CANAPE — 도다마인드', desc: 'AI 심리 분석 서비스 · 빌더 유나', img: 'work-canape.png', alt: 'CANAPE AI 심리 분석 서비스 화면' },
  { c: 'platform', tag: 'Platform', yr: '2022', title: '패밀리케어 — 키즈노트', desc: '가족 돌봄 연결 서비스 · 빌더 리아', img: 'work-familycare.jpg', alt: '키즈노트 패밀리케어 화면' },
]

/* ── 빌더 프로필 데이터 ── */
type Builder = { slug: string; box: string; name: string; role: string; desc: string; stk: [string, string]; cnt: number; badge?: { cls: string; label: string }; avatar?: string | null }
const BUILDERS: Builder[] = [
  { slug: 'josh', box: 'bcard rv', name: '빌더 조쉬', role: '프로덕트 빌더 · 기획+개발', desc: '기획자·디자이너·개발자를 합친 원맨 프로덕트 빌더. AI 네이티브 운영법 인터뷰의 그 사람.', stk: ['Next.js', 'LLM API'], cnt: 14, badge: { cls: 'lv lv--lead', label: '✳ 이달의 빌더' } },
  { slug: 'ria', box: 'bcard rv d1', name: '빌더 리아', role: '랜딩 · 인터랙션', desc: '디자인 감도와 전환 설계가 강점. 수주용 랜딩과 브랜드 사이트를 주로 맡습니다.', stk: ['Interaction', 'GA4 설계'], cnt: 9 },
  { slug: 'dohyun', box: 'bcard rv d2', name: '빌더 도현', role: '플랫폼 · 어드민', desc: '데이터 모델링과 권한 설계 경험 다수. 관리자·정산 시스템을 안정적으로 짓습니다.', stk: ['Supabase', 'RBAC'], cnt: 11 },
  { slug: 'yuna', box: 'bcard rv d3', name: '빌더 유나', role: 'AI 서비스 · 에이전트', desc: 'LLM 연동·프롬프트 설계를 실무로 다룹니다. PoC부터 단계 검증으로 리스크를 줄입니다.', stk: ['Agents', 'RAG'], cnt: 7 },
  { slug: 'hajun', box: 'bcard rv', name: '빌더 하준', role: '모바일 앱 · 크로스플랫폼', desc: '하나의 코드베이스로 iOS·Android를 함께 짓습니다. 스토어 심사·배포까지 책임집니다.', stk: ['Flutter', '스토어 배포'], cnt: 6 },
  { slug: 'sein', box: 'bcard rv d1', name: '빌더 세인', role: '데이터 · 업무 자동화', desc: '반복되는 손작업을 파이프라인과 에이전트로 바꿉니다. 데이터가 흐르게 만드는 빌더.', stk: ['Python', 'n8n'], cnt: 5 },
  { slug: 'minseo', box: 'bcard rv d2', name: '빌더 민서', role: '브랜드 · 모션 디자인', desc: '디자인 시스템과 모션으로 서비스의 인상을 만듭니다. 개발자가 바로 쓸 수 있는 디자인.', stk: ['Design System', 'Motion'], cnt: 4 },
  { slug: 'taeo', box: 'bcard rv d2', name: '빌더 태오', role: '커머스 · 결제', desc: 'PG·정기결제 연동과 주문·정산 흐름 설계가 전문. 돈이 오가는 화면을 꼼꼼하게 짓습니다.', stk: ['PG 연동', '구독 결제'], cnt: 8, badge: { cls: 'lv lv--new', label: 'NEW' } },
  { slug: 'eunchae', box: 'bcard rv d3', name: '빌더 은채', role: '그로스 · SEO', desc: '검색 유입과 콘텐츠 구조를 설계합니다. 만든 뒤에 발견되게 하는 것까지가 일입니다.', stk: ['SEO', 'Analytics'], cnt: 5, badge: { cls: 'lv lv--new', label: 'NEW' } },
  { slug: 'junho', box: 'bcard rv d4', name: '빌더 준호', role: '운영 · 인프라', desc: '배포 자동화와 모니터링으로 서비스를 지킵니다. 출시 후에도 문제가 먼저 보이게.', stk: ['CI/CD', '모니터링'], cnt: 3, badge: { cls: 'lv lv--new', label: 'NEW' } },
]

/** DB 에서 온 발행 프로젝트를 이 화면이 쓰는 모양으로 맞춘다 */
function fromDb(list: WorkCard[]): Project[] {
  return list.map(w => ({
    c: w.category_slug,
    tag: w.category_name,
    yr: w.year,
    title: w.title,
    desc: w.summary,
    withTeam: w.members.length ? `with ${w.members.join(' · ')}` : undefined,
    img: '',
    alt: `${w.title} 화면`,
    href: `/work/${w.slug}`,
    cover: w.thumb_url,
  }))
}

export default function WorkView({
  works = [], builders = [], statRating = '',
}: {
  works?: WorkCard[]
  builders?: BuilderCard[]
  /* 근거 없는 수치는 기본값을 두지 않는다 (기획서 C2) — 비면 지표를 아예 뺀다 */
  statRating?: string
}) {
  /* 발행된 것이 하나라도 있으면 DB 를 쓰고, 없으면 샘플로 화면을 유지한다.
     둘을 섞지 않는다 — 섞으면 어느 것이 실제인지 화면에서 구분되지 않는다. */
  const projects = works.length > 0 ? fromDb(works) : PROJECTS

  /* 등록된 빌더가 있으면 DB, 없으면 샘플 (A-06 에서 채우면 그때 바뀐다) */
  const people: Builder[] = builders.length > 0
    ? builders.map((b, i) => ({
      slug: b.slug,
      /* rv/d1~d4 는 스크롤 리빌 지연 클래스다 — 카드가 한꺼번에 뜨지 않게 어긋 낸다 */
      box: i === 0 ? 'bcard rv' : `bcard rv d${i % 5}`,
      name: b.name,
      role: b.roleLabel,
      desc: b.oneLiner,
      stk: [b.stack[0] ?? '', b.stack[1] ?? ''],
      cnt: b.workCount,
      badge: b.badge ? { cls: b.badge.toUpperCase() === 'NEW' ? 'lv lv--new' : 'lv lv--lead', label: b.badge } : undefined,
      avatar: b.avatarUrl,
    }))
    : BUILDERS

  useRibbonFlow({
    rsW: [
      'AI 에이전트 ✳ 랜딩 ✳ 플랫폼 ✳ 모바일 앱 ✳ 자동화 ✳ ',
      'REAL PROJECTS ONLY ✳ 실제 서비스 URL 공개 ✳ ',
      '고르기 어려우면 30초 매칭 ✳ FIND YOUR BUILDER ✳ ',
      '기획부터 검수까지 ✳ ONE TEAM ✳ AI BUILDER GROUP ✳ ',
    ],
  }, { rsW: 5000 })
  useDock()
  useCountUp()

  /* 프로젝트 필터 */
  useEffect(() => {
    const cnt = document.querySelector('[data-cnt]')
    const cards = document.querySelectorAll<HTMLElement>('[data-list] .wcard')
    const empty = document.querySelector('[data-empty]') as HTMLElement | null
    const chips = Array.from(document.querySelectorAll<HTMLElement>('.chips .chip'))

    const apply = (cat: string, push: boolean) => {
      chips.forEach(c => {
        const on = c.dataset.cat === cat
        c.classList.toggle('on', on)
        c.setAttribute('aria-pressed', String(on))   /* 토글 버튼임을 보조기기에 알린다 */
      })
      let shown = 0
      cards.forEach(c => {
        const show = cat === 'all' || c.dataset.c === cat
        c.style.display = show ? '' : 'none'
        if (show) shown++
      })
      if (empty) empty.hidden = shown > 0
      /* '( 0' + shown 은 10건이 넘으면 ( 010 ) 이 된다 — 자리수를 맞춰 채운다 */
      if (cnt) cnt.textContent = '( ' + String(shown).padStart(2, '0') + ' )'
      if (push) history.replaceState(null, '', cat === 'all' ? '#' : '#category=' + cat)
    }

    chips.forEach(ch => ch.addEventListener('click', () => apply(ch.dataset.cat || 'all', true)))

    /* 주소에 #category=... 를 써두면서 정작 읽지는 않아서 그 링크로 들어오면
       칩은 '전체'인데 목록만 걸러진 것처럼 보였다 — 진입 시 한 번 맞춰준다. */
    const initial = new URLSearchParams(location.hash.replace(/^#/, '')).get('category')
    if (initial && chips.some(c => c.dataset.cat === initial)) apply(initial, false)
  }, [])

  /* 빌더 매칭 위저드 — 첫 답변에 따라 추천 빌더가 달라짐 */
  useEffect(() => {
    const MATCH: Record<string, [string, string, string, string, string][]> = {
      landing: [['리아', '랜딩 · 인터랙션 · 9건 수행', 'av-ria.jpg', 'BEST', 'ria'],
                ['민서', '브랜드 · 모션 디자인 · 4건 수행', 'av-minseo.jpg', '디자인', 'minseo']],
      platform: [['도현', '플랫폼 · 어드민 · 11건 수행', 'av-dohyun.jpg', 'BEST', 'dohyun'],
                 ['조쉬', '프로덕트 빌더 · 14건 수행', 'av-josh.jpg', 'LEAD', 'josh']],
      ai: [['유나', 'AI 서비스 · 에이전트 · 7건 수행', 'av-yuna.jpg', 'BEST', 'yuna'],
           ['세인', '데이터 · 업무 자동화 · 5건 수행', 'av-sein.jpg', '자동화', 'sein']],
      app: [['하준', '모바일 앱 · 크로스플랫폼 · 6건 수행', 'av-hajun.jpg', 'BEST', 'hajun'],
            ['리아', '랜딩 · 인터랙션 · 9건 수행', 'av-ria.jpg', '디자인', 'ria']],
    }
    let picked = 'ai'
    const go = (s: string) => {
      document.querySelectorAll<HTMLElement>('.qstep').forEach(x => x.classList.toggle('on', x.dataset.s === s))
      const done = s === 'r' ? 3 : (parseInt(s, 10) || 1)
      document.querySelectorAll('#prog i').forEach((seg, i) => seg.classList.toggle('done', i < done))
      if (s === 'r') renderPicks()
    }
    const renderPicks = () => {
      const box = document.querySelector('[data-picks]')
      if (!box) return
      box.innerHTML = (MATCH[picked] || MATCH.ai).map(b =>
        '<a class="pick" href="/builder?b=' + b[4] + '">'
        + '<img src="/assets/img/' + b[2] + '" alt="빌더 ' + b[0] + ' 프로필 사진">'
        + '<div><b>빌더 ' + b[0] + '</b><span>' + b[1] + '</span></div>'
        + '<span class="why">' + b[3] + '</span></a>').join('')
    }
    document.querySelectorAll<HTMLElement>('.opt').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.pick) picked = b.dataset.pick
        go(b.dataset.next || '1')
      })
    })
    document.querySelectorAll<HTMLElement>('.qback').forEach(b => {
      b.addEventListener('click', () => go(b.dataset.back || '1'))
    })
    document.querySelector('.redo')?.addEventListener('click', () => go('1'))
  }, [])

  return (
    <>
      <main id="main">
        <div className="page-head">
          <div className="wrap">
            <h1><span className="w300">만드는 사람과,</span> 만든 것들</h1>
            <p>추천받고 싶다면 30초 매칭으로, 직접 둘러보고 싶다면 작업물부터.</p>
            {/* 숫자는 최종 표기 그대로 둔다 — useCountUp 이 형식만 읽어 0부터 센다 */}
            <div className="head-stats rv">
              {/* 숫자는 DB 를 센 값이다. 손으로 적어두면 발행할 때마다 사실과 어긋난다 */}
              <div className="hstat"><b className="num" data-count>{people.length}</b><i className="unit">명</i><span>검증된 빌더</span></div>
              <span className="hstat-sep" aria-hidden="true">✳</span>
              <div className="hstat"><b className="num" data-count>{String(projects.length).padStart(2, '0')}</b><i className="unit">건</i><span>공개 프로젝트</span></div>
              {/* ⚠ 만족도는 근거가 있을 때만 보여준다 (기획서 C2 — 근거 없는 수치 금지).
                  A-08 에서 비워두면 이 지표가 화면에서 통째로 빠진다. */}
              {statRating && (
                <>
                  <span className="hstat-sep" aria-hidden="true">✳</span>
                  <div className="hstat"><b className="num" data-count>{statRating}</b><i className="unit">/5</i><span>평균 만족도</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* v19: 이음새 리본 — 페이지 헤드 ↔ 패널 */}
        <div className="ribbon-sep" aria-hidden="true">
          <svg viewBox="0 0 1600 200" preserveAspectRatio="xMidYMid slice">
            <path id="rsW" d="M -80,100 C 220,15 480,185 780,100 C 1080,15 1340,185 1700,100" fill="none" />
            <use href="#rsW" className="edge2" />
            <use href="#rsW" className="lane2" />
            <text className="t2">
              <textPath href="#rsW" data-wflow data-unit="5" data-speed="0.024" data-dir="rev">AI 에이전트 ✳ 랜딩 ✳ 플랫폼 ✳ 모바일 앱 ✳ 자동화 ✳ AI 에이전트 ✳ 랜딩 ✳ 플랫폼 ✳ 모바일 앱 ✳ 자동화 ✳ </textPath>
            </text>
          </svg>
        </div>

        <div className="wrap panels">

          {/* ── 패널 01 · 수행 프로젝트 ── */}
          <section className="panel panel--sand" id="works">
            <div className="panel__head">
              <div>
                <div className="panel__no"><i>01</i>직접 탐색</div>
                <h2>수행 프로젝트 <span className="head-cnt num" data-cnt>( {String(projects.length).padStart(2, '0')} )</span></h2>
                <p className="panel__sub">비슷한 결과물을 먼저 찾으세요 — 담당 빌더가 함께 보입니다.</p>
              </div>
              <div className="panel__side"><span>고르기 어렵다면</span><a href="#match">02 빠른 매칭 <i>↓</i></a></div>
            </div>

            {/* role="tablist" 였는데 자식이 role="tab" 도 aria-selected 도 없어서 보조기기에
                깨진 탭으로 읽혔다. 실제 동작은 토글 버튼 묶음이라 group + aria-pressed 가 맞다. */}
            <div className="chips" role="group" aria-label="분야별 보기" style={{ margin: '0 0 34px' }}>
              <button className="chip on" data-cat="all" aria-pressed="true">전체</button>
              <button className="chip" data-cat="aiax" aria-pressed="false">AI · AX</button>
              <button className="chip" data-cat="commerce" aria-pressed="false">Commerce</button>
              {/* 'SaaS · Admin' 이었지만 이 칩이 거르는 platform 에는 O2O · Platform 태그도 들어 있다 */}
              <button className="chip" data-cat="platform" aria-pressed="false">Platform · Admin</button>
              <button className="chip" data-cat="finance" aria-pressed="false">Finance</button>
            </div>

            <div className="pxg" data-list>
              {projects.map(p => (
                <Link className="wcard" href={p.href ?? '/work-detail'} data-c={p.c}
                  data-cursor="VIEW →" key={p.href ?? p.title}>
                  <div className="slot mask">
                    {/* 썸네일이 없는 발행 프로젝트도 있다 — 빈 칸으로 두면 카드 높이가 무너진다 */}
                    {(p.cover ?? (p.img ? `/assets/img/${p.img}` : null))
                      ? <img className="cover" src={p.cover ?? `/assets/img/${p.img}`} alt={p.alt} loading="lazy" />
                      : <span className="cover" aria-hidden="true" />}
                  </div>
                  <div className="meta">
                    <div className="mrow"><span className="tag">{p.tag}</span><span className="yr num">{p.yr}</span></div>
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                    {p.withTeam && <div className="builders">{p.withTeam}</div>}
                  </div>
                </Link>
              ))}
            </div>

            <div className="empty" data-empty hidden>
              <h3>이 분야의 첫 프로젝트가 곧 공개됩니다</h3>
              <p>고민 중인 프로젝트가 이 분야라면, 30초 매칭으로 알려주세요.</p>
              <a className="btn btn--ghost btn--sm" href="#match">30초 매칭 받기 ↓</a>
              <Link className="btn btn--ink btn--sm" href="/contact">문의하기 <span className="arr">→</span></Link>
            </div>

            <div className="list-note"><button className="btn btn--ghost">더 보기</button></div>
          </section>

          {/* ── 패널 02 · 빠른 매칭 ── */}
          <section className="panel panel--tint" id="match">
            <div className="panel__head">
              <div>
                <div className="panel__no"><i>02</i>빠른 매칭</div>
                <h2>딱 맞는 빌더를 찾아드려요</h2>
                <p className="panel__sub">세 번만 고르면 프로젝트에 맞는 빌더 2명을 추천해 드립니다.</p>
              </div>
              <div className="panel__side"><span>직접 고르고 싶다면</span><a className="up" href="#works">01 작업물 탐색 <i>↑</i></a></div>
            </div>

            <div className="quiz">
              <div className="quiz__head">
                <b><em>✳</em> 빌더 매칭</b>
                <span className="time">약 30초</span>
              </div>
              <div className="prog" id="prog"><i className="done"></i><i></i><i></i></div>
              <div className="quiz__body">
                <div className="qstep on" data-s="1">
                  <p className="qq"><small>질문 1 / 3</small>무엇을 만드시나요?</p>
                  <div className="opts">
                    <button className="opt" data-next="2" data-pick="landing">랜딩 페이지</button>
                    <button className="opt" data-next="2" data-pick="platform">웹 서비스 · 플랫폼</button>
                    <button className="opt" data-next="2" data-pick="ai">AI 기능 · 챗봇</button>
                    <button className="opt" data-next="2" data-pick="app">모바일 앱</button>
                  </div>
                </div>
                <div className="qstep" data-s="2">
                  <p className="qq"><small>질문 2 / 3</small>예산 범위는요?</p>
                  <div className="opts">
                    <button className="opt" data-next="3">500만 원 이하</button>
                    <button className="opt" data-next="3">500~1,500만 원</button>
                    <button className="opt" data-next="3">1,500만 원 이상</button>
                    <button className="opt" data-next="3">아직 모르겠어요</button>
                  </div>
                  <button className="qback" type="button" data-back="1">이전 질문</button>
                </div>
                <div className="qstep" data-s="3">
                  <p className="qq"><small>질문 3 / 3</small>언제 시작하고 싶으세요?</p>
                  <div className="opts">
                    <button className="opt" data-next="r">최대한 빨리</button>
                    <button className="opt" data-next="r">한 달 안</button>
                    <button className="opt" data-next="r">일정 협의 필요</button>
                  </div>
                  <button className="qback" type="button" data-back="2">이전 질문</button>
                </div>
                <div className="qstep qres" data-s="r">
                  <p className="lead">조건에 맞는 빌더 <em>2명</em>을 찾았어요. 문의를 남기면 이 구성으로 제안을 드립니다.</p>
                  <div className="picks" data-picks></div>
                  <Link className="btn btn--ink" href="/contact" data-track="cta_click" data-location="work_match">이 구성으로 문의하기 <span className="arr">→</span></Link>
                  <button className="qback" type="button" data-back="3">이전 질문</button>
                  <button className="redo" type="button">처음부터 다시</button>
                </div>
              </div>
            </div>
          </section>

          {/* ── 패널 03 · 빌더 프로필 ── */}
          <section className="panel panel--tint" id="builders">
            <div className="panel__head">
              <div>
                <div className="panel__no"><i>03</i>만드는 사람들</div>
                <h2>검증된 빌더 <span className="head-cnt num">( {String(people.length).padStart(2, '0')} )</span></h2>
                <p className="panel__sub">카드를 누르면 빌더의 프로필과 수행한 작업물을 볼 수 있습니다.</p>
              </div>
              <div className="panel__side"><span>누구에게 맡길지 고민된다면</span><a className="up" href="#match">02 빠른 매칭 <i>↑</i></a></div>
            </div>
            <div className="bld__grid">
              {people.map(b => (
                <Link className={b.box} href={`/builder?b=${b.slug}`} data-cursor="PROFILE →" data-track="builder_click" data-slug={b.slug} key={b.slug}>
                  <div className="slot mask">
                    {(b.avatar || !builders.length) && <img src={b.avatar ?? `/assets/img/av-${b.slug}.jpg`} alt={`${b.name} 프로필 사진`} />}
                    {b.badge && <span className={b.badge.cls}>{b.badge.label}</span>}
                    {/* 수행 건수는 이 카드에서 유일한 실적 근거다 — 알약으로 세워 먼저 읽히게 한다 */}
                    {/* 수행 건수는 이 카드에서 유일한 실적 근거다 — 0건이면 아예 감춘다.
                        "수행 0건" 을 띄우면 실적이 없다는 사실만 강조된다. */}
                    <div className="ct">
                      {b.cnt > 0 && <span className="cnt">수행 <b className="num">{b.cnt}</b>건</span>}
                      <span className="go">Profile →</span>
                    </div>
                    <div className="slot__spec"><b>Asset — 빌더 인물 사진</b><span>상반신 인물 컷 · 밝은 배경 통일</span><em>800×1000px · 4:5 @2x</em></div>
                  </div>
                  <div className="meta">
                    <b>{b.name}</b>
                    <span className="role">{b.role}</span>
                    <p>{b.desc}</p>
                    <div className="stk">{b.stk.filter(Boolean).map(t => <i key={t}>{t}</i>)}</div>
                  </div>
                </Link>
              ))}
            </div>
            <p className="bld-note">※ <b>✳ 이달의 빌더</b>는 매달 고객 평가로 새로 선정합니다 · <b>NEW</b>는 합류 90일 이내의 빌더입니다</p>
          </section>

        </div>

        <section>
          <div className="wrap">
            <div className="cta-banner">
              <div>
                <h3>비슷한 프로젝트를 계획 중이신가요?</h3>
                <p>프로젝트 이야기를 들려주세요. 맞는 빌더를 배정해 드립니다.</p>
              </div>
              <Link className="btn btn--lime" href="/contact" data-track="cta_click" data-location="work_detail">프로젝트 문의 <span className="arr">→</span></Link>
            </div>
          </div>
        </section>
      </main>

      {/* 플로팅 CTA 독 — 히어로 CTA와 화면상 비중복 (히어로/최종CTA 노출 시 숨김) */}
      <div className="dock" data-dock>
        <div className="dock__txt"><b>검증된 바이브 코딩</b><span>부담 없이 문의를 남겨보세요</span></div>
        <Link className="btn btn--lime btn--sm" href="/contact" data-track="cta_click" data-location="floating">프로젝트 문의 <span className="arr">→</span></Link>
        <button className="dock__x" aria-label="닫기" data-dock-x>✕</button>
      </div>
      <button className="dock-open" data-dock-open aria-label="문의 바 다시 열기">💬</button>
    </>
  )
}
