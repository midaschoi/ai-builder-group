import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/* Supabase 접속 정보.

   ⚠ NEXT_PUBLIC_ 접두사를 붙이지 않았다. 일부러다.
   PRD DR-02 가 "브라우저에서 Supabase 를 직접 호출하지 않는다 · 서버 컴포넌트·서버 액션에서만
   접근"이라고 못박고 있으므로, 키를 브라우저로 내려보낼 이유가 없다.
   접두사를 붙이는 순간 anon 키가 번들에 실려 나가고, 그때부터 RLS 만이 유일한 방어선이 된다. */
const URL_ = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

/* 값이 없어도 빌드와 공개 페이지는 그대로 동작해야 한다 —
   .env.example 이 "비워두면 연동만 꺼지고 사이트는 그대로 동작합니다"라고 약속하고 있다.
   관리자 화면만 설정 안내를 대신 띄운다. */
export const SUPABASE_READY = Boolean(URL_ && ANON)

/** 로그인한 사용자 세션으로 접근한다. RLS 정책이 그대로 적용된다. */
export async function createClient() {
  if (!URL_ || !ANON) throw new Error('SUPABASE_URL · SUPABASE_ANON_KEY 가 설정되지 않았습니다.')

  const store = await cookies()

  return createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          /* 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts 가 이미 했으므로
             여기서 실패하는 것은 정상이고, 무시해도 세션이 끊기지 않는다. */
        }
      },
    },
  })
}

/** 세션 없이 읽기만 한다. 공개 웹이 site_settings 처럼 누구나 읽을 수 있는 값을
 *  가져올 때 쓴다.
 *
 *  ⚠ 쿠키를 만지지 않는 것이 요점이다. unstable_cache 안에서는 cookies() 를 쓸 수 없어서
 *    createClient() 를 그대로 넣으면 터진다. 캐시를 포기하면 공개 페이지 11장이 전부
 *    동적 렌더로 바뀌므로(SSG 포기), 캐시 가능한 클라이언트를 따로 둔다. */
export function createPublicClient() {
  if (!URL_ || !ANON) throw new Error('SUPABASE_URL · SUPABASE_ANON_KEY 가 설정되지 않았습니다.')

  return createServerClient(URL_, ANON, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}

/** RLS 를 우회한다. 계정 발급(A-06) 처럼 관리자 권한이 필요한 작업에만 쓴다.
 *  호출 전에 반드시 서버에서 is_admin 을 직접 확인할 것 — 이 클라이언트는 아무것도 막지 않는다. */
export function createAdminClient() {
  if (!URL_ || !SERVICE) throw new Error('SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.')

  return createServerClient(URL_, SERVICE, {
    cookies: { getAll: () => [], setAll: () => {} },
  })
}
