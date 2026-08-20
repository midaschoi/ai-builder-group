import { pageMeta } from '@/app/_meta'
import './submit.css'
import SubmitView from './view'

/* FR-P09-02 (P0) · NFR-16 — 전환 완료 페이지는 noindex + 사이트맵 제외.
   sitemap.ts 는 허용 목록이라 원래 안 들어가지만, robots 메타가 빠져 있어
   검색에 '문의가 정상적으로 접수되었습니다' 가 그대로 노출될 수 있었다. */
export const metadata = {
  ...pageMeta({ title: '문의 접수 완료 — AI 빌더 그룹', path: '/submit' }),
  robots: { index: false, follow: false },
}

export default function SubmitPage() {
  return <SubmitView />
}
