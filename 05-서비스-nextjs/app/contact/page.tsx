import { pageMeta } from '@/app/_meta'
import { getSiteSettings } from '@/lib/settings'
import './contact.css'
import ContactView from './view'

export const metadata = pageMeta({
  title: '프로젝트 문의 — AI 빌더 그룹',
  path: '/contact',
})

/* 폼 주소를 관리자 화면(A-08)에서 읽어 넘긴다 — 260812 2차 미팅 요구사항.
   값은 태그 캐시를 타므로 이 페이지의 정적 생성은 유지된다. */
export default async function ContactPage() {
  const { pluugFormUrl } = await getSiteSettings()
  return <ContactView formUrl={pluugFormUrl} />
}
