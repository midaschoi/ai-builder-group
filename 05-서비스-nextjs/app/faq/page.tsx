import { permanentRedirect } from 'next/navigation'
import { faqTopics } from '@/lib/faq-view'

/* FR-P07-05 — `/faq` 무인자 접근은 기본 토픽으로 넘긴다.

   전에는 여기서 "전체" 탭을 열었다. 그러면 같은 화면이 `/faq` 와 `/faq/<토픽>`
   두 주소에 뜨고, 어느 쪽이 정본인지 검색엔진이 알 수 없다.

   ⚠ 실제 응답은 301 이 아니라 308 이다. Next 의 permanentRedirect 가 308 을 쓴다.
     PRD 도 "301 또는 308" 이라 적어 두었다.

   기본 토픽 = 정렬 순서상 첫 번째. DB 의 faq_topics.sort 가 정한다. */

export const revalidate = 300

export default async function FaqIndex() {
  const { all } = await faqTopics()
  permanentRedirect(all.length > 0 ? `/faq/${all[0].key}` : '/')
}
