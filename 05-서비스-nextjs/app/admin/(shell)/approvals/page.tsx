import { requireAdmin } from '@/lib/session'
import Soon from '../soon'
import Forbidden from '../forbidden'

/* 빌더가 접근하면 403 이다 (FR-A07-05). 메뉴를 숨기는 것만으로는 부족하다. */
export default async function ApprovalsPage() {
  if (!(await requireAdmin())) return <Forbidden />
  return <Soon id="A-07 승인 대기" title="승인 대기" doc="A-07-승인대기.md" />
}
