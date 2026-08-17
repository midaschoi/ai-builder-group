'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  archiveContent, deleteContent, restoreContent, type Kind, type RowState,
} from './content-actions'

const S: RowState = {}

/* A-02 · A-04 목록의 [관리 ▾].

   ⛔ 점 세 개(⋯) 대신 텍스트 버튼을 쓴다 (A-00 §3.2) — 아이콘만 두면 누를 수 있다는 것을 모른다.
   ⛔ 파괴적 동작은 확인 단계를 거친다 (FR-A00-06). 삭제는 확인창에서 파급을 먼저 보여준다. */
export default function RowMenu({
  kind, id, title, slug, status, isAdmin,
}: {
  kind: Kind
  id: string
  title: string
  slug: string | null
  status: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const ref = useRef<HTMLDetailsElement>(null)
  const [confirming, setConfirming] = useState<'delete' | null>(null)
  /* ⚠ 메뉴를 fixed 로 띄운다. 표는 .adm-card(overflow:hidden) 와 .adm-scroll(overflow-x:auto)
     안에 있어서, absolute 로 두면 두 겹에 잘려 메뉴가 반만 보인다. */
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)

  const [arch, archAction, archPending] = useActionState(archiveContent, S)
  const [rest, restAction, restPending] = useActionState(restoreContent, S)
  const [del, delAction, delPending] = useActionState(deleteContent, S)

  const base = `/admin/${kind}`
  /* 발행분은 실제 공개 주소, 아직 발행 전이면 미리보기로 보낸다 */
  const publicPath = slug ? (status === 'published' ? `/${kind}/${slug}` : `/${kind}/${slug}/preview`) : null
  const busy = archPending || restPending || delPending

  /* 네이티브 <details> 는 바깥을 눌러도 닫히지 않는다 — acct.tsx 와 같은 처리 */
  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current
      if (!el?.open) return
      if (e.target instanceof Node && el.contains(e.target)) return
      el.open = false
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && ref.current) ref.current.open = false }
    /* fixed 로 띄웠으니 스크롤하면 버튼과 어긋난다 — 따라다니게 만드는 대신 닫는다 */
    const onScroll = () => { if (ref.current?.open) ref.current.open = false }

    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  /* 동작이 끝나면 메뉴와 확인창을 닫고 목록을 새로 읽는다.
     ⚠ 의존성은 .ok 가 아니라 상태 객체다. ok 는 한 번 true 가 되면 계속 true 라
       두 번째 동작부터 effect 가 다시 돌지 않는다 (builders/view.tsx 와 같은 이유). */
  useEffect(() => {
    if (!arch.ok && !rest.ok && !del.ok) return
    if (ref.current) ref.current.open = false
    setConfirming(null)
    router.refresh()
  }, [arch, rest, del, router])

  const error = arch.error ?? rest.error ?? del.error

  return (
    <>
      <details
        className="rm" ref={ref}
        onToggle={() => {
          const el = ref.current
          if (!el?.open) { setAt(null); return }
          const r = el.querySelector('summary')!.getBoundingClientRect()
          setAt({ top: Math.round(r.bottom + 5), left: Math.round(r.right - 150) })
        }}
      >
        <summary className="adm-manage">관리 ▾</summary>
        <div className="rm-menu" style={at ? { top: at.top, left: at.left } : undefined}>
          <Link href={`${base}/${id}`}>편집</Link>

          {/* 발행된 것만 공개 주소가 있다. 없는 주소로 보내면 404 를 보게 된다 */}
          {publicPath && (
            <a href={publicPath} target="_blank" rel="noreferrer">
              {status === 'published' ? '공개 화면 ↗' : '미리보기 ↗'}
            </a>
          )}

          {isAdmin && status === 'published' && (
            <form action={archAction}>
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={id} />
              <button type="submit" disabled={busy}>보관하기</button>
            </form>
          )}

          {isAdmin && status === 'archived' && (
            <form action={restAction}>
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={id} />
              <button type="submit" disabled={busy}>다시 발행</button>
            </form>
          )}

          {isAdmin && (
            <button type="button" className="rm-danger" disabled={busy}
              onClick={() => { setConfirming('delete'); if (ref.current) ref.current.open = false }}>
              삭제
            </button>
          )}
        </div>
      </details>

      {error && <p className="adm-error" role="alert" style={{ marginTop: 6 }}>{error}</p>}

      {/* ── 삭제 확인 (FR-A00-06 · A-04 §삭제 시 추가 경고) ───────── */}
      {confirming === 'delete' && (
        <div className="rm-overlay"
          onClick={e => { if (e.target === e.currentTarget && !delPending) setConfirming(null) }}>
          <form action={delAction} className="rm-modal">
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="id" value={id} />

            <h2>{kind === 'work' ? '이 프로젝트를' : '이 글을'} 삭제할까요?</h2>
            <p className="rm-title">「{title}」</p>

            {status === 'published' && (
              <p className="rm-warn">
                발행된 {kind === 'work' ? '프로젝트' : '글'}입니다. 삭제하면 공개 페이지가 404 가 됩니다.
                {kind === 'work' && ' 참여 빌더의 프로필에서도 사라집니다.'}
              </p>
            )}

            <p className="adm-dim" style={{ fontSize: 12.5, margin: 0 }}>
              되돌릴 수 없습니다. 대신 <b>보관하기</b>를 권합니다 —
              주소가 목록으로 넘어가고 색인을 잃지 않습니다.
            </p>

            {del.error && <p className="adm-error" role="alert">{del.error}</p>}

            <div className="rm-foot">
              <button type="button" className="adm-btn adm-btn--ghost"
                onClick={() => setConfirming(null)} disabled={delPending}>취소</button>
              <button type="submit" className="adm-btn" disabled={delPending}
                style={{ background: '#A32318', borderColor: '#A32318', color: '#fff' }}>
                {delPending ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
