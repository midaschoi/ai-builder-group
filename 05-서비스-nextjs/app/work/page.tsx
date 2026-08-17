import { pageMeta } from '@/app/_meta'
import { getBuilders, getWorks } from '@/lib/content'
import { getSiteSettings } from '@/lib/settings'
import './work.css'
import WorkView from './view'

export const metadata = pageMeta({
  title: 'Work — AI 빌더 그룹',
  path: '/work',
})

/* 발행된 프로젝트·등록된 빌더가 없으면 view 가 시연용 샘플로 화면을 유지한다.
   전환 시점은 "첫 등록" 이다 — 그때 목록 전체가 DB 로 바뀐다. */
export const revalidate = 300

export default async function WorkPage() {
  const [works, builders, settings] = await Promise.all([
    getWorks(), getBuilders(), getSiteSettings(),
  ])
  return <WorkView works={works} builders={builders} statRating={settings.statRating} />
}
