import { SUPABASE_READY } from '@/lib/supabase'
import LoginView from './view'
import SetupNotice from '../setup-notice'

/* A-01 로그인 — 관리자 화면 중 유일하게 게이트를 통과하는 공개 화면.
   셸(사이드바·헤더)을 쓰지 않으므로 (shell) 라우트 그룹 바깥에 있다. */

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  if (!SUPABASE_READY) return <SetupNotice />

  const { next } = await searchParams
  return <LoginView next={next ?? '/admin/insight'} />
}
