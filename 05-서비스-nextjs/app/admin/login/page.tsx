import { SUPABASE_READY } from '@/lib/supabase'
import LoginView from './view'
import SetupNotice from '../setup-notice'

/* A-01 로그인 — 관리자 화면 중 유일하게 게이트를 통과하는 공개 화면.
   셸(사이드바·헤더)을 쓰지 않으므로 (shell) 라우트 그룹 바깥에 있다. */

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; changed?: string }>
}) {
  if (!SUPABASE_READY) return <SetupNotice />

  const { next, changed } = await searchParams
  /* 비밀번호를 바꾸면 본인 포함 전부 로그아웃된다 (0010). 이유를 말해주지 않으면
     "바꿨는데 왜 튕겼지" 가 된다. */
  return <LoginView next={next ?? '/admin/insight'} changed={changed === '1'} />
}
