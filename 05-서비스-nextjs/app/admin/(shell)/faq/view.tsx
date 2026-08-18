'use client'

import { useActionState, useEffect, useState } from 'react'
import { saveFaqs, type SaveState } from '../site-content-actions'
import SaveBar from '../save-bar'
import ConfirmDialog from '../confirm-dialog'

const INITIAL: SaveState = {}

/* 토픽 구분용 색조. 순서대로 돌려 쓴다 (site-content.css 의 --tone).

   ⛔ 새 색을 지어내지 않는다 — 관리자는 업무 도구다 (A-00 §0).
     브랜드 라임에서 채도를 낮춘 올리브를 첫 번째로 두고, 그 다음은 따뜻한 종이 바탕과
     부딪히지 않는 슬레이트 · 오커 순으로 간다. 넷이면 토픽이 늘어도 한동안 버틴다. */
const TONES = ['#8C9E2B', '#5B7290', '#A8742A', '#6E6A86'] as const

export type Topic = { id: string; slug: string; label: string }
export type Row = {
  topic_id: string
  question: string
  answer: string
  show_on_home: boolean
  is_active: boolean
}

/* A-09 FAQ 관리.

   ⛔ 입력칸은 전부 제어 컴포넌트다 — React 19 는 폼 액션 뒤 form.reset() 을 부른다
      (insight/[id]/editor.tsx 상단 주석). 여기서는 값을 통째로 state 로 들고 있어 안전하다. */
export default function FaqView({ topics, rows }: { topics: Topic[]; rows: Row[] }) {
  const [state, action, pending] = useActionState(saveFaqs, INITIAL)
  const [items, setItems] = useState<Row[]>(rows)
  const [dirty, setDirty] = useState(false)

  /* 저장이 끝나면 "저장하지 않은 변경" 을 내린다.
     예전에는 setDirty(false) 를 부르는 곳이 없어, 한 번 고치면 저장한 뒤에도
     계속 "저장하지 않은 변경" 이 붙어 있었다 — 신호가 아니라 장식이 된다. */
  useEffect(() => { if (state.ok) setDirty(false) }, [state.ok])

  const patch = (i: number, p: Partial<Row>) => {
    setItems(items.map((r, idx) => (idx === i ? { ...r, ...p } : r)))
    setDirty(true)
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [row] = next.splice(from, 1)
    next.splice(to, 0, row)
    setItems(next); setDirty(true)
  }
  const remove = (i: number) => { setItems(items.filter((_, idx) => idx !== i)); setDirty(true) }

  /* ✕ 는 바로 지우지 않는다. 되돌리려면 저장 전에 새로고침하는 수밖에 없어서,
     한 번 물어보는 편이 싸다. null 이면 닫힌 상태. */
  const [askRemove, setAskRemove] = useState<number | null>(null)
  const add = (topicId: string) => {
    setItems([...items, { topic_id: topicId, question: '', answer: '', show_on_home: false, is_active: true }])
    setDirty(true)
  }

  const homeCount = items.filter(r => r.show_on_home && r.is_active).length

  if (topics.length === 0) {
    return (
      <>
        <h1 className="adm-title">FAQ 관리</h1>
        <div className="adm-card"><div className="adm-empty">
          <p className="adm-dim">토픽이 없습니다. <code>0006_public_content.sql</code> 을 먼저 실행하세요.</p>
        </div></div>
      </>
    )
  }

  return (
    <form action={action} className="sc">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="sc-top">
        <h1 className="adm-title">FAQ 관리</h1>
        {dirty && <span className="adm-dim" style={{ fontSize: 12 }}>· 저장하지 않은 변경</span>}
        <button className="adm-btn" type="submit" disabled={pending} style={{ marginLeft: 'auto' }}>
          {pending ? '저장 중…' : '저장'}
        </button>
      </div>

      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && (
        <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
          저장했습니다. 공개 사이트에 바로 반영됩니다.
        </p>
      )}

      <p className="adm-dim" style={{ fontSize: 12.5 }}>
        <b>홈 노출</b>을 켠 항목만 홈 화면 FAQ 미리보기에 나옵니다 — 지금 {homeCount}건.
        전부 켜면 홈이 FAQ 페이지가 됩니다.
      </p>

      {topics.map((t, ti) => {
        /* 원래 순서를 유지해야 ↑↓ 가 전체 목록 기준으로 동작한다 */
        const mine = items.map((r, i) => ({ r, i })).filter(x => x.r.topic_id === t.id)
        return (
          <section
            className="adm-card sc-group"
            key={t.id}
            /* 토픽마다 다른 색조. 슬러그로 박지 않고 순서로 돌린다 — 토픽은 DB 에서 오고 늘어난다 */
            style={{ '--tone': TONES[ti % TONES.length] } as React.CSSProperties}
          >
            <div className="sc-group-head">
              <b>{t.label}</b>
              <code>/faq/{t.slug}</code>
              <span className="adm-dim">{mine.length}건</span>
              <button type="button" className="adm-manage" onClick={() => add(t.id)}
                style={{ marginLeft: 'auto' }}>+ 항목 추가</button>
            </div>

            {mine.length === 0 && <p className="adm-dim sc-empty">아직 항목이 없습니다.</p>}

            {mine.map(({ r, i }, n) => (
              <div className="sc-row" key={i} data-off={r.is_active ? undefined : ''}>
                <span className="sc-no">{n + 1}</span>
                {/* 질문·답변에 각각 클래스를 준다. 요소 종류(input/textarea)로 갈라도 되지만
                    콘텐츠 관리도 같은 .sc-fields 를 쓰므로 그쪽까지 색이 바뀐다. */}
                <div className="sc-fields">
                  <input
                    className="sc-q"
                    value={r.question} placeholder="질문" maxLength={120}
                    onChange={e => patch(i, { question: e.target.value })}
                  />
                  <textarea
                    className="sc-a"
                    value={r.answer} placeholder="답변" rows={3} maxLength={600}
                    onChange={e => patch(i, { answer: e.target.value })}
                  />
                  <div className="sc-flags">
                    <label>
                      <input type="checkbox" checked={r.show_on_home}
                        onChange={e => patch(i, { show_on_home: e.target.checked })} />
                      홈 노출
                    </label>
                    <label>
                      <input type="checkbox" checked={r.is_active}
                        onChange={e => patch(i, { is_active: e.target.checked })} />
                      공개
                    </label>
                    <select value={r.topic_id} onChange={e => patch(i, { topic_id: e.target.value })}>
                      {topics.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <span className="sc-btns">
                  <button type="button" onClick={() => move(i, i - 1)} aria-label="위로">↑</button>
                  <button type="button" onClick={() => move(i, i + 1)} aria-label="아래로">↓</button>
                  <button type="button" onClick={() => setAskRemove(i)} aria-label="삭제">✕</button>
                </span>
              </div>
            ))}
          </section>
        )
      })}

      {/* 폼 직계여야 한다 — .adm-card 안에 넣으면 overflow: hidden 에 잘려 sticky 가 죽는다 */}
      <SaveBar dirty={dirty} pending={pending} />

      <ConfirmDialog
        open={askRemove !== null}
        title="이 FAQ 항목을 삭제할까요?"
        detail={askRemove !== null ? (items[askRemove]?.question.trim() || '(질문이 비어 있는 항목)') : undefined}
        onConfirm={() => { if (askRemove !== null) remove(askRemove); setAskRemove(null) }}
        onCancel={() => setAskRemove(null)}
      />
    </form>
  )
}
