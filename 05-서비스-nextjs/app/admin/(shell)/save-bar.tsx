'use client'

/* 하단 고정 저장 바 — A-09 FAQ 관리 · A-10 콘텐츠 관리 공용.

   왜 만들었나 —
     이 두 화면은 항목을 여러 개 편집하고 **마지막에 한 번** 저장하는 구조다.
     그런데 저장 버튼이 화면 맨 위 오른쪽에만 있어서, 아래쪽 항목을 고치거나
     새 항목을 추가하고 나면 저장하러 화면 끝까지 되돌아가야 했다.
     항목이 늘어날수록 그 거리가 길어진다.

   왜 sticky 인가 —
     position: fixed 로 하면 사이드바 폭(220px)과 여백을 직접 계산해야 하고
     브레이크포인트마다 다시 맞춰야 한다. sticky 는 본문 칸 안에 그대로 머물러
     그 계산이 통째로 사라진다. 페이지 맨 아래에 닿으면 자연스럽게 제자리에 앉는다.

     ⚠ 조상 중 하나라도 overflow 가 걸리면 sticky 는 조용히 죽는다.
       .adm · .adm-shell · .adm-main 에는 없다 (확인함). 카드 안에 넣지 말 것 —
       .adm-card 는 overflow: hidden 이다.

   맨 위 버튼은 그대로 둔다. 위에서 시작하는 사람은 위 버튼을 먼저 본다. */

export default function SaveBar({
  dirty, pending, align = 'center', children,
}: {
  /** 저장하지 않은 변경이 있는가 */
  dirty: boolean
  /** 서버 액션 진행 중 */
  pending: boolean
  /** 가로 위치. center = 본문 폭의 절반을 가운데 (FAQ · 콘텐츠 관리),
   *  end = 내용만큼만 차지하고 오른쪽 끝에 (사이트 설정) */
  align?: 'center' | 'end'
  /** 저장 버튼 왼쪽에 함께 둘 버튼 (예: "+ 영상 추가") */
  children?: React.ReactNode
}) {
  return (
    <div className="sc-savebar" data-align={align} data-dirty={dirty ? '' : undefined}>
      <span className="sc-savebar-msg">
        <i aria-hidden="true" />
        {dirty ? '저장하지 않은 변경이 있습니다' : '모든 변경이 저장되었습니다'}
      </span>
      {children}
      <button className="adm-btn" type="submit" disabled={pending}>
        {pending ? '저장 중…' : '저장'}
      </button>
    </div>
  )
}
