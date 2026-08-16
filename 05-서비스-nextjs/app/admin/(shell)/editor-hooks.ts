'use client'

import { useEffect, useRef, useState } from 'react'
import { checkSlugAvailable } from './content-actions'
import type { Kind } from './content-actions'

/* A-03 · A-05 편집기가 공유하는 두 가지. 두 벌로 두면 한쪽만 고치게 된다. */

/** 30초 자동 저장 (A-03 §저장).
 *
 *  ⛔ 새 글에는 걸지 않는다. 아직 행이 없는 상태에서 자동 저장하면
 *     쓰다 만 제목 없는 유령 행이 목록에 쌓인다 — 새 글은 첫 저장을 사람이 누른다. */
export function useAutosave({
  formRef, enabled, isDirty, pending,
}: {
  formRef: React.RefObject<HTMLFormElement | null>
  enabled: boolean
  isDirty: () => boolean
  pending: boolean
}) {
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const pendingRef = useRef(pending)
  pendingRef.current = pending

  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => {
      if (pendingRef.current || !isDirty()) return
      const form = formRef.current
      if (!form) return
      /* 저장 버튼을 실제로 눌러 보낸다 — intent 를 따로 만들면 두 경로가 갈라진다 */
      const btn = form.querySelector<HTMLButtonElement>('button[data-autosave]')
      if (!btn) return
      form.requestSubmit(btn)
      setSavedAt(new Date())
    }, 30_000)
    return () => clearInterval(timer)
  }, [enabled, formRef, isDirty])

  return savedAt
}

export type SlugState = { state: 'idle' | 'checking' | 'ok' | 'taken' | 'invalid'; message?: string }

/** 슬러그 중복 실시간 확인 (A-03 · A-05 §슬러그).
 *
 *  저장할 때만 알려주면, 다 쓰고 발행을 누른 다음에야 "이미 쓰는 주소입니다"를 본다. */
export function useSlugCheck(kind: Kind, slug: string, selfId: string | null): SlugState {
  const [state, setState] = useState<SlugState>({ state: 'idle' })

  useEffect(() => {
    if (!slug) { setState({ state: 'idle' }); return }

    setState({ state: 'checking' })
    /* 글자마다 요청을 보내면 한 단어에 열 번이 나간다 */
    const timer = setTimeout(async () => {
      const res = await checkSlugAvailable(kind, slug, selfId)
      setState(res.ok
        ? { state: 'ok' }
        : { state: res.reason === 'taken' ? 'taken' : 'invalid', message: res.message })
    }, 450)

    return () => clearTimeout(timer)
  }, [kind, slug, selfId])

  return state
}
