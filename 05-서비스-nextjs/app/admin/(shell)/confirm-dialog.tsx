'use client'

import { useEffect, useRef } from 'react'

/* 되돌릴 수 없는 동작 전에 한 번 묻는다.

   ⛔ window.confirm 을 쓰지 않는다 —
      생김새를 맞출 수 없고, 브라우저 기본 대화상자는 메인 스레드를 통째로 멈춘다.

   <dialog>.showModal() 을 쓰는 이유 —
     · 최상위 레이어에 뜬다. .adm-card 의 overflow: hidden 에 잘리지 않고 z-index 싸움도 없다
     · ESC 닫기 · 포커스 가둠 · 배경 클릭 차단이 브라우저 기본으로 딸려온다
     · 열릴 때 배경 스크롤이 막힌다

   ⚠ 폼 안에 들어가는 경우가 있어(FAQ·콘텐츠 관리) 버튼은 전부 type="button" 이다.
     빼먹으면 취소를 눌러도 폼이 제출된다. */

export default function ConfirmDialog({
  open, title, detail, confirmLabel = '삭제', note, busy = false, onConfirm, onCancel,
}: {
  open: boolean
  title: string
  /** 무엇을 지우는지 그대로 보여준다 — "정말 삭제할까요?" 만으로는 어느 항목인지 모른다 */
  detail?: string
  confirmLabel?: string
  /** 기본 문구는 폼 안에서 쓰는 경우(FAQ·콘텐츠 관리) 기준이다.
      DB 를 즉시 건드리는 곳은 "저장해야 반영" 이 거짓말이 되므로 반드시 갈아끼운다. */
  note?: React.ReactNode
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="adm-confirm"
      /* ESC — 기본 동작은 DOM 만 닫고 React state 는 그대로라 다시 열 수 없게 된다.
         막고 우리 state 를 통해서만 닫는다. */
      onCancel={e => { e.preventDefault(); onCancel() }}
      /* 배경(백드롭)을 누르면 취소. dialog 자신이 target 일 때가 배경이다 */
      onClick={e => { if (e.target === ref.current) onCancel() }}
    >
      <div className="adm-confirm-in">
        <b>{title}</b>
        {detail && <q>{detail}</q>}
        <p>{note ?? <>삭제한 뒤 <b>저장</b>해야 공개 사이트에 반영됩니다. 저장 전이라면 새로고침으로 되돌릴 수 있습니다.</>}</p>
        <div className="adm-confirm-act">
          {/* 기본 포커스는 취소다. 엔터가 파괴적 동작에 닿으면 안 된다 */}
          <button type="button" className="adm-btn adm-btn--ghost" autoFocus onClick={onCancel} disabled={busy}>
            취소
          </button>
          <button type="button" className="adm-btn adm-btn--danger" onClick={onConfirm} disabled={busy}>
            {busy ? '삭제 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
