import { createClient, createAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import Forbidden from '../forbidden'
import BuildersView, { type BuilderRow } from './view'
import './builders.css'

/* A-06 빌더 관리.

   ⛔ 운영 관리자 전용이다. 빌더가 이 주소로 오면 403 이다 (FR-A06-05).
      빌더는 계정 메뉴 → 내 프로필(/admin/builders/me) 로 본인 패널만 연다. */

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  auth_user_id: string | null
  name: string
  email: string
  slug: string
  role: 'admin' | 'builder'
  role_label: string | null
  one_liner: string | null
  avatar_url: string | null
  is_active: boolean
  must_change_password: boolean
}

export default async function BuildersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; edit?: string }>
}) {
  const me = await requireAdmin()
  if (!me) return <Forbidden />

  const { q = '', state = '', edit = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('builders')
    .select('id, auth_user_id, name, email, slug, role, role_label, one_liner, avatar_url, is_active, must_change_password')
    .order('is_active', { ascending: false })
    .order('name')

  if (state === 'active') query = query.eq('is_active', true)
  if (state === 'inactive') query = query.eq('is_active', false)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)

  const [{ data }, { data: allForCount }] = await Promise.all([
    query,
    supabase.from('builders').select('is_active'),
  ])
  const rows = (data ?? []) as Row[]

  const counts = {
    all: (allForCount ?? []).length,
    active: (allForCount ?? []).filter(b => (b as { is_active: boolean }).is_active).length,
    inactive: (allForCount ?? []).filter(b => !(b as { is_active: boolean }).is_active).length,
  }

  /* ── 최근 로그인 · 콘텐츠 건수 ──────────────────────────────────
     최근 로그인은 builders 에 없다. auth.users 의 값이라 Admin API 로만 읽을 수 있다.
     ⚠ 한 번에 200명까지만 읽는다. 기수가 늘어 이 수를 넘기면 페이지네이션이 필요하다. */
  const admin = createAdminClient()
  const [{ data: authList }, { data: pubs }, { data: joins }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabase.from('insights').select('author_id').eq('status', 'published'),
    supabase.from('work_builders').select('builder_id'),
  ])

  const lastSignIn = new Map<string, string | null>()
  for (const u of authList?.users ?? []) lastSignIn.set(u.id, u.last_sign_in_at ?? null)

  const tally = (list: unknown[] | null, key: string) => {
    const m = new Map<string, number>()
    for (const r of list ?? []) {
      const id = (r as Record<string, string>)[key]
      if (id) m.set(id, (m.get(id) ?? 0) + 1)
    }
    return m
  }
  const postCount = tally(pubs, 'author_id')
  const workCount = tally(joins, 'builder_id')

  const list: BuilderRow[] = rows.map(r => ({
    ...r,
    last_sign_in: r.auth_user_id ? (lastSignIn.get(r.auth_user_id) ?? null) : null,
    published_posts: postCount.get(r.id) ?? 0,
    joined_works: workCount.get(r.id) ?? 0,
  }))

  return (
    <BuildersView
      rows={list}
      counts={counts}
      meId={me.id}
      q={q}
      state={state}
      editing={list.find(r => r.id === edit) ?? null}
    />
  )
}
