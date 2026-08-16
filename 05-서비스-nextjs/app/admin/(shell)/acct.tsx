'use client'

import { useEffect, useRef } from 'react'

/* 헤더의 계정 메뉴 (A-00 §1).

   <details> 를 그대로 쓴다 — JS 가 안 돌아도 열리고, 키보드·스크린리더 동작이 공짜다.
   다만 네이티브 <details> 는 바깥을 눌러도 닫히지 않는다. 드롭다운으로 쓰려면
   그 한 가지만 직접 붙여야 한다 (바깥 클릭 · Esc · 포커스 이동).

   children 은 서버 컴포넌트에서 그대로 넘어온다 — 로그아웃 폼(서버 액션)이 여기 들어 있다. */
export default function AcctMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const closeIfOutside = (e: Event) => {
      const el = ref.current
      if (!el?.open) return
      /* 메뉴 안을 누른 것이면 그대로 둔다 — 로그아웃 버튼이 눌리기 전에 닫히면 안 된다 */
      if (e.target instanceof Node && el.contains(e.target)) return
      el.open = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const el = ref.current
      if (!el?.open) return
      el.open = false
      /* 닫고 나면 포커스가 사라진다 — 방금 연 버튼으로 되돌린다 */
      el.querySelector('summary')?.focus()
    }

    /* click 이 아니라 pointerdown 이다. click 은 버튼을 누른 채 밖에서 떼면 발생하지 않는다.
       focusin 은 탭 이동으로 메뉴를 벗어나는 경우를 잡는다. */
    document.addEventListener('pointerdown', closeIfOutside)
    document.addEventListener('focusin', closeIfOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside)
      document.removeEventListener('focusin', closeIfOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return <details className="adm-acct" ref={ref}>{children}</details>
}
