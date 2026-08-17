/* 빌더 프로필 10명을 DB 로 옮긴다 (A안).

   지금까지 이 10명은 app/work/view.tsx 와 app/builder/view.tsx 에 하드코딩돼 있었다.
   DB 로 옮기면 관리자(A-06)에서 바로 고칠 수 있고, 공개 프로필이 실제 그 사람을 보여준다.

   ⚠ 이 10명은 **시연용 인물**이다. 실제 조원으로 교체할 때:
     · 이름·소개·아바타는 A-06 프로필에서 바로 고친다
     · 로그인이 필요하면 A-06 에서 계정을 발급해 새로 만든다 (여기 행에는 auth 계정이 없다)
     · 이메일은 @sample.invalid 다 — RFC 2606 의 예약 도메인이라 메일이 나갈 수 없다.
       실수로 초대 메일을 보내도 아무 데도 도착하지 않는다.

   ⛔ 고객사 프로젝트(iloom·NICE·SK브로드밴드 …)는 DB 에 넣지 않는다.
     서면 동의를 받지 않은 자산이라 "발행된 실적" 으로 만들면 안 된다 (README §절대 규칙).
     코드의 시연용 배열로 남겨 두고, 실제 동의를 받은 건만 관리자에서 등록한다.

   실행:  node supabase/seed-builders.mjs
*/
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../05-서비스-nextjs/package.json', import.meta.url))
const { createClient } = require('@supabase/supabase-js')

const env = {}
for (const line of readFileSync(new URL('../05-서비스-nextjs/.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim()
}
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const P = (...pairs) => pairs.map(([title, body]) => ({ title, body }))

const BUILDERS = [
  {
    slug: 'josh', name: '빌더 조쉬', role_label: '프로덕트 빌더 · 기획+개발',
    one_liner: '기획자·디자이너·개발자를 합친 원맨 프로덕트 빌더. AI 네이티브 운영법 인터뷰의 그 사람.',
    bio: '기획자·디자이너·개발자를 합친 원맨 프로덕트 빌더입니다. 요구사항 정리부터 배포까지 한 사람이 끝까지 책임지는 방식으로 일하며, 전달 과정에서 생기는 손실을 없애는 것이 강점입니다.',
    focus: '프로덕트 전체 · MVP · 검증', stack: ['Next.js', 'LLM API', 'Supabase'], badge: '✳ 이달의 빌더',
    principles: P(
      ['한 사람이 끝까지', '기획·디자인·개발이 한 머리에서 나옵니다. 전달 손실이 없고, 의사결정이 빠릅니다.'],
      ['말보다 화면', '요구사항은 문서 대신 동작하는 화면으로 정리합니다. 첫 미팅에서 러프 목업을 함께 봅니다.'],
      ['AI 네이티브', '반복 작업은 에이전트에 맡기고, 사람의 시간은 판단에 씁니다.']),
  },
  {
    slug: 'ria', name: '빌더 리아', role_label: '랜딩 · 인터랙션',
    one_liner: '디자인 감도와 전환 설계가 강점. 수주용 랜딩과 브랜드 사이트를 주로 맡습니다.',
    bio: '디자인 감도와 전환 설계가 강점인 빌더입니다. 수주용 랜딩과 브랜드 사이트를 주로 맡으며, 화면의 인상보다 화면이 만들어내는 행동을 먼저 설계합니다.',
    focus: '수주용 랜딩 · 브랜드 사이트', stack: ['Interaction', 'GA4 설계'], badge: null,
    principles: P(
      ['전환에서 역산', '예쁜 화면이 아니라 문의가 생기는 화면을 설계합니다. CTA 동선부터 그립니다.'],
      ['인터랙션은 근거 위에', '움직임 하나에도 시선 흐름의 이유를 답니다. 과한 모션은 뺍니다.'],
      ['측정 가능한 디자인', 'GA4 이벤트 설계까지 랜딩의 일부로 봅니다. 열어보고 고칠 수 있게 만듭니다.']),
  },
  {
    slug: 'dohyun', name: '빌더 도현', role_label: '플랫폼 · 어드민',
    one_liner: '데이터 모델링과 권한 설계 경험 다수. 관리자·정산 시스템을 안정적으로 짓습니다.',
    bio: '데이터 모델링과 권한 설계 경험이 많은 빌더입니다. 관리자·정산처럼 틀리면 안 되는 시스템을 안정적으로 짓는 것이 전문입니다.',
    focus: '어드민 · 정산 · 권한 설계', stack: ['Supabase', 'RBAC'], badge: null,
    principles: P(
      ['데이터 모델이 먼저', '화면보다 테이블을 먼저 그립니다. 구조가 맞으면 화면은 따라옵니다.'],
      ['권한은 처음부터', 'RBAC는 나중에 붙이면 늦습니다. 설계 단계에서 역할과 경계를 확정합니다.'],
      ['운영자도 사용자', '어드민을 쓰는 운영자의 하루를 기준으로 화면을 짭니다.']),
  },
  {
    slug: 'yuna', name: '빌더 유나', role_label: 'AI 서비스 · 에이전트',
    one_liner: 'LLM 연동·프롬프트 설계를 실무로 다룹니다. PoC부터 단계 검증으로 리스크를 줄입니다.',
    bio: 'LLM 연동과 프롬프트 설계를 실무로 다루는 빌더입니다. 전면 도입 대신 PoC부터 단계 검증으로 리스크를 줄이며 AI 서비스를 만듭니다.',
    focus: 'LLM 연동 · 에이전트 · PoC', stack: ['Agents', 'RAG'], badge: null,
    principles: P(
      ['PoC로 먼저 증명', '전면 도입 전에 실데이터로 작게 검증합니다. 판단 근거를 만드는 것이 먼저입니다.'],
      ['AI의 경계를 정직하게', 'AI가 잘하는 범위를 긋고, 나머지는 사람에게 넘기는 구조로 설계합니다.'],
      ['프롬프트도 코드처럼', '버전 관리와 평가 없이 배포하지 않습니다.']),
  },
  {
    slug: 'hajun', name: '빌더 하준', role_label: '모바일 앱 · 크로스플랫폼',
    one_liner: '하나의 코드베이스로 iOS·Android를 함께 짓습니다. 스토어 심사·배포까지 책임집니다.',
    bio: '하나의 코드베이스로 iOS·Android를 함께 짓는 모바일 빌더입니다. 개발에서 끝내지 않고 스토어 심사와 배포, 출시 후 크래시 대응까지를 프로젝트의 범위로 봅니다.',
    focus: '모바일 앱 · 스토어 출시', stack: ['Flutter', '스토어 배포'], badge: null,
    principles: P(
      ['한 코드베이스, 두 플랫폼', 'iOS와 Android를 따로 만들지 않습니다. 유지보수 비용을 절반으로 줄입니다.'],
      ['심사까지가 개발', '스토어 리젝은 일정의 리스크입니다. 심사 기준을 설계 단계에서 반영합니다.'],
      ['출시가 시작', '크래시 리포트와 스토어 리뷰를 보며 출시 후 첫 2주를 함께 지킵니다.']),
  },
  {
    slug: 'sein', name: '빌더 세인', role_label: '데이터 · 업무 자동화',
    one_liner: '반복되는 손작업을 파이프라인과 에이전트로 바꿉니다. 데이터가 흐르게 만드는 빌더.',
    bio: '반복되는 손작업을 파이프라인과 에이전트로 바꾸는 빌더입니다. 흩어진 스프레드시트와 수작업 보고를 자동으로 흐르는 데이터로 만들어, 사람이 판단에만 집중하게 합니다.',
    focus: '데이터 파이프라인 · 자동화', stack: ['Python', 'n8n'], badge: null,
    principles: P(
      ['손이 가면 자동화 대상', '주 1회 이상 반복되는 작업은 전부 자동화 후보로 올립니다.'],
      ['대시보드보다 알림', '들어가서 봐야 하는 화면보다, 필요할 때 찾아오는 알림을 먼저 만듭니다.'],
      ['깨져도 티가 나게', '조용히 틀리는 자동화가 최악입니다. 실패는 반드시 드러나게 설계합니다.']),
  },
  {
    slug: 'minseo', name: '빌더 민서', role_label: '브랜드 · 모션 디자인',
    one_liner: '디자인 시스템과 모션으로 서비스의 인상을 만듭니다. 개발자가 바로 쓸 수 있는 디자인.',
    bio: '디자인 시스템과 모션으로 서비스의 인상을 만드는 빌더입니다. 한 장의 예쁜 시안이 아니라, 개발자가 바로 가져다 쓸 수 있는 컴포넌트와 토큰으로 디자인을 전달합니다.',
    focus: '디자인 시스템 · 모션', stack: ['Design System', 'Motion'], badge: null,
    principles: P(
      ['브랜드는 시스템으로', '색·타이포·컴포넌트를 토큰으로 정의해 어디서든 같은 인상을 냅니다.'],
      ['모션에도 목적', '움직임은 장식이 아니라 안내입니다. 목적 없는 모션은 뺍니다.'],
      ['개발자가 쓸 수 있게', '시안이 아니라 스펙으로 전달합니다. 디자인과 구현의 간극을 없앱니다.']),
  },
  {
    slug: 'taeo', name: '빌더 태오', role_label: '커머스 · 결제',
    one_liner: 'PG·정기결제 연동과 주문·정산 흐름 설계가 전문. 돈이 오가는 화면을 꼼꼼하게 짓습니다.',
    bio: 'PG·정기결제 연동과 주문·정산 흐름 설계가 전문인 빌더입니다. 돈이 오가는 화면일수록 예외 케이스가 많다는 것을 알고, 그 예외부터 설계합니다.',
    focus: '결제 연동 · 주문·정산', stack: ['PG 연동', '구독 결제'], badge: 'NEW',
    principles: P(
      ['예외부터 설계', '결제는 성공보다 실패·취소·환불이 어렵습니다. 예외 흐름을 먼저 그립니다.'],
      ['정산은 맞아떨어지게', '1원 차이도 운영 비용입니다. 주문·결제·정산 데이터가 항상 맞물리게 짓습니다.'],
      ['테스트 결제까지 끝까지', '실 카드 승인·취소 시나리오를 검증하고 나서야 출시라고 부릅니다.']),
  },
  {
    slug: 'eunchae', name: '빌더 은채', role_label: '그로스 · SEO',
    one_liner: '검색 유입과 콘텐츠 구조를 설계합니다. 만든 뒤에 발견되게 하는 것까지가 일입니다.',
    bio: '검색 유입과 콘텐츠 구조를 설계하는 빌더입니다. 잘 만든 서비스가 발견되지 않는 것이 가장 아까운 일이라, 만든 뒤에 발견되게 하는 것까지를 일로 봅니다.',
    focus: '검색 유입 · 콘텐츠 구조', stack: ['SEO', 'Analytics'], badge: 'NEW',
    principles: P(
      ['구조가 곧 SEO', '키워드보다 정보 구조가 먼저입니다. 검색엔진도 사람처럼 읽기 쉬운 사이트를 좋아합니다.'],
      ['측정 없이 개선 없음', '유입·전환 데이터를 먼저 깔고, 숫자가 말해주는 순서로 고칩니다.'],
      ['콘텐츠는 자산으로', '한 번 쓰고 버리는 글이 아니라 계속 유입을 만드는 구조로 쌓습니다.']),
  },
  {
    slug: 'junho', name: '빌더 준호', role_label: '운영 · 인프라',
    one_liner: '배포 자동화와 모니터링으로 서비스를 지킵니다. 출시 후에도 문제가 먼저 보이게.',
    bio: '배포 자동화와 모니터링으로 서비스를 지키는 빌더입니다. 출시가 끝이 아니라 시작이라는 것을 알기에, 문제가 고객보다 팀에게 먼저 보이게 만듭니다.',
    focus: '배포 자동화 · 모니터링', stack: ['CI/CD', '모니터링'], badge: 'NEW',
    principles: P(
      ['배포는 버튼 하나로', '사람 손을 타는 배포는 사고의 씨앗입니다. 반복 가능한 파이프라인으로 만듭니다.'],
      ['고객보다 먼저 알기', '장애는 알림으로 먼저 만납니다. 조용히 죽는 서버가 없게 감시를 깔아둡니다.'],
      ['되돌릴 수 있게', '모든 배포는 롤백 계획과 함께 나갑니다. 되돌릴 수 없는 변경은 하지 않습니다.']),
  },
]

let added = 0, skipped = 0
for (const [i, b] of BUILDERS.entries()) {
  const { data: exists } = await db.from('builders').select('id').eq('slug', b.slug).maybeSingle()
  if (exists) { skipped++; continue }

  const { error } = await db.from('builders').insert({
    slug: b.slug,
    name: b.name,
    /* RFC 2606 예약 도메인 — 실수로 메일을 보내도 아무 데도 도착하지 않는다 */
    email: `${b.slug}@sample.invalid`,
    role: 'builder',
    role_label: b.role_label,
    one_liner: b.one_liner,
    avatar_url: `/assets/img/av-${b.slug}.webp`,
    bio: b.bio,
    focus: b.focus,
    stack: b.stack,
    principles: b.principles,
    badge: b.badge,
    is_active: true,
    sort: i,
    /* auth 계정 없이 프로필만 만든다 — 로그인이 필요하면 A-06 에서 발급한다 */
    auth_user_id: null,
  })
  if (error) console.log(`FAIL  ${b.name}: ${error.message}`)
  else added++
}
console.log(`OK    빌더 프로필         ${added}명 등록 · ${skipped}명 이미 있음`)

/* 운영 계정은 공개 목록 맨 뒤로. 사람 카드 사이에 "관리자" 가 먼저 나오면 어색하다 */
await db.from('builders').update({ sort: 99 }).eq('role', 'admin')
console.log('OK    운영 계정           공개 목록 맨 뒤로 (sort=99)')


/* ── 테스트 잔여물 정리 ────────────────────────────────────────────
   개발하면서 내가 만든 것들이다. 콘텐츠가 아니라 시험 흔적이라 보관하지 않고 지운다. */
{
  const { data: w } = await db.from('works').delete()
    .in('slug', ['living-commerce-renewal']).select('slug')
  const { data: i } = await db.from('insights').delete()
    .in('slug', ['save-test-post', 'draft-preview-test']).select('slug')
  await db.from('redirects').delete().like('from_path', '/work/living-commerce%')

  console.log(`OK    테스트 정리         works ${(w ?? []).length}건 · insights ${(i ?? []).length}건 삭제`)
}

const { count } = await db.from('builders').select('id', { count: 'exact', head: true }).eq('is_active', true)
console.log(`\n활성 빌더 ${count}명. 공개 사이트의 "검증된 빌더" 가 이 값으로 바뀝니다.`)
console.log('실제 조원으로 바꾸려면 /admin/builders 에서 프로필을 고치세요.')
