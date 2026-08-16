import { pageMeta } from '@/app/_meta'
import { getWorks } from '@/lib/content'
import './work.css'
import WorkView from './view'

export const metadata = pageMeta({
  title: 'Work — AI 빌더 그룹',
  path: '/work',
})

/* 발행된 프로젝트가 없으면 view 가 시연용 샘플로 화면을 유지한다.
   전환 시점은 "첫 발행" 이다 — 그때 목록 전체가 DB 로 바뀐다. */
export const revalidate = 300

export default async function WorkPage() {
  return <WorkView works={await getWorks()} />
}
