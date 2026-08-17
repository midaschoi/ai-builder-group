'use client'

import { useActionState, useEffect, useState } from 'react'
import { saveVideos, type SaveState } from '../site-content-actions'
import SaveBar from '../save-bar'
import ConfirmDialog from '../confirm-dialog'

const INITIAL: SaveState = {}

export type Row = {
  youtube_id: string
  title: string
  subtitle: string
  channel_name: string
  duration: string
  is_active: boolean
}

/** 주소를 붙여넣어도 미리보기가 뜨도록 id 를 뽑는다 (서버도 같은 규칙으로 한 번 더 본다) */
function idOf(raw: string): string {
  const v = (raw ?? '').trim()
  const m = v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  if (m) return m[1]
  return /^[A-Za-z0-9_-]{11}$/.test(v) ? v : ''
}

/* A-10 콘텐츠(유튜브) 관리.
   IR-08 이 "1차는 링크·썸네일 수동 등록, API 연동 없음" 이라 등록만 한다.
   썸네일은 저장하지 않는다 — img.youtube.com 규칙으로 만들 수 있다. */
export default function VideoView({ rows, channels }: {
  rows: Row[]
  channels: { name: string }[]
}) {
  const [state, action, pending] = useActionState(saveVideos, INITIAL)
  const [items, setItems] = useState<Row[]>(rows)
  const [dirty, setDirty] = useState(false)

  /* 저장이 끝나면 "저장하지 않은 변경" 을 내린다 (faq/view.tsx 와 같은 이유) */
  useEffect(() => { if (state.ok) setDirty(false) }, [state.ok])

  const patch = (i: number, p: Partial<Row>) => {
    setItems(items.map((r, idx) => (idx === i ? { ...r, ...p } : r))); setDirty(true)
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]; const [row] = next.splice(from, 1); next.splice(to, 0, row)
    setItems(next); setDirty(true)
  }
  const remove = (i: number) => { setItems(items.filter((_, idx) => idx !== i)); setDirty(true) }

  /* ✕ 는 바로 지우지 않는다 (faq/view.tsx 와 같은 이유). null 이면 닫힌 상태 */
  const [askRemove, setAskRemove] = useState<number | null>(null)
  const add = () => {
    setItems([...items, {
      youtube_id: '', title: '', subtitle: '',
      channel_name: channels[0]?.name ?? '', duration: '', is_active: true,
    }])
    setDirty(true)
  }

  return (
    <form action={action} className="sc">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="sc-top">
        <h1 className="adm-title">콘텐츠 관리</h1>
        {dirty && <span className="adm-dim" style={{ fontSize: 12 }}>· 저장하지 않은 변경</span>}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={add}>+ 영상 추가</button>
          <button className="adm-btn" type="submit" disabled={pending}>
            {pending ? '저장 중…' : '저장'}
          </button>
        </span>
      </div>

      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && (
        <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
          저장했습니다. 공개 사이트에 바로 반영됩니다.
        </p>
      )}

      <p className="adm-dim" style={{ fontSize: 12.5 }}>
        유튜브 <b>주소를 통째로 붙여넣어도</b> 됩니다 — 영상 ID 만 알아서 뽑습니다.
        썸네일은 유튜브에서 자동으로 가져오므로 따로 올리지 않습니다.
      </p>

      <section className="adm-card sc-group">
        {items.length === 0 && <p className="adm-dim sc-empty">등록된 영상이 없습니다.</p>}

        {items.map((r, i) => {
          const yid = idOf(r.youtube_id)
          return (
            <div className="sc-row" key={i} data-off={r.is_active ? undefined : ''}>
              <span className="sc-no">{i + 1}</span>

              {yid
                ? <img className="sc-thumb" src={`https://img.youtube.com/vi/${yid}/mqdefault.jpg`} alt="" />
                : <span className="sc-thumb" data-empty="" aria-hidden="true" />}

              <div className="sc-fields">
                <input
                  value={r.youtube_id} placeholder="유튜브 주소 또는 영상 ID" spellCheck={false}
                  onChange={e => patch(i, { youtube_id: e.target.value })}
                />
                <input
                  value={r.title} placeholder="제목" maxLength={120}
                  onChange={e => patch(i, { title: e.target.value })}
                />
                <div className="sc-flags">
                  <input
                    className="sc-sm" value={r.channel_name} placeholder="채널명" list="sc-channels"
                    onChange={e => patch(i, { channel_name: e.target.value })}
                  />
                  <input
                    className="sc-sm" value={r.duration} placeholder="길이 11:11" maxLength={8}
                    onChange={e => patch(i, { duration: e.target.value })}
                  />
                  <input
                    className="sc-sm" value={r.subtitle} placeholder="보조 문구 (조회 44만)" maxLength={40}
                    onChange={e => patch(i, { subtitle: e.target.value })}
                  />
                  <label>
                    <input type="checkbox" checked={r.is_active}
                      onChange={e => patch(i, { is_active: e.target.checked })} />
                    공개
                  </label>
                </div>
              </div>

              <span className="sc-btns">
                <button type="button" onClick={() => move(i, i - 1)} aria-label="위로">↑</button>
                <button type="button" onClick={() => move(i, i + 1)} aria-label="아래로">↓</button>
                <button type="button" onClick={() => setAskRemove(i)} aria-label="삭제">✕</button>
              </span>
            </div>
          )
        })}

        <datalist id="sc-channels">
          {channels.map(c => <option key={c.name} value={c.name} />)}
        </datalist>
      </section>

      <p className="adm-dim" style={{ fontSize: 12 }}>
        ⓘ 채널 목록(하단 채널 카드)은 아직 DB 에서만 바꿀 수 있습니다 — <code>video_channels</code>.
        자주 바뀌는 값이 아니라 화면을 만들지 않았습니다.
      </p>

      {/* 폼 직계여야 한다 — .adm-card 안에 넣으면 overflow: hidden 에 잘려 sticky 가 죽는다 */}
      <SaveBar dirty={dirty} pending={pending}>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={add}>+ 영상 추가</button>
      </SaveBar>

      <ConfirmDialog
        open={askRemove !== null}
        title="이 영상을 목록에서 삭제할까요?"
        detail={askRemove !== null ? (items[askRemove]?.title.trim() || items[askRemove]?.youtube_id.trim() || '(제목이 비어 있는 항목)') : undefined}
        onConfirm={() => { if (askRemove !== null) remove(askRemove); setAskRemove(null) }}
        onCancel={() => setAskRemove(null)}
      />
    </form>
  )
}
