import type { Metadata } from 'next'
import { createClient, SUPABASE_READY } from '@/lib/supabase'
import ResetView from './view'
import '../admin.css'

export const metadata: Metadata = {
  title: '비밀번호 설정 · 관리자',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/* 비밀번호 설정 화면 (FR-A01-05 · A-06 §계정 발급).

   ⚠ 메일 링크의 토큰 교환은 여기가 아니라 /admin/auth/callback 이 한다.
     서버 컴포넌트에서는 쿠키를 쓸 수 없어 세션이 다음 요청까지 남지 않기 때문이다.
     여기 도착했을 때는 이미 세션이 붙어 있거나(메일 경유), 아직 아무것도 없다(직접 방문). */
export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error_description?: string }>
}) {
  const { error_description } = await searchParams

  if (!SUPABASE_READY) {
    return <Shell><p className="adm-error">Supabase 접속 정보가 설정되지 않았습니다.</p></Shell>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <ResetView
      hasSession={Boolean(user)}
      email={user?.email ?? ''}
      linkError={error_description ?? ''}
    />
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm">
      <div className="adm-auth"><div className="adm-auth-card">{children}</div></div>
    </div>
  )
}
