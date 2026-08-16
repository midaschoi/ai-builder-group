import { NextResponse, type NextRequest } from 'next/server'
import { createClient, SUPABASE_READY } from '@/lib/supabase'

/* 초대 · 비밀번호 재설정 메일 링크의 착지점.

   ⚠ 왜 페이지가 아니라 라우트 핸들러인가 —
     세션을 붙이려면 쿠키를 써야 하는데, 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
     페이지에서 코드를 교환하면 그 요청 안에서만 로그인된 것처럼 보이고,
     비밀번호를 저장하는 다음 요청에서 "링크가 만료되었습니다"가 뜬다.

   두 가지 형태를 모두 받는다 —
     · ?code=…                 PKCE. 본인이 /admin/reset 에서 직접 요청한 경우
     · ?token_hash=…&type=…    메일 템플릿을 {{ .TokenHash }} 로 바꾼 경우.
                               관리자가 대신 보내는 초대·재설정은 이쪽만 동작한다
                               (PKCE 검증자는 요청한 브라우저에만 있어서
                                받는 사람 브라우저에서는 교환할 수 없다).
     설정 방법은 supabase/EMAIL-TEMPLATES.md 참고. */

export const dynamic = 'force-dynamic'

function fail(origin: string, message: string) {
  const to = new URL('/admin/reset', origin)
  to.searchParams.set('error_description', message)
  return NextResponse.redirect(to)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  if (!SUPABASE_READY) return fail(origin, 'Supabase 접속 정보가 설정되지 않았습니다.')

  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  /* ?next= 를 그대로 믿으면 외부 사이트로 튕기는 통로가 된다 (login/actions.ts 와 같은 규칙) */
  const raw = searchParams.get('next') ?? '/admin/reset'
  const next = raw.startsWith('/admin') && !raw.startsWith('//') ? raw : '/admin/reset'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return fail(origin, '링크가 만료되었거나 이미 사용되었습니다.')
    return NextResponse.redirect(new URL(next, origin))
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'invite' | 'recovery' | 'email',
    })
    if (error) return fail(origin, '링크가 만료되었거나 이미 사용되었습니다.')
    return NextResponse.redirect(new URL(next, origin))
  }

  return fail(origin, '링크 정보가 없습니다. 메일의 링크를 다시 눌러 주세요.')
}
