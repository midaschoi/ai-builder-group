import Link from 'next/link'

/* 미리보기임을 화면에서 분명히 알린다.
   이 표시가 없으면 초안을 보고 "이미 공개된 줄" 알게 되고, 그 오해는 승인 절차 전체를 무의미하게 만든다. */

const LABEL: Record<string, string> = {
  draft: '초안', pending: '승인 대기', rejected: '반려됨', archived: '보관됨',
}

export default function PreviewBar({
  status, editHref,
}: {
  status: string
  editHref: string
}) {
  return (
    <div className="pv-bar">
      <b>미리보기</b>
      <span className="pv-state">{LABEL[status] ?? status}</span>
      <span className="pv-note">
        이 화면은 <b>아직 공개되지 않았습니다.</b> 로그인한 사람에게만 보입니다.
      </span>
      <Link className="pv-edit" href={editHref}>편집으로 →</Link>
    </div>
  )
}
