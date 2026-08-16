'use client'

import { useActionState, useState } from 'react'
import { approve, reject, type ReviewState } from './actions'

const INITIAL: ReviewState = {}

/* 자주 쓰는 사유 — 기획서 절대 규칙에서 뽑았다.
   ⚠ 버튼은 입력을 대체하지 않는다. 문장을 채워 넣을 뿐이고 그대로 보내도 되고 고쳐도 된다.
     사유 코드만 저장하면 작성자가 받는 건 라벨 하나뿐이라 어느 문장인지 모른다. */
const PRESETS = [
  ['근거 없는 수치', '근거 없는 수치가 있습니다. 출처를 넣거나 해당 문장을 빼주세요.'],
  ['미동의 고객사명', '서면 동의를 받지 않은 고객사명이 노출되어 있습니다. 동의 전까지 빼주세요.'],
  ['가격 소구', '가격·저렴함을 소구하는 표현이 있습니다. 기획서 금지 규칙에 해당합니다.'],
  ['이미지 권리', '이미지 사용 권리가 확인되지 않았습니다. 출처나 동의 여부를 알려주세요.'],
  ['슬러그 규칙', '슬러그에 고객사명이 들어가 있습니다. 업종·기술 기준으로 바꿔주세요.'],
] as const

export default function ReviewBar({
  kind, id, title,
}: {
  kind: 'insight' | 'work'
  id: string
  title: string
}) {
  const [aState, approveAction, approving] = useActionState(approve, INITIAL)
  const [rState, rejectAction, rejecting] = useActionState(reject, INITIAL)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const busy = approving || rejecting

  return (
    <>
      {(aState.error || rState.error) && (
        <p className="adm-error" role="alert">{aState.error ?? rState.error}</p>
      )}

      {/* ── 반려 사유 입력 ─────────────────────────────────── */}
      {open && (
        <form action={rejectAction} className="adm-card rv-reject">
          <input type="hidden" name="type" value={kind} />
          <input type="hidden" name="id" value={id} />

          <div>
            <h2>반려 사유를 적어주세요</h2>
            <p className="adm-dim">
              작성자에게 그대로 전달됩니다. <b>무엇을 어떻게 고쳐야 하는지</b> 적어주세요.
            </p>
          </div>

          <textarea
            name="reason" rows={4} value={reason} required minLength={10}
            onChange={e => setReason(e.target.value)}
            placeholder="예: 근거 없는 수치가 있습니다. 출처를 넣거나 문장을 빼주세요."
          />
          <small className="adm-dim">{reason.trim().length}/500 · 최소 10자</small>

          <div className="rv-presets">
            <span className="adm-dim">자주 쓰는 사유</span>
            {PRESETS.map(([label, text]) => (
              <button key={label} type="button" className="adm-manage"
                onClick={() => setReason(text)}>{label}</button>
            ))}
          </div>

          <div className="rv-actions">
            <button type="button" className="adm-btn adm-btn--ghost"
              onClick={() => setOpen(false)} disabled={busy}>취소</button>
            {/* 사유가 짧으면 아예 누를 수 없다 (FR-A07-04) */}
            <button type="submit" className="adm-btn"
              style={{ background: '#A32318', borderColor: '#A32318', color: '#fff' }}
              disabled={busy || reason.trim().length < 10}>
              {rejecting ? '반려 중…' : '반려하기'}
            </button>
          </div>
        </form>
      )}

      {/* ── 하단 고정 액션 바 ──────────────────────────────── */}
      <div className="rv-bar">
        <span className="adm-dim rv-check">
          ⓘ 확인: 근거 없는 수치 · 미동의 고객사명 · 가격 소구
        </span>

        <a className="adm-manage" href={`/admin/${kind}/${id}`}>편집으로</a>

        <button type="button" className="adm-btn adm-btn--ghost"
          onClick={() => setOpen(v => !v)} disabled={busy}>
          {open ? '반려 취소' : '반려'}
        </button>

        <form action={approveAction} style={{ display: 'contents' }}>
          <input type="hidden" name="type" value={kind} />
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="adm-btn" disabled={busy}
            onClick={e => {
              /* 파괴적이진 않지만 되돌리려면 보관 처리를 해야 한다 — 한 번 묻는다 */
              if (!confirm(`「${title}」\n\n승인하고 발행할까요?\n발행하면 공개 사이트에 나타납니다. (반영까지 최대 60초)`)) {
                e.preventDefault()
              }
            }}>
            {approving ? '발행 중…' : '승인하고 발행'}
          </button>
        </form>
      </div>
    </>
  )
}
