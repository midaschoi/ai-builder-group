'use client'

/* ───────────────────────────────────────────────────────────────────────────
   참여 빌더 검색 드롭다운 (A-05 §참여 빌더)

   네이티브 <select> 를 쓰고 있었다. 10명일 때는 괜찮지만 조원이 늘면
   긴 목록을 눈으로 훑어야 한다. 이름을 쳐서 좁히는 쪽으로 바꾼다.

   ⚠ 목록을 absolute 로 띄우지 않는다. 이 필드가 들어앉은 .adm-card 는
     overflow:hidden 이라 아래로 열리는 메뉴가 통째로 잘린다 (row-menu.tsx 와 같은 문제).
     거기서는 position:fixed 로 피했지만, 여기는 카드 맨 아래라 흐름 안에서
     펼치는 편이 낫다 — 스크롤·리사이즈 때 위치를 다시 재지 않아도 된다.
   ─────────────────────────────────────────────────────────────────────────── */

import { useId, useMemo, useRef, useState } from 'react'
import type { BuilderOption } from './editor'

export function BuilderPicker({
  candidates, onPick, disabled,
}: {
  candidates: BuilderOption[]
  onPick: (id: string) => void
  disabled?: boolean
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return candidates
    return candidates.filter(b =>
      b.name.toLowerCase().includes(needle) ||
      (b.role_label ?? '').toLowerCase().includes(needle),
    )
  }, [candidates, q])

  /* 필터가 바뀌면 활성 항목이 목록 밖으로 나갈 수 있다 */
  const at = Math.min(active, Math.max(hits.length - 1, 0))

  const pick = (b: BuilderOption | undefined) => {
    if (!b) return
    onPick(b.id)
    /* 여러 명을 연달아 넣는 경우가 많다. 입력만 비우고 포커스는 남긴다. */
    setQ('')
    setActive(0)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) { setOpen(true); return }
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive(a => {
        const n = hits.length
        if (n === 0) return 0
        return (Math.min(a, n - 1) + step + n) % n
      })
      return
    }
    if (e.key === 'Enter') { e.preventDefault(); pick(hits[at]); return }
    if (e.key === 'Escape') { setOpen(false); setQ('') }
  }

  const empty = candidates.length === 0

  return (
    <div
      className="bp" ref={boxRef}
      /* 목록 안의 버튼으로 포커스가 옮겨가는 동안 닫히면 클릭이 먹지 않는다 */
      onBlur={e => { if (!boxRef.current?.contains(e.relatedTarget as Node)) setOpen(false) }}
    >
      <input
        id="wk-add" type="text" autoComplete="off"
        role="combobox" aria-expanded={open && !empty} aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && hits.length ? `${listId}-${at}` : undefined}
        placeholder={empty ? '추가할 수 있는 활성 빌더가 없습니다' : '이름 또는 역할로 검색'}
        value={q} disabled={disabled || empty}
        onChange={e => { setQ(e.target.value); setActive(0); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />

      {open && !empty && (
        <ul className="bp-list" id={listId} role="listbox" aria-label="빌더 검색 결과">
          {hits.length === 0 && (
            <li className="bp-none" role="presentation">일치하는 빌더가 없습니다</li>
          )}
          {hits.map((b, i) => (
            <li key={b.id} id={`${listId}-${i}`} role="option" aria-selected={i === at}>
              <button
                type="button"
                className={i === at ? 'bp-on' : undefined}
                /* mousedown 에서 처리한다. click 까지 기다리면 blur 가 먼저 와 목록이 닫힌다. */
                onMouseDown={e => { e.preventDefault(); pick(b) }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="bp-nm">{b.name}</span>
                {b.role_label && <span className="bp-rl">{b.role_label}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
