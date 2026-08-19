'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createAdminClient, SUPABASE_READY } from '@/lib/supabase'

/* A-01 §비밀번호 재설정 (FR-A01-05).

   두 가지를 한 화면에서 처리한다 —
     · 메일 링크를 타고 들어온 경우 (초대 · 재설정 · 임시 비밀번호 강제 변경)
     · 링크 없이 들어와 "재설정 메일을 보내주세요" 를 요청하는 경우 */

export type RequestState = { error?: string; sent?: boolean }
export type UpdateState = { error?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN = 10

async function origin(): Promise<string> {
  const head = await headers()
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? 'localhost:3000'
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

/** 재설정 메일 요청. */
export async function requestReset(_prev: RequestState, form: FormData): Promise<RequestState> {
  if (!SUPABASE_READY) return { error: 'Supabase 접속 정보가 설정되지 않았습니다.' }

  const email = String(form.get('email') ?? '').trim().toLowerCase()
  if (!EMAIL.test(email)) return { error: '이메일 형식이 올바르지 않습니다.' }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await origin()}/admin/auth/callback?next=/admin/reset` })

  /* ⚠ 결과를 구분해서 답하지 않는다 (A-01 §오류 처리와 같은 이유).
     "그런 계정 없음" 을 알려주면 등록된 이메일을 확인해 주는 통로가 된다. */
  return { sent: true }
}

/** 새 비밀번호 저장. 메일 링크로 세션이 이미 붙어 있어야 한다. */
export async function updatePassword(_prev: UpdateState, form: FormData): Promise<UpdateState> {
  if (!SUPABASE_READY) return { error: 'Supabase 접속 정보가 설정되지 않았습니다.' }

  const password = String(form.get('password') ?? '')
  const confirm = String(form.get('confirm') ?? '')

  if (password.length < MIN) return { error: `비밀번호는 ${MIN}자 이상으로 정해 주세요.` }
  if (password !== confirm) return { error: '두 비밀번호가 다릅니다.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '링크가 만료되었습니다. 재설정 메일을 다시 요청해 주세요.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: `바꾸지 못했습니다. ${error.message}` }

  /* 임시 비밀번호로 발급된 계정의 강제 변경 플래그를 내린다 (A-01 §계정 발급 직후 최초 로그인).
     ⚠ 0004 마이그레이션이 authenticated 롤에서 이 컬럼의 UPDATE 를 회수했으므로
       service_role 로 쓴다. 대상은 방금 비밀번호를 바꾼 본인 행 하나로 못박혀 있다.

     함께 **기존 접속을 전부 끊는다** (0010).
     비밀번호를 바꾼 이유가 "남이 알아버렸다" 인 경우가 대부분인데,
     예전에는 그 사람이 열어 둔 창이 그대로 살아 있었다. */
  const admin = createAdminClient()
  await admin.from('builders').update({
    must_change_password: false,
    sessions_valid_from: new Date().toISOString(),
  }).eq('auth_user_id', user.id)

  /* 갱신 토큰까지 회수한다 — signOut() 의 기본 범위가 'global' 이라 이 한 번으로
     본인·타 기기의 갱신 토큰이 모두 끊긴다 ({scope:'others'} 를 따로 부를 필요가 없다).
     위 기준선이 **이미 발급된 접속 토큰**을 즉시 막고, 이쪽이 **새로 발급받는 길**을 막는다.
     둘 다 있어야 완결된다.

     ⚠ 본인도 다시 로그인해야 한다. updateUser() 는 접속 토큰을 새로 발급하지 않으므로
       지금 쿠키에 든 토큰의 iat 는 방금 올린 기준선보다 과거다 — 위 판정에 그대로 걸린다.
       어중간하게 남겨 두면 "왜 나만 튕기지" 가 되므로 여기서 명확히 끊고 안내한다. */
  await supabase.auth.signOut()
  redirect('/admin/login?changed=1')
}
