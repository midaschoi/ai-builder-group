import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/* /admin/* 게이트 (FR-A00-01).

   ⚠ 파일 이름이 middleware.ts 가 아니라 proxy.ts 다.
      Next 16 에서 middleware 규약이 deprecated 되고 proxy 로 이름이 바뀌었다
      (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
      기획 문서의 "미들웨어 게이트"가 가리키는 것이 이 파일이다.

   여기서 하는 일은 두 가지뿐이다 — 세션 갱신, 그리고 통과 여부 판정.
   ⛔ 여기서 role 을 보고 관리자/빌더를 가르지 않는다. 그 판정은 화면과 서버 액션에서
      getCurrentBuilder() 로 한다. 게이트를 두 곳에 두면 서로 어긋난다. */

const URL_ = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  /* 접속 정보가 없으면 통과시킨다. 관리자 화면이 대신 설정 안내를 띄운다.
     여기서 막아버리면 아직 Supabase 를 안 만든 사람은 안내조차 볼 수 없다. */
  if (!URL_ || !ANON) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  /* 이 호출이 만료된 토큰을 갱신한다. 지우면 작업 중에 갑자기 로그아웃된다.

     ⚠ getUser() 가 아니라 getClaims() 다. getUser() 는 **매 요청마다** Supabase Auth 로
       네트워크 왕복을 한다. 이 프로젝트는 ES256 비대칭 키를 쓰므로 (JWKS 공개됨)
       getClaims() 가 JWT 서명을 로컬에서 검증한다 — 왕복이 사라진다.
         · 갱신은 그대로다. 내부에서 getSession() → __loadSession() 이 만료를 보고 갱신한다
         · 공개키는 모듈 전역(GLOBAL_JWKS)에 10분 캐시된다 — 인스턴스가 살아있는 동안 재사용
         · 대칭키이거나 WebCrypto 가 없으면 라이브러리가 알아서 getUser() 로 되돌아간다
     ⛔ getSession() 으로 바꾸지 말 것. 그건 쿠키 내용을 **검증 없이** 그대로 믿는다.
        getClaims() 는 서명을 실제로 검증한다 — 그 점이 결정적으로 다르다. */
  const { data: claims } = await supabase.auth.getClaims()
  const user = claims?.claims ?? null

  const isLoginPage = pathname === '/admin/login'
  /* 비밀번호 설정 화면은 비로그인으로 들어온다 — 초대·재설정 메일 링크의 착지점이다.
     여기를 막으면 계정을 발급받은 사람이 비밀번호를 정할 방법이 없다 (A-06 §계정 발급). */
  const isResetPage = pathname === '/admin/reset' || pathname === '/admin/auth/callback'

  /* 비로그인 → 로그인으로. 원래 가려던 주소는 ?next= 에 실어 보낸다 (A-01 §동작 스펙). */
  if (!user && !isLoginPage && !isResetPage) {
    const to = request.nextUrl.clone()
    to.pathname = '/admin/login'
    to.search = ''
    to.searchParams.set('next', pathname + search)
    return NextResponse.redirect(to)
  }

  /* 이미 로그인했는데 로그인 화면 → 첫 화면으로 (FR-A00-03). */
  if (user && isLoginPage) {
    const to = request.nextUrl.clone()
    to.pathname = '/admin/insight'
    to.search = ''
    return NextResponse.redirect(to)
  }

  return response
}

export const config = {
  /* 관리자 경로에서만 돈다. matcher 를 비우면 정적 파일까지 전부 통과해
     CSS·이미지가 로그인으로 튕긴다. */
  matcher: ['/admin/:path*'],
}
