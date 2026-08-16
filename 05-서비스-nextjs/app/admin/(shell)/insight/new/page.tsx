import { createClient } from '@/lib/supabase'
import { getCurrentBuilder } from '@/lib/session'
import InsightEditor, { type Category, type Record_ } from '../[id]/editor'
import '../../../editor.css'

/* 새 글 작성.

   빈 행을 미리 만들어 두지 않는다 — 쓰다 말고 나가는 사람이 많아서
   제목 없는 유령 행이 목록에 쌓인다. 첫 저장 때 insert 하고 /admin/insight/[id] 로 넘긴다. */

const EMPTY: Record_ = {
  id: null,
  title: '', slug: '', excerpt: '', body_html: '', thumb_url: '',
  category_id: '', seo_title: '', seo_description: '', tags: [],
  status: 'draft', reject_reason: null, author_name: null, updated_at: null,
}

export default async function InsightNewPage() {
  const me = (await getCurrentBuilder())!
  const supabase = await createClient()

  const { data: cats } = await supabase
    .from('categories').select('id, name').eq('type', 'insight').order('sort')

  return (
    <InsightEditor
      record={{ ...EMPTY, author_name: me.name }}
      categories={(cats ?? []) as Category[]}
      isAdmin={me.role === 'admin'}
      readOnly={false}
    />
  )
}
