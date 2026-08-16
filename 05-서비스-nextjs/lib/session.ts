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
}

/* select * 를 쓰지 않는다 (DR-03). 컬럼을 명시해 비공개 필드가 딸려 나가지 않게 한다. */
const FIELDS = 'id, name, email, slug, role, avatar_url, role_label, is_active, must_change_password'

/** 현재 로그인한 빌더. 비로그인·비활성이면 null.
 *  `cache` 로 감싸 한 요청 안에서 몇 번을 불러도 쿼리는 한 번만 나간다. */
export const getCurrentBuilder = cache(async (): Promise<Builder | null> => {
  if (!SUPABASE_READY) return null

  const supabase = await createClient()

  /* getUser() 를 쓴다. getSession() 은 쿠키의 내용을 그대로 믿기 때문에
     서버에서 권한 판정에 쓰면 안 된다. */
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('builders')
    .select(FIELDS)
    .eq('auth_user_id', user.id)
    .maybeSingle<Builder>()

  /* 회수된 계정(is_active=false)은 로그인한 것으로 치지 않는다 (FR-A01-05 · FR-A06-03). */
  if (!data || !data.is_active) return null

  return data
})

/** 관리자 전용 화면에서 쓴다. 빌더가 오면 403 이다 (FR-A06-05 · FR-A07-05). */
export async function requireAdmin(): Promise<Builder | null> {
  const me = await getCurrentBuilder()
  return me?.role === 'admin' ? me : null
}
