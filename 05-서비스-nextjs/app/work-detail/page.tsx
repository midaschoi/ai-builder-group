import { pageMeta } from '@/app/_meta'
import './work-detail.css'
import WorkDetailView from './view'

/* 시안 고정 페이지다. 실주소는 /work/[slug] 이고 이 화면은 홈 S6 카드가 아직
   가리키고 있어서만 살아 있다 (이관-체크리스트 §4). 색인되면 실제 상세와
   내용이 겹치는 중복 페이지가 되므로 검색에서 뺀다. */
export const metadata = {
  ...pageMeta({ title: 'AI 상담 챗봇 구축 — Work', path: '/work-detail' }),
  robots: { index: false, follow: false },
}

export default function WorkDetailPage() {
  return <WorkDetailView />
}
