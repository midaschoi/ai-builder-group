import { redirect } from 'next/navigation'
import { createClient, SUPABASE_READY } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import { signOut } from '../actions'
import SetupNotice from '../setup-notice'
import AdminNav from './nav'
import AcctMenu from './acct'

/* 관리자 셸 — 사이드바 + 헤더 (A-00 §1).

   A-01 로그인은 이 셸을 쓰지 않으므로 (shell) 라우트 그룹으로 한 겹 나눴다.
   그룹 이름은 URL 에 나타나지 않는다 — /admin/insight 그대로다. */

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  if (!SUPABASE_READY) return <SetupNotice />

  /* proxy.ts 가 이미 막지만 여기서 다시 확인한다.
     게이트가 한 겹뿐이면 그 한 겹이 뚫렸을 때 전부 열린다 (NFR-11 — 미들웨어 + 서버 이중). */
  const me = await getCurrentBuilder()
  if (!me) redirect('/admin/login')

  /* 승인 대기 배지 (A-07). 관리자만 이 메뉴를 보므로 관리자일 때만 센다. */
  let pending = 0
  if (me.role === 'admin') {
    const supabase = await createClient()
    const [insights, works] = await Promise.all([
      supabase.from('insights').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('works').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    pending = (insights.count ?? 0) + (works.count ?? 0)
  }

  return (
    <div className="adm">
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            <i aria-hidden="true">A</i>
            <b>AI 빌더 그룹<span>관리자</span></b>
          </div>
          <AdminNav isAdmin={me.role === 'admin'} pendingCount={pending} />
        </aside>

        <main className="adm-main">
          <div className="adm-top">
            {/* 페이지 제목은 각 화면이 자기 자리에 그린다 */}
            <div />
            <AcctMenu>
              <summary>
                <i aria-hidden="true">{me.name.slice(0, 1)}</i>
                {me.name} ▾
              </summary>
              <div className="adm-menu">
                <div className="adm-menu-head">
                  <b>{me.name}</b>
                  <span>{me.email}</span>
                  <span>{me.role === 'admin' ? '운영 관리자' : '빌더'}</span>
                </div>
                {/* 비밀번호 변경(FR-A00-05)은 재설정 흐름을 만든 뒤 여기에 붙인다 */}
                <form action={signOut}>
                  <button type="submit">로그아웃</button>
                </form>
              </div>
            </AcctMenu>
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}
