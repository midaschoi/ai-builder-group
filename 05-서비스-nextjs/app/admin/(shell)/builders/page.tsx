import { requireAdmin } from '@/lib/session'
import Soon from '../soon'
import Forbidden from '../forbidden'

/* 빌더는 목록을 볼 수 없다. 본인 프로필만 편집한다 (FR-A06-05). */
export default async function BuildersPage() {
  if (!(await requireAdmin())) return <Forbidden />
  return <Soon id="A-06 빌더 관리" title="빌더 관리" doc="A-06-빌더관리.md" />
}
