/* 0006 이후 한 번만 돌린다 — 지금 화면에 나가 있는 FAQ·유튜브·빌더 프로필을 DB 로 옮긴다.

   왜 SQL 이 아니라 스크립트인가 — 원문이 app/_faq.ts · app/content/view.tsx ·
   app/builder/view.tsx 에 TS 로 들어 있어서, SQL 로 손으로 옮기면 한글이 깨지거나
   따옴표에서 틀어진다. 여기서는 값을 그대로 두고 라이브러리가 이스케이프하게 한다.

   실행:  node supabase/seed-public-content.mjs
   ⚠ 여러 번 돌려도 안전하다 — 같은 값이면 갱신만 한다.
*/
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

/* ⚠ 이 파일은 supabase/ 에 있고 node_modules 는 05-서비스-nextjs/ 에 있다.
   ESM 의 패키지 해석은 실행 위치(cwd)가 아니라 **파일 자신의 위치**에서 위로 올라가므로
   그냥 import 하면 ERR_MODULE_NOT_FOUND 가 난다. 앱 폴더를 기준으로 잡아 준다. */
const require = createRequire(new URL('../05-서비스-nextjs/package.json', import.meta.url))
const { createClient } = require('@supabase/supabase-js')

const ENV = new URL('../05-서비스-nextjs/.env.local', import.meta.url)
const env = {}
for (const line of readFileSync(ENV, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim()
}
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('FAIL  .env.local 에 SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.')
  process.exit(1)
}
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const ok = (label, detail) => console.log(`OK    ${label.padEnd(22)} ${detail}`)
const fail = (label, e) => { console.log(`FAIL  ${label.padEnd(22)} ${e.message}`); process.exitCode = 1 }


/* ── FAQ ─────────────────────────────────────────────────────────────── */
const FAQ = {
  inquiry: [
    ['바이브 코딩으로 만들면 품질이 괜찮나요?',
     '도구가 아니라 만드는 사람이 품질을 결정합니다. 우리는 교육을 수료하고 검증된 빌더만 배정하고, 전용 시스템으로 진행 과정을 관리해 결과물을 상향 평준화합니다.', true],
    ['기간은 얼마나 걸리나요?',
     '규모에 따라 다르지만, 랜딩 페이지 기준 제작 2주 + 환경 세팅·이관 1주가 일반적입니다. 기획 단계에서 일정을 확정해 드립니다.', true],
    ['어떤 개발자가 작업하나요?',
     '프로젝트 성격에 맞는 빌더를 선별해 배정합니다. 규모가 큰 프로젝트는 시니어 개발자가 함께 투입되는 투트랙으로 진행합니다.', true],
    ['상담과 견적도 비용이 드나요?',
     '상담과 견적 산정은 무료입니다. 문의를 남겨 주시면 24시간 안에 회신드립니다.', false],
    ['어떤 빌더가 맞을지 모르겠습니다.',
     'Work 페이지의 빠른 매칭에서 세 가지만 고르면 프로젝트에 맞는 빌더를 추천해 드립니다. 30초면 충분합니다.', false],
    ['NDA 작성이 가능한가요?',
     '가능합니다. 착수 전에 비밀유지계약을 맺고 진행할 수 있습니다.', false],
  ],
  process: [
    ['진행 단계는 어떻게 되나요?',
     '기획 → 디자인(목업) → 개발 순서로 진행하며, 각 단계마다 확인을 받고 다음으로 넘어갑니다. 디자인 단계에서는 실제로 눌러볼 수 있는 목업을 드립니다.', true],
    ['수정 요청은 어디까지 가능한가요?',
     '문구·이미지 교체 같은 경미한 수정은 범위 내에서 반영합니다. 화면 추가나 기능 변경은 일정·비용과 함께 별도로 안내드립니다.', true],
    ['완료 후 유지보수는요?',
     '납품 후 30일 무상 하자보수가 기본입니다. 이후 기능 추가·운영 관리는 별도 유지보수 계약으로 진행합니다.', true],
    ['결과물 검수는 누가 하나요?',
     '빌더가 만든 결과물을 9년차 기준으로 심사하고, 통과한 것만 전달합니다. 대충 만든 결과물은 통과하지 못합니다.', false],
    ['작업 중간에 진행 상황을 볼 수 있나요?',
     '단계마다 확인을 받고 넘어갑니다. 디자인 단계에서는 동작하는 목업을, 개발 단계에서는 실제 화면을 보시게 됩니다.', false],
  ],
}

{
  const { data: topics, error } = await db.from('faq_topics').select('id, slug')
  if (error) fail('faq_topics 조회', error)
  else {
    const byslug = new Map(topics.map(t => [t.slug, t.id]))
    let n = 0
    for (const [slug, items] of Object.entries(FAQ)) {
      const topicId = byslug.get(slug)
      if (!topicId) { console.log(`SKIP  토픽 ${slug} 없음 — 0006 을 먼저 실행하세요`); continue }

      /* 이미 들어 있으면 건드리지 않는다 — 관리자에서 고친 문구를 되돌리면 안 된다 */
      const { count } = await db.from('faqs')
        .select('id', { count: 'exact', head: true }).eq('topic_id', topicId)
      if ((count ?? 0) > 0) { console.log(`SKIP  ${slug} — 이미 ${count}건 있음`); continue }

      const rows = items.map(([question, answer, home], i) => ({
        topic_id: topicId, question, answer, show_on_home: home, sort: i,
      }))
      const { error: e } = await db.from('faqs').insert(rows)
      if (e) fail(`faqs(${slug})`, e); else n += rows.length
    }
    if (n) ok('FAQ', `${n}건 등록`)
  }
}


/* ── 유튜브 ──────────────────────────────────────────────────────────── */
const VIDEOS = [
  ['kkbtjKvnS-Q', '김이솝의 AI 가이드', '11:11', '미친 무료기능 총집합! 제미나이 10분만에 마스터', '조회 44만'],
  ['ZIn53VIic14', '김이솝의 AI 가이드', '7:57', 'AI 동물 인터뷰 쇼츠 만들기 7분만에 끝!', '조회 36만'],
  ['8uif-Wf65SI', '김이솝의 AI 가이드', '18:38', '12시간씩 클로드 코드 쓰고 깨달은 핵심 꿀팁 20가지', '조회 5.1천 · NEW'],
  ['TP6ArUCnt8c', '똑똑한개발자', '15:47', '잘봐 이게 컨퍼런스다 — 똑똑한개발자 × 원티드', '브이로그'],
  ['LjrO4urq5gI', 'AI 서대표', '23:40', '10년차 IT 에이전시 대표가 푸는 개발 외주의 모든 것', '예산·견적·계약'],
  ['gtZPILhrnl8', 'AI 서대표', '13:48', '오르카(Orca) 설치부터 AI 블로그 자동화 세팅까지', 'NEW'],
]
{
  const { count } = await db.from('videos').select('id', { count: 'exact', head: true })
  if ((count ?? 0) > 0) console.log(`SKIP  videos — 이미 ${count}건 있음`)
  else {
    const rows = VIDEOS.map(([youtube_id, channel_name, duration, title, subtitle], i) => ({
      youtube_id, channel_name, duration, title, subtitle, sort: i,
    }))
    const { error } = await db.from('videos').insert(rows)
    if (error) fail('videos', error); else ok('유튜브', `${rows.length}건 등록`)
  }
}


/* ── 홈 카피 ─────────────────────────────────────────────────────────── */
{
  const { data: cur } = await db.from('site_settings').select('hero_title').eq('id', 1).maybeSingle()
  if (cur?.hero_title) console.log('SKIP  홈 카피 — 이미 값 있음')
  else {
    const { error } = await db.from('site_settings').update({
      hero_title: '아이디어만 가져오세요 — 나머지는 검증된 빌더의 일입니다.',
      hero_sub: '기획부터 개발, 검수까지 검증된 빌더가 끝까지 맡습니다.',
      /* ⚠ "4.9/5 평균 만족도" 는 근거 없는 수치라 옮기지 않는다 (기획서 C2).
         근거가 생기면 관리자 화면에서 넣는다. 비어 있으면 화면에서 그 지표를 빼도록 했다. */
      stat_rating: null,
    }).eq('id', 1)
    if (error) fail('홈 카피', error); else ok('홈 카피', '히어로 문구 등록 · 만족도 지표는 비움')
  }
}


/* ── 빌더 프로필 (관리자 계정 1건에 예시 값) ─────────────────────────── */
{
  const { data: admin } = await db.from('builders')
    .select('id, name, bio').eq('role', 'admin').limit(1).maybeSingle()
  if (!admin) console.log('SKIP  빌더 프로필 — 관리자 계정 없음')
  else if (admin.bio) console.log('SKIP  빌더 프로필 — 이미 값 있음')
  else {
    const { error } = await db.from('builders').update({
      focus: '백오피스 · 데이터 연결',
      stack: ['Next.js', 'Supabase'],
      principles: [
        { title: '데이터 모델이 먼저', body: '화면보다 테이블을 먼저 그립니다. 구조가 맞으면 화면은 따라옵니다.' },
      ],
      sort: 0,
    }).eq('id', admin.id)
    if (error) fail('빌더 프로필', error)
    else ok('빌더 프로필', `${admin.name} — 나머지는 관리자 화면에서 채우세요`)
  }
}

console.log('\n끝. 관리자 화면에서 실제 문구로 바꾸면 공개 사이트에 그대로 반영됩니다.')
