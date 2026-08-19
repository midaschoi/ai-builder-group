import { cache } from 'react'
import { createClient, SUPABASE_READY } from './supabase'

/* 로그인한 사람이 누구인지 한 곳에서만 판정한다.

   화면마다 role 을 다시 조회하면 한 군데만 빠뜨려도 게이트가 뚫린다 (PRD §2.2 · NFR-11).
   레이아웃·페이지·서버 액션이 전부 이 함수를 통과하게 한다. */

export type Builder = {
  id: string
  name: string
  email: string
  slug: string
  role: 'admin' | 'builder'
  avatar_url: string | null
  role_label: string | null
  is_active: boolean
  must_change_password: boolean
  /** 이 시각 이전에 발급된 토큰은 무효 (0010). 비밀번호를 바꾼 적이 없으면 null */
  sessions_valid_from: string | null
}

/* select * 를 쓰지 않는다 (DR-03). 컬럼을 명시해 비공개 필드가 딸려 나가지 않게 한다. */
const FIELDS = 'id, name, email, slug, role, avatar_url, role_label, is_active, must_change_password, sessions_valid_from'

/* 토큰 발급 시각(iat)과 기준선을 비교할 때 두는 여유 (0010).

   ⚠ 없으면 방금 로그인한 사람이 튕길 수 있다. 이유가 둘이다 —
     · iat 는 **초 단위로 잘린다.** 12:00:00.9 에 발급된 토큰의 iat 는 12:00:00 이라
       기준선이 12:00:00.5 면 방금 받은 토큰이 과거로 보인다.
     · DB 의 now() 와 Auth 의 발급 시각 사이에 미세한 시계 차가 있을 수 있다.
   되돌릴 수 없는 잠김(아무도 못 들어옴)을 막는 쪽이 훨씬 중요하다.
   이 틈으로 살아남는 것은 비밀번호를 바꾸기 10초 전에 발급된 토큰뿐이다. */
const CLOCK_SKEW_MS = 10_000

/** 현재 로그인한 빌더. 비로그인·비활성이면 null.
 *  `cache` 로 감싸 한 요청 안에서 몇 번을 불러도 쿼리는 한 번만 나간다. */
export const getCurrentBuilder = cache(async (): Promise<Builder | null> => {
  if (!SUPABASE_READY) return null

  const supabase = await createClient()

  /* ⛔ getSession() 은 쓰지 않는다. 쿠키의 내용을 검증 없이 그대로 믿기 때문에
        서버에서 권한 판정에 쓰면 안 된다.

     getClaims() 는 JWT **서명을 로컬에서 검증**한다 (이 프로젝트는 ES256 비대칭 키).
     예전에는 getUser() 였는데, 그 호출은 매번 Supabase Auth 로 네트워크 왕복을 했다.
     proxy.ts 가 이미 같은 검증을 하므로 관리자 화면 이동 한 번에 왕복이 두 번 났다 —
     cache() 는 한 렌더 안에서만 중복을 없애고, 프록시는 아예 다른 실행 환경이다.

     ⚠ 서명 검증은 **토큰이 회수됐는지**까지는 모른다 (만료 전까지 유효).
       다만 이 앱에서 중요한 회수 경로 두 가지 — 계정 비활성(is_active)과 역할(role) — 은
       바로 아래에서 DB 를 매번 다시 읽으므로 그대로 막힌다. */
  const { data: verified } = await supabase.auth.getClaims()
  const authUserId = verified?.claims?.sub
  if (!authUserId) return null

  const row = async (fields: string) => supabase
    .from('builders')
    .select(fields)
    .eq('auth_user_id', authUserId)
    .maybeSingle<Builder>()

  let { data, error } = await row(FIELDS)

  /* ⚠ 0010 을 아직 실행하지 않은 DB 를 만나면 컬럼이 없어 **조회 전체가 실패**한다.
       그대로 두면 아무도 관리자에 못 들어온다 — 마이그레이션 하나 때문에 잠기는 것은
       너무 비싼 실패다. 기준선 검사만 빼고 통과시킨다.
       (보안이 약해지는 것이 아니라 0010 이전 상태로 돌아갈 뿐이다.) */
  if (error && /sessions_valid_from/.test(error.message)) {
    console.warn('[session] 0010 미적용 — 세션 기준선 검사를 건너뜁니다.')
    ;({ data } = await row(FIELDS.replace(', sessions_valid_from', '')))
  }

  /* 회수된 계정(is_active=false)은 로그인한 것으로 치지 않는다 (FR-A01-05 · FR-A06-03). */
  if (!data || !data.is_active) return null

  /* 비밀번호를 바꾸기 전에 발급된 토큰은 무효다 (0010).

     Supabase 의 signOut({scope:'others'}) 는 **갱신 토큰**만 회수한다.
     이미 남의 브라우저에 들어 있는 접속 토큰은 만료(기본 1시간)까지 살아 있고,
     이 앱은 getClaims() 로 로컬 검증하므로 Auth 서버에 물어보지도 않는다.
     그래서 여기서 직접 끊는다 — builders 행은 어차피 위에서 읽었으므로 공짜다. */
  if (data.sessions_valid_from) {
    const issuedAt = Number(verified?.claims?.iat)
    /* iat 가 없으면(있을 수 없지만) 안전한 쪽으로 — 끊는다 */
    if (!Number.isFinite(issuedAt)) return null
    if (issuedAt * 1000 + CLOCK_SKEW_MS < new Date(data.sessions_valid_from).getTime()) {
      return null
    }
  }

  return data
})

/** 관리자 전용 화면에서 쓴다. 빌더가 오면 403 이다 (FR-A06-05 · FR-A07-05). */
export async function requireAdmin(): Promise<Builder | null> {
  const me = await getCurrentBuilder()
  return me?.role === 'admin' ? me : null
}
