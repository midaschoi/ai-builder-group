'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './confirm-dialog'
import { deleteContent, type Kind } from './content-actions'

/* 편집 화면 안의 삭제.

   예전에는 삭제가 목록의 [관리 ▾] 안에만 있었다. 글을 열어 놓고 "이건 지우자" 고
   마음먹은 사람이 목록으로 되돌아가 메뉴를 펼쳐야 했고, 그래서 삭제가 없는 줄 알았다.

   ⚠ 편집기 전체가 <form> 이라 여기에 또 <form> 을 넣을 수 없다 (중첩 폼은 무효).
     그래서 서버 액션을 FormData 를 손으로 만들어 직접 부른다 — useActionState 를 쓰면
     제출 경로가 바깥 폼과 얽힌다. 버튼은 전부 type="button" 이어야 한다. */
export default function DeleteBox({
  kind, id, title, status,
}: {
  kind: Kind
  id: string
  title: string
  status: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const noun = kind === 'work' ? '프로젝트' : '글'

  const run = () => {
    setError(null)
    start(async () => {
      const fd = new FormData()
      fd.set('kind', kind)
      fd.set('id', id)
      const r = await deleteContent({}, fd)
      if (r.error) { setError(r.error); setOpen(false); return }
      /* 방금 지운 글의 편집 주소에 머무르면 "찾을 수 없습니다" 를 보게 된다.
         replace 라서 뒤로가기로도 되돌아오지 않는다. */
      router.replace(`/admin/${kind}`)
    })
  }

  return (
    <section className="adm-card ed-danger">
      <h2>{noun} 삭제</h2>
      <p className="adm-dim">
        {status === 'published'
          ? `발행 중인 ${noun}입니다. 지우면 공개 주소가 404 가 되고 검색 색인도 잃습니다.`
          : `이 ${noun}을 완전히 지웁니다.`}
        {' '}되돌릴 수 없습니다.
      </p>

      {error && <p className="adm-error" role="alert">{error}</p>}

      <button type="button" className="adm-btn adm-btn--danger"
        onClick={() => setOpen(true)} disabled={pending}>
        {pending ? '삭제 중…' : `${noun} 삭제`}
      </button>

      <ConfirmDialog
        open={open}
        busy={pending}
        title={`이 ${noun}을 삭제할까요?`}
        detail={title || '(제목 없음)'}
        confirmLabel="삭제"
        note={
          <>
            누르는 즉시 데이터베이스에서 지워집니다. <b>되돌릴 수 없습니다.</b>
            {status === 'published' && ' 공개 주소는 404 가 됩니다.'}
          </>
        }
        onConfirm={run}
        onCancel={() => setOpen(false)}
      />
    </section>
  )
}
