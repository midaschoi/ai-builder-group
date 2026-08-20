import { pageMeta } from '@/app/_meta'
import './insight-detail.css'
import InsightDetailView from './view'

/* 시안 고정 페이지다. 실주소는 /insight/[slug] 다 (이관-체크리스트 §4).
   발행된 글 8건과 내용이 겹치는 중복 페이지라 검색에서 뺀다. */
export const metadata = {
  ...pageMeta({
    title: '바이브 코딩 외주, 잘하는 곳과 못하는 곳의 차이 — Insight',
    path: '/insight-detail',
  }),
  robots: { index: false, follow: false },
}

export default function InsightDetailPage() {
  return <InsightDetailView />
}
