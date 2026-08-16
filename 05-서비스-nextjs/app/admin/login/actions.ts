'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, SUPABASE_READY } from '@/lib/supabase'

/* A-01 로그인 서버 액션.

   이 파일의 핵심은 "실패 사유를 구분하지 않는 것"이다 (FR-A01-03).
   없는 이메일 · 틀린 비밀번호 · 회수된 계정 — 셋의 응답이 완전히 같아야 한다.
   구분해서 답하는 순간 그 이메일이 등록되어 있다는 사실이 확인되고, 계정 목록을 만들어 준다. */

const GENERIC = '이메일 또는 비밀번호가 올바르지 않습니다.'

export type LoginState = { error?: string }

/* 레이트 리밋 (FR-A01-04) — 동일 IP 10분당 10회.

   ⚠ 인스턴스 메모리에 둔다. 인스턴스가 여러 개로 늘면 한도가 인스턴스 수만큼 느슨해진다.
     계정이 열 몇 개인 백오피스라 1차에는 이걸로 충분하다고 보지만, 엄밀한 한도가 필요해지면
     Upstash Redis 같은 공용 저장소로 옮겨야 한다. */
const WINDOW_MS = 10 * 60 * 1000
const MAX_TRIES = 10
const attempts = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (attempts.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  recent.push(now)
  attempts.set(ip, recent)

  /* 메모리가 무한정 늘지 않게 가끔 청소한다 */
  if (attempts.size > 500) {
    for (const [k, v] of attempts) if (v.every(t => now - t >= WINDOW_MS)) attempts.delete(k)
  }
  return recent.length > MAX_TRIES
}

/** `?next=` 를 그대로 믿으면 외부 사이트로 튕기는 통로가 된다.
 *  관리자 내부 경로만 허용한다. */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === 'string' ? raw : ''
  return value.startsWith('/admin') && !value.startsWith('//') ? value : '/admin/insight'
}

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!SUPABASE_READY) return { error: 'Supabase 접속 정보가 설정되지 않았습니다.' }

  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  const next = safeNext(form.get('next'))

  if (!email || !password) return { error: GENERIC }

  const head = await headers()
  const ip = (head.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) return { error: '잠시 후 다시 시도해 주세요.' }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  /* ⚠ Supabase 는 원인별 메시지를 돌려준다. 그대로 노출하면 안 된다. */
  if (error || !data.user) return { error: GENERIC }

  /* auth 사용자와 builders 행은 별개다. 계정이 회수되었거나(is_active=false)
     builders 행이 아직 없으면 로그인시키지 않는다 (FR-A01-05). */
  const { data: builder } = await supabase
    .from('builders')
    .select('id, is_active, must_change_password')
    .eq('auth_user_id', data.user.id)
    .maybeSingle<{ id: string; is_active: boolean; must_change_password: boolean }>()

  if (!builder || !builder.is_active) {
    await supabase.auth.signOut()
    return { error: GENERIC }   /* 회수된 계정임을 알려주지 않는다 — 운영자가 알린다 */
  }

  /* TODO(A-01 §계정 발급 직후 최초 로그인): /admin/reset 을 만든 뒤
     builder.must_change_password 가 true 면 그쪽으로 강제 이동시킨다.
     재설정 화면(FR-A01-05, P1)이 아직 없어 지금은 통과시킨다. */

  /* redirect 는 예외를 던져서 동작한다. try 안에 두면 안 된다. */
  redirect(next)
}
