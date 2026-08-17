'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/* 프로필 렌더 — 원본 builder.html 인라인 스크립트 이식.
   URL 쿼리(?b=슬러그)에 따라 data-el 슬롯에 프로필을 채운다 */
type ProjectDef = { t: string; d: string; img: string; tag: string; yr: string; w: boolean }
type BuilderDef = {
  no: string; name: string; fname: string; lv: string; lead: boolean; fresh?: boolean
  role: string; img: string; bio: string; focus: string; stack: string[]; done: number
  principles: [string, string][]
  extra: { label: string; href: string } | null
  projects: string[]
}

const PROJECTS: Record<string, ProjectDef> = {
  iloom: { t: 'iloom — 리빙 커머스 리뉴얼', d: '가구 브랜드 일룸의 커머스 경험 개편. 상품 탐색부터 상담 전환까지 여정 재설계.', img: '/assets/img/work-iloom.webp', tag: 'Commerce', yr: '2026', w: true },
  daisy: { t: 'DAISY — 대홍기획', d: '광고 그룹의 AI 업무 플랫폼 구축.', img: '/assets/img/work-daisy.webp', tag: 'AI · AX', yr: '2026', w: true },
  aerokUser: { t: 'Aerok User — 사용자 앱', d: '예약·이용 플로우 전면 구축.', img: '/assets/img/work-aerok-user.webp', tag: 'O2O', yr: '2025', w: false },
  nice: { t: 'NICE 정보통신 — 결제 인프라 어드민', d: '결제 데이터 대시보드와 운영 콘솔. 금융 수준 권한·감사 로그 설계 포함.', img: '/assets/img/work-nice.webp', tag: 'Finance', yr: '2025', w: true },
  aerokAdmin: { t: 'Aerok Admin — 운영 콘솔', d: '지점·정산 통합 관리 시스템.', img: '/assets/img/work-aerok-admin.webp', tag: 'SaaS · Admin', yr: '2025', w: false },
  btv: { t: 'Btv 우리동네광고 — SK브로드밴드', d: '소상공인 TV 광고 셀프 집행 플랫폼.', img: '/assets/img/work-btv.webp', tag: 'Media', yr: '2024', w: true },
  markspon: { t: '마크스폰 EDK', d: '기업 복지 커머스 운영 시스템.', img: '/assets/img/work-markspon.webp', tag: 'SaaS · Admin', yr: '2025', w: false },
  canape: { t: 'CANAPE — 도다마인드', d: 'AI 심리 분석 서비스.', img: '/assets/img/work-canape.webp', tag: 'AI · AX', yr: '2023', w: false },
  familycare: { t: '패밀리케어 — 키즈노트', d: '가족 돌봄 연결 서비스.', img: '/assets/img/work-familycare.webp', tag: 'Platform', yr: '2022', w: false },
}

const BUILDERS: Record<string, BuilderDef> = {
  josh: {
    no: 'B—001', name: '빌더 조쉬', fname: '조쉬', lv: '✳ 이달의 빌더', lead: true,
    role: '프로덕트 빌더 · 기획+개발', img: '/assets/img/av-josh.webp',
    bio: '기획자·디자이너·개발자를 합친 원맨 프로덕트 빌더입니다. 요구사항 정리부터 배포까지 한 사람이 끝까지 책임지는 방식으로 일하며, 전달 과정에서 생기는 손실을 없애는 것이 강점입니다. AI 네이티브 운영법 인터뷰의 그 사람.',
    focus: '프로덕트 전체 · MVP · 검증', stack: ['Next.js', 'LLM API', 'Supabase'], done: 14,
    principles: [
      ['한 사람이 끝까지', '기획·디자인·개발이 한 머리에서 나옵니다. 전달 손실이 없고, 의사결정이 빠릅니다.'],
      ['말보다 화면', '요구사항은 문서 대신 동작하는 화면으로 정리합니다. 첫 미팅에서 러프 목업을 함께 봅니다.'],
      ['AI 네이티브', '반복 작업은 에이전트에 맡기고, 사람의 시간은 판단에 씁니다.'],
    ],
    extra: { label: 'AI 네이티브 운영법 인터뷰 보기', href: '/insight-detail' },
    projects: ['iloom', 'btv'],
  },
  ria: {
    no: 'B—002', name: '빌더 리아', fname: '리아', lv: 'Builder', lead: false,
    role: '랜딩 · 인터랙션', img: '/assets/img/av-ria.webp',
    bio: '디자인 감도와 전환 설계가 강점인 빌더입니다. 수주용 랜딩과 브랜드 사이트를 주로 맡으며, 화면의 인상보다 화면이 만들어내는 행동을 먼저 설계합니다.',
    focus: '수주용 랜딩 · 브랜드 사이트', stack: ['Interaction', 'GA4 설계'], done: 9,
    principles: [
      ['전환에서 역산', '예쁜 화면이 아니라 문의가 생기는 화면을 설계합니다. CTA 동선부터 그립니다.'],
      ['인터랙션은 근거 위에', '움직임 하나에도 시선 흐름의 이유를 답니다. 과한 모션은 뺍니다.'],
      ['측정 가능한 디자인', 'GA4 이벤트 설계까지 랜딩의 일부로 봅니다. 열어보고 고칠 수 있게 만듭니다.'],
    ],
    extra: null,
    projects: ['aerokUser', 'familycare'],
  },
  dohyun: {
    no: 'B—003', name: '빌더 도현', fname: '도현', lv: 'Builder', lead: false,
    role: '플랫폼 · 어드민', img: '/assets/img/av-dohyun.webp',
    bio: '데이터 모델링과 권한 설계 경험이 많은 빌더입니다. 관리자·정산처럼 틀리면 안 되는 시스템을 안정적으로 짓는 것이 전문입니다.',
    focus: '어드민 · 정산 · 권한 설계', stack: ['Supabase', 'RBAC'], done: 11,
    principles: [
      ['데이터 모델이 먼저', '화면보다 테이블을 먼저 그립니다. 구조가 맞으면 화면은 따라옵니다.'],
      ['권한은 처음부터', 'RBAC는 나중에 붙이면 늦습니다. 설계 단계에서 역할과 경계를 확정합니다.'],
      ['운영자도 사용자', '어드민을 쓰는 운영자의 하루를 기준으로 화면을 짭니다.'],
    ],
    extra: null,
    projects: ['nice', 'aerokAdmin', 'markspon'],
  },
  yuna: {
    no: 'B—004', name: '빌더 유나', fname: '유나', lv: 'Builder', lead: false,
    role: 'AI 서비스 · 에이전트', img: '/assets/img/av-yuna.webp',
    bio: 'LLM 연동과 프롬프트 설계를 실무로 다루는 빌더입니다. 전면 도입 대신 PoC부터 단계 검증으로 리스크를 줄이며 AI 서비스를 만듭니다.',
    focus: 'LLM 연동 · 에이전트 · PoC', stack: ['Agents', 'RAG'], done: 7,
    principles: [
      ['PoC로 먼저 증명', '전면 도입 전에 실데이터로 작게 검증합니다. 판단 근거를 만드는 것이 먼저입니다.'],
      ['AI의 경계를 정직하게', 'AI가 잘하는 범위를 긋고, 나머지는 사람에게 넘기는 구조로 설계합니다.'],
      ['프롬프트도 코드처럼', '버전 관리와 평가 없이 배포하지 않습니다.'],
    ],
    extra: null,
    projects: ['daisy', 'canape'],
  },
  hajun: {
    no: 'B—005', name: '빌더 하준', fname: '하준', lv: 'Builder', lead: false,
    role: '모바일 앱 · 크로스플랫폼', img: '/assets/img/av-hajun.webp',
    bio: '하나의 코드베이스로 iOS·Android를 함께 짓는 모바일 빌더입니다. 개발에서 끝내지 않고 스토어 심사와 배포, 출시 후 크래시 대응까지를 프로젝트의 범위로 봅니다.',
    focus: '모바일 앱 · 스토어 출시', stack: ['Flutter', '스토어 배포'], done: 6,
    principles: [
      ['한 코드베이스, 두 플랫폼', 'iOS와 Android를 따로 만들지 않습니다. 유지보수 비용을 절반으로 줄입니다.'],
      ['심사까지가 개발', '스토어 리젝은 일정의 리스크입니다. 심사 기준을 설계 단계에서 반영합니다.'],
      ['출시가 시작', '크래시 리포트와 스토어 리뷰를 보며 출시 후 첫 2주를 함께 지킵니다.'],
    ],
    extra: null,
    projects: ['aerokUser', 'familycare'],
  },
  sein: {
    no: 'B—006', name: '빌더 세인', fname: '세인', lv: 'Builder', lead: false,
    role: '데이터 · 업무 자동화', img: '/assets/img/av-sein.webp',
    bio: '반복되는 손작업을 파이프라인과 에이전트로 바꾸는 빌더입니다. 흩어진 스프레드시트와 수작업 보고를 자동으로 흐르는 데이터로 만들어, 사람이 판단에만 집중하게 합니다.',
    focus: '데이터 파이프라인 · 자동화', stack: ['Python', 'n8n'], done: 5,
    principles: [
      ['손이 가면 자동화 대상', '주 1회 이상 반복되는 작업은 전부 자동화 후보로 올립니다.'],
      ['대시보드보다 알림', '들어가서 봐야 하는 화면보다, 필요할 때 찾아오는 알림을 먼저 만듭니다.'],
      ['깨져도 티가 나게', '조용히 틀리는 자동화가 최악입니다. 실패는 반드시 드러나게 설계합니다.'],
    ],
    extra: null,
    projects: ['daisy', 'nice'],
  },
  minseo: {
    no: 'B—007', name: '빌더 민서', fname: '민서', lv: 'Builder', lead: false,
    role: '브랜드 · 모션 디자인', img: '/assets/img/av-minseo.webp',
    bio: '디자인 시스템과 모션으로 서비스의 인상을 만드는 빌더입니다. 한 장의 예쁜 시안이 아니라, 개발자가 바로 가져다 쓸 수 있는 컴포넌트와 토큰으로 디자인을 전달합니다.',
    focus: '디자인 시스템 · 모션', stack: ['Design System', 'Motion'], done: 4,
    principles: [
      ['브랜드는 시스템으로', '색·타이포·컴포넌트를 토큰으로 정의해 어디서든 같은 인상을 냅니다.'],
      ['모션에도 목적', '움직임은 장식이 아니라 안내입니다. 목적 없는 모션은 뺍니다.'],
      ['개발자가 쓸 수 있게', '시안이 아니라 스펙으로 전달합니다. 디자인과 구현의 간극을 없앱니다.'],
    ],
    extra: null,
    projects: ['iloom', 'canape'],
  },
  taeo: {
    no: 'B—008', name: '빌더 태오', fname: '태오', lv: 'NEW', lead: false, fresh: true,
    role: '커머스 · 결제', img: '/assets/img/av-taeo.webp',
    bio: 'PG·정기결제 연동과 주문·정산 흐름 설계가 전문인 빌더입니다. 돈이 오가는 화면일수록 예외 케이스가 많다는 것을 알고, 그 예외부터 설계합니다.',
    focus: '결제 연동 · 주문·정산', stack: ['PG 연동', '구독 결제'], done: 8,
    principles: [
      ['예외부터 설계', '결제는 성공보다 실패·취소·환불이 어렵습니다. 예외 흐름을 먼저 그립니다.'],
      ['정산은 맞아떨어지게', '1원 차이도 운영 비용입니다. 주문·결제·정산 데이터가 항상 맞물리게 짓습니다.'],
      ['테스트 결제까지 끝까지', '실 카드 승인·취소 시나리오를 검증하고 나서야 출시라고 부릅니다.'],
    ],
    extra: null,
    projects: ['iloom', 'markspon'],
  },
  eunchae: {
    no: 'B—009', name: '빌더 은채', fname: '은채', lv: 'NEW', lead: false, fresh: true,
    role: '그로스 · SEO', img: '/assets/img/av-eunchae.webp',
    bio: '검색 유입과 콘텐츠 구조를 설계하는 빌더입니다. 잘 만든 서비스가 발견되지 않는 것이 가장 아까운 일이라, 만든 뒤에 발견되게 하는 것까지를 일로 봅니다.',
    focus: '검색 유입 · 콘텐츠 구조', stack: ['SEO', 'Analytics'], done: 5,
    principles: [
      ['구조가 곧 SEO', '키워드보다 정보 구조가 먼저입니다. 검색엔진도 사람처럼 읽기 쉬운 사이트를 좋아합니다.'],
      ['측정 없이 개선 없음', '유입·전환 데이터를 먼저 깔고, 숫자가 말해주는 순서로 고칩니다.'],
      ['콘텐츠는 자산으로', '한 번 쓰고 버리는 글이 아니라 계속 유입을 만드는 구조로 쌓습니다.'],
    ],
    extra: null,
    projects: ['btv', 'familycare'],
  },
  junho: {
    no: 'B—010', name: '빌더 준호', fname: '준호', lv: 'NEW', lead: false, fresh: true,
    role: '운영 · 인프라', img: '/assets/img/av-junho.webp',
    bio: '배포 자동화와 모니터링으로 서비스를 지키는 빌더입니다. 출시가 끝이 아니라 시작이라는 것을 알기에, 문제가 고객보다 팀에게 먼저 보이게 만듭니다.',
    focus: '배포 자동화 · 모니터링', stack: ['CI/CD', '모니터링'], done: 3,
    principles: [
      ['배포는 버튼 하나로', '사람 손을 타는 배포는 사고의 씨앗입니다. 반복 가능한 파이프라인으로 만듭니다.'],
      ['고객보다 먼저 알기', '장애는 알림으로 먼저 만납니다. 조용히 죽는 서버가 없게 감시를 깔아둡니다.'],
      ['되돌릴 수 있게', '모든 배포는 롤백 계획과 함께 나갑니다. 되돌릴 수 없는 변경은 하지 않습니다.'],
    ],
    extra: null,
    projects: ['nice', 'aerokAdmin'],
  },
}

/* 관리자(A-06)가 채운 값이 있으면 그것을, 없으면 아래 하드코딩을 쓴다.
   렌더는 원래대로 data-el 슬롯에 직접 넣는다 — 원작자 코드를 통째로 갈아엎지 않는다. */
export type Profile = {
  no: string; name: string; fname: string; lv: string; lead: boolean; fresh: boolean
  role: string; img: string; bio: string; focus: string; stack: string[]; done: number
  principles: { title: string; body: string }[]
  extra: { label: string; href: string } | null
  works: { href: string; img: string; tag: string; yr: string; title: string; desc: string }[]
}
export type Other = { slug: string; name: string; role: string; img: string }

/** 하드코딩 정의를 DB 와 같은 모양으로 맞춘다 */
function legacy(id: string): { profile: Profile; others: Other[] } {
  const key = BUILDERS[id] ? id : 'josh'
  const b = BUILDERS[key]
  return {
    profile: {
      no: b.no, name: b.name, fname: b.fname, lv: b.lv, lead: b.lead, fresh: Boolean(b.fresh),
      role: b.role, img: b.img, bio: b.bio, focus: b.focus, stack: b.stack, done: b.done,
      principles: b.principles.map(([title, body]) => ({ title, body })),
      extra: b.extra,
      works: b.projects.map(k => {
        const p = PROJECTS[k]
        return { href: '/work-detail', img: p.img, tag: p.tag, yr: p.yr, title: p.t, desc: p.d }
      }),
    },
    others: Object.keys(BUILDERS).filter(k => k !== key).map(k => ({
      slug: k, name: BUILDERS[k].name, role: BUILDERS[k].role, img: BUILDERS[k].img,
    })),
  }
}

export default function BuilderView({
  profile, others,
}: {
  profile?: Profile | null
  others?: Other[]
}) {
  useEffect(() => {
    const esc = (s: string) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML }
    const q = (sel: string) => document.querySelector<HTMLElement>('[data-el="' + sel + '"]')

    const id = new URLSearchParams(location.search).get('b') || ''
    /* ⚠ 예전에는 못 찾으면 조용히 조쉬를 보여줬다. 실제 발행한 프로젝트의 빌더를 눌러도
       엉뚱한 사람이 떠서, DB 값이 있으면 그쪽을 먼저 쓴다. */
    const fb = legacy(id)
    const b = profile ?? fb.profile
    const list = (others && others.length > 0) ? others : fb.others

    document.title = b.name + ' — 빌더 프로필 | AI 빌더 그룹'
    q('crumb')!.textContent = b.name
    q('cap')!.textContent = 'Builder Profile — ' + b.no
    q('name')!.textContent = b.name
    q('role')!.textContent = b.role
    q('bio')!.textContent = b.bio
    q('focus')!.textContent = b.focus
    q('stack')!.textContent = b.stack.join(' · ')
    q('done')!.textContent = b.done > 0 ? b.done + '건' : '—'
    q('sheetno')!.textContent = b.no
    q('prno')!.textContent = b.no
    q('fname')!.textContent = b.fname
    q('fname2')!.textContent = b.fname
    const lvEl = q('lv')!
    lvEl.textContent = b.lv
    lvEl.hidden = !b.lv          /* 배지를 비워두면 아예 달지 않는다 */
    lvEl.classList.toggle('lv--lead', b.lead)
    lvEl.classList.toggle('lv--new', b.fresh)
    const ph = q('photo') as HTMLImageElement
    ph.src = b.img
    ph.alt = b.name + ' 프로필 사진'
    if (b.extra) {
      const ex = q('extra') as HTMLAnchorElement
      /* ⚠ 이 주소는 빌더가 관리자에서 직접 입력한 값이다.
           라벨은 esc() 로 막고 있었는데 href 는 그대로 꽂히고 있었다 —
           `javascript:` 를 넣으면 공개 페이지에서 스크립트가 돈다.
           저장 시에도 검증하지만(builders/actions.ts), 실행되는 자리는 여기라 여기서도 막는다. */
      let safe = ''
      try {
        const u = new URL(b.extra.href, location.origin)
        if (u.protocol === 'http:' || u.protocol === 'https:') safe = u.href
      } catch { safe = '' }
      ex.hidden = !safe
      if (safe) {
        ex.href = safe
        ex.innerHTML = esc(b.extra.label) + ' <span class="arr">→</span>'
      }
    }

    /* 일하는 원칙 — 비어 있으면 영역을 통째로 감춘다 */
    const prWrap = q('principles')!
    prWrap.innerHTML = b.principles.map((p, i) =>
      '<div class="pr-card rv d' + i + '"><span class="no">0' + (i + 1) + '</span><b>' + esc(p.title) + '</b><p>' + esc(p.body) + '</p></div>').join('')
    prWrap.hidden = b.principles.length === 0

    /* 작업물 그리드 */
    q('pcnt')!.textContent = '( ' + String(b.works.length).padStart(2, '0') + ' )'
    q('pnote')!.textContent = '※ 공개 가능한 프로젝트만 게재합니다'
      + (b.done > 0 ? ' · 전체 수행 ' + b.done + '건' : '')
    q('plist')!.innerHTML = b.works.map((p, i) =>
      '<a class="wcard rv d' + (i % 4) + '" href="' + p.href + '" data-cursor="VIEW →">' +
      '<div class="slot mask">' +
      (p.img ? '<img class="cover" src="' + p.img + '" alt="' + esc(p.title) + ' 화면" loading="lazy">' : '') +
      '</div>' +
      '<div class="meta"><div class="mrow"><span class="tag">' + esc(p.tag) + '</span><span class="yr num">' + p.yr + '</span></div>' +
      '<h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p>' +
      '<div class="builders">' + esc(b.name) + '</div></div></a>').join('')

    /* 다른 빌더 */
    q('others')!.innerHTML = list.map((o, i) =>
      '<a class="ocard rv d' + i + '" href="/builder?b=' + encodeURIComponent(o.slug) + '">' +
      (o.img ? '<img src="' + o.img + '" alt="' + esc(o.name) + ' 프로필 사진">' : '<img alt="">') +
      '<span><b>' + esc(o.name) + '</b><span>' + esc(o.role) + '</span></span>' +
      '<span class="arr">→</span></a>').join('')
  }, [profile, others])

  return (
    <main id="main">
      {/* 프로필 히어로 */}
      <section className="bp-hero" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <p className="crumb"><Link href="/work">Work</Link> / <Link href="/work#builders">검증된 빌더</Link> / <span data-el="crumb">빌더</span></p>
          <div className="bp-grid">
            <div className="bp-photo slot mask">
              <img data-el="photo" src="" alt="" />
              <span className="lv" data-el="lv">Builder</span>
              <div className="slot__spec"><b>Asset — 빌더 인물 사진</b><span>상반신 인물 컷 · 촬영 동의 후 실사진 교체</span><em>800×1000px · 4:5 @2x</em></div>
            </div>
            <div className="bp-info">
              <span className="t-cap" data-el="cap">Builder Profile</span>
              <h1 data-el="name">빌더</h1>
              <p className="bp-role" data-el="role"></p>
              <p className="bp-bio" data-el="bio"></p>
              <dl className="bp-facts">
                <div className="fhead"><span>Builder Sheet</span><span data-el="sheetno">B—001</span></div>
                <div className="row"><dt>전문 분야</dt><dd data-el="focus"></dd></div>
                <div className="row"><dt>주요 스택</dt><dd data-el="stack"></dd></div>
                <div className="row"><dt>수행 프로젝트</dt><dd className="num" data-el="done"></dd></div>
                <div className="row"><dt>함께한 파트너</dt><dd>똑똑한개발자</dd></div>
              </dl>
              <div className="bp-cta">
                <Link className="btn btn--lime" href="/contact" data-track="cta_click" data-location="builder_profile">이 빌더와 프로젝트 문의 <span className="arr">→</span></Link>
                <a className="btn btn--ghost" data-el="extra" href="#" hidden></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 일하는 원칙 */}
      <section className="bp-pr" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="eyebrow"><i></i>How I Build<span className="no" data-el="prno">B—001</span></div>
          <div className="grid g3" data-el="principles"></div>
        </div>
      </section>

      {/* 수행 프로젝트 */}
      <section className="bp-work" style={{ paddingBottom: 20 }}>
        <div className="wrap">
          <div className="sec-head">
            <h2 style={{ fontSize: 'clamp(24px,3vw,34px)', margin: 0 }}><span data-el="fname">빌더</span>의 작업물</h2>
            <span className="head-cnt num" data-el="pcnt">( 00 )</span>
          </div>
          <p className="note" data-el="pnote">※ 공개 가능한 프로젝트만 게재합니다.</p>
          <div className="grid g2" data-el="plist"></div>
        </div>
      </section>

      {/* 다른 빌더 */}
      <section className="bp-others" style={{ paddingBottom: 30 }}>
        <div className="wrap">
          <div className="sec-head">
            <h2 style={{ fontSize: 'clamp(22px,2.6vw,30px)', margin: 0 }}>다른 빌더 보기</h2>
            <Link className="more-link" href="/work#builders">전체 빌더</Link>
          </div>
          <div className="grid g3" data-el="others"></div>
        </div>
      </section>

      <section style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="cta-banner">
            <div>
              <h3><span data-el="fname2">빌더</span>와 비슷한 프로젝트를 계획 중이신가요?</h3>
              <p>프로젝트 이야기를 들려주세요. 상황에 맞는 빌더와 진행 방식을 제안드립니다.</p>
            </div>
            <Link className="btn btn--lime" href="/contact" data-track="cta_click" data-location="builder_profile_bottom">프로젝트 문의 <span className="arr">→</span></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
