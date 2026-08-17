import { getFaq } from './content'
import { FAQ, FAQ_HOME, type FaqTopic } from '@/app/_faq'

/* DB 의 FAQ 를 화면 컴포넌트(components/FaqList)가 쓰는 모양으로 바꾼다.

   ⚠ 컴포넌트의 타입(app/_faq.ts)을 바꾸지 않는다. 원작자 파일이고 홈·FAQ 두 화면이 함께 쓴다 —
     여기서 모양만 맞춰 넘기면 컴포넌트는 그대로 둘 수 있다.

   ⚠ DB 가 비어 있으면 기존 하드코딩으로 돌아간다. 0006 을 실행하기 전에도 사이트가 그대로 뜬다. */

export async function faqTopics(): Promise<{ all: FaqTopic[]; home: FaqTopic[] }> {
  const rows = await getFaq()
  const filled = rows.filter(t => t.items.length > 0)
  if (filled.length === 0) return { all: FAQ, home: FAQ_HOME }

  const all: FaqTopic[] = filled.map(t => ({
    key: t.slug,
    label: t.label,
    items: t.items.map(i => ({ id: i.id, q: i.question, a: i.answer, home: i.showOnHome })),
  }))

  /* 홈 프리뷰는 표시를 켠 것만. 그 결과 빈 주제는 탭에서도 뺀다 */
  const home = all
    .map(t => ({ ...t, items: t.items.filter(i => i.home) }))
    .filter(t => t.items.length > 0)

  return { all, home: home.length > 0 ? home : all }
}
