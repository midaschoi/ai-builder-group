import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import WorkEditor, { type BuilderOption, type Category, type Record_ } from '../[id]/editor'
import '../../../editor.css'

/* 새 프로젝트.

   A-03 과 같은 이유로 빈 행을 미리 만들지 않는다 — 쓰다 말고 나가면 제목 없는 유령 행이 쌓인다.
   첫 저장 때 insert 하고 /admin/work/[id] 로 넘긴다. */

const EMPTY: Record_ = {
  id: null,
  title: '', slug: '', summary: '', category_id: '',
  hero_url: '', thumb_url: '', og_image_url: '',
  body_problem: '', body_solution: '', body_result: '',
  tech_tags: [], period_label: '', scope_label: '', result_url: '',
  seo_title: '', seo_description: '',
  status: 'draft', reject_reason: null, members: [], updated_at: null,
}

export default async function WorkNewPage() {
  const me = (await getCurrentBuilder())!
  const supabase = await createClient()

  const [{ data: cats }, { data: people }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('type', 'work').order('sort'),
    supabase.from('builders').select('id, name, role_label, is_active')
      .eq('is_active', true).order('name'),
  ])

  /* 만드는 사람을 첫 참여 빌더로 미리 넣어둔다 — 대부분 본인이 참여자이고,
     빈 목록으로 두면 제출 단계에서야 "1명 이상" 에 막힌다. 필요 없으면 지우면 된다. */
  const seed = (people ?? []).find(b => (b as { id: string }).id === me.id) as
    | { id: string; name: string; is_active: boolean } | undefined

  return (
    <WorkEditor
      record={{
        ...EMPTY,
        members: seed ? [{ id: seed.id, name: seed.name, is_active: seed.is_active, role_label: '' }] : [],
      }}
      categories={(cats ?? []) as Category[]}
      builders={(people ?? []) as BuilderOption[]}
      isAdmin={me.role === 'admin'}
      readOnly={false}
    />
  )
}
