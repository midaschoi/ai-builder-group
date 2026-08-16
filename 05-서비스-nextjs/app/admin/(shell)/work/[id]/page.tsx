import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import Forbidden from '../../forbidden'
import WorkEditor, { type BuilderOption, type Category, type Member, type Record_ } from './editor'
import '../../../editor.css'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Row = {
  id: string
  title: string | null
  slug: string | null
  summary: string | null
  category_id: string | null
  hero_url: string | null
  thumb_url: string | null
  og_image_url: string | null
  body_problem: string | null
  body_solution: string | null
  body_result: string | null
  tech_tags: string[] | null
  period_label: string | null
  scope_label: string | null
  result_url: string | null
  seo_title: string | null
  seo_description: string | null
  status: string
  reject_reason: string | null
  created_by: string | null
  updated_at: string | null
  members: {
    builder_id: string
    role_label: string | null
    sort: number
    builder: { name: string; is_active: boolean } | null
  }[]
}

export default async function WorkEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = (await getCurrentBuilder())!      /* 셸 레이아웃이 보장한다 */
  const isAdmin = me.role === 'admin'
  const supabase = await createClient()

  /* uuid 가 아니면 조회 자체가 에러를 던진다. 먼저 걸러낸다. */
  if (!UUID.test(id)) return <NotFound />

  const [{ data: raw }, { data: cats }, { data: people }] = await Promise.all([
    supabase
      .from('works')
      .select(
        'id, title, slug, summary, category_id, hero_url, thumb_url, og_image_url,' +
        ' body_problem, body_solution, body_result, tech_tags, period_label, scope_label,' +
        ' result_url, seo_title, seo_description, status, reject_reason, created_by, updated_at,' +
        ' members:work_builders(builder_id, role_label, sort, builder:builders(name, is_active))',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('categories').select('id, name').eq('type', 'work').order('sort'),
    /* 후보에는 활성 계정만 올린다. 회수된 계정은 새로 붙일 수 없다 (A-05 §참여 빌더).
       이미 붙어 있는 비활성 빌더의 이름은 아래 members 에서 따로 가져온다. */
    supabase.from('builders').select('id, name, role_label, is_active')
      .eq('is_active', true).order('name'),
  ])

  const row = raw as unknown as Row | null
  if (!row) return <NotFound />

  /* 타인 프로젝트는 404 가 아니라 403 이다 (PRD §2.2).
     ⚠ Work 의 "본인 것"은 created_by 뿐 아니라 참여 빌더 연결도 포함한다 (A-04 §화면-빌더). */
  const joined = (row.members ?? []).some(m => m.builder_id === me.id)
  if (!isAdmin && row.created_by !== me.id && !joined) return <Forbidden />

  /* 제출 후 잠금(DR-07) · 발행·보관은 관리자만 편집 */
  const readOnly = !isAdmin && ['pending', 'published', 'archived'].includes(row.status)

  const members: Member[] = [...(row.members ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map(m => ({
      id: m.builder_id,
      name: m.builder?.name ?? '(삭제된 계정)',
      is_active: m.builder?.is_active ?? false,
      role_label: m.role_label ?? '',
    }))

  const record: Record_ = {
    id: row.id,
    title: row.title ?? '',
    slug: row.slug ?? '',
    summary: row.summary ?? '',
    category_id: row.category_id ?? '',
    hero_url: row.hero_url ?? '',
    thumb_url: row.thumb_url ?? '',
    og_image_url: row.og_image_url ?? '',
    body_problem: row.body_problem ?? '',
    body_solution: row.body_solution ?? '',
    body_result: row.body_result ?? '',
    tech_tags: row.tech_tags ?? [],
    period_label: row.period_label ?? '',
    scope_label: row.scope_label ?? '',
    result_url: row.result_url ?? '',
    seo_title: row.seo_title ?? '',
    seo_description: row.seo_description ?? '',
    status: row.status,
    reject_reason: row.reject_reason,
    members,
    updated_at: row.updated_at,
  }

  return (
    <WorkEditor
      record={record}
      categories={(cats ?? []) as Category[]}
      builders={(people ?? []) as BuilderOption[]}
      isAdmin={isAdmin}
      readOnly={readOnly}
    />
  )
}

function NotFound() {
  return (
    <>
      <h1 className="adm-title">프로젝트를 찾을 수 없습니다</h1>
      <div className="adm-card">
        <div className="adm-empty">
          <p className="adm-dim">삭제되었거나 주소가 잘못되었습니다.</p>
          <Link className="adm-btn adm-btn--ghost" href="/admin/work">목록으로</Link>
        </div>
      </div>
    </>
  )
}
