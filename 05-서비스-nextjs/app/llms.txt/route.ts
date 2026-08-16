import { SITE, SITE_URL, DEFAULT_DESC } from '@/app/_meta'
import { getInsights, getWorks } from '@/lib/content'

/* SR-03 — llms.txt.

   AI 크롤러가 사이트 구조를 사람이 읽는 순서대로 파악하게 하는 파일이다.
   sitemap.xml 이 "주소 전부"라면 이쪽은 "무엇을 먼저 보면 되는가"에 가깝다.

   ⛔ 여기에 없는 것을 지어내지 않는다. 실제로 있는 페이지와 발행된 콘텐츠만 적는다 —
      llms.txt 는 사람이 잘 안 열어보는 파일이라 한번 어긋나면 오래 간다. */

export const revalidate = 300

export async function GET() {
  const [works, insights] = await Promise.all([getWorks(), getInsights()])
  const abs = (p: string) => new URL(p, SITE_URL).toString()

  const lines: string[] = [
    `# ${SITE}`,
    '',
    `> ${DEFAULT_DESC}`,
    '',
    '## 주요 페이지',
    '',
    `- [홈](${abs('/')}): 무엇을 어떻게 만드는지, 그리고 만드는 사람들`,
    `- [Work](${abs('/work')}): 수행한 프로젝트 목록. 담당 빌더가 함께 표기됩니다`,
    `- [Insight](${abs('/insight')}): 발주 가이드와 일하는 방식에 대한 글`,
    `- [콘텐츠](${abs('/content')}): 유튜브 영상 모음`,
    `- [FAQ](${abs('/faq')}): 자주 묻는 질문`,
    `- [문의하기](${abs('/contact')}): 프로젝트 문의 폼`,
    `- [개인정보처리방침](${abs('/privacy')})`,
  ]

  if (works.length > 0) {
    lines.push('', '## 프로젝트', '')
    for (const w of works) {
      lines.push(`- [${w.title}](${abs(`/work/${w.slug}`)}): ${w.summary}`)
    }
  }

  if (insights.length > 0) {
    lines.push('', '## 인사이트', '')
    for (const a of insights) {
      lines.push(`- [${a.title}](${abs(`/insight/${a.slug}`)}): ${a.excerpt}`)
    }
  }

  lines.push(
    '',
    '## 제외',
    '',
    '- /admin — 관리자 화면. 색인 대상이 아닙니다',
    '- /submit — 문의 접수 완료 화면',
    '',
  )

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}
