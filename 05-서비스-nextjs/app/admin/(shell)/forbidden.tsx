import Link from 'next/link'

/* 403 (A-00 §2). 타인 리소스에는 404 가 아니라 403 을 준다 — PRD §2.2 에서 403 으로 통일했다. */
export default function Forbidden() {
  return (
    <>
      <h1 className="adm-title">접근 권한이 없습니다</h1>
      <div className="adm-card">
        <div className="adm-empty">
          <p className="adm-dim">이 화면은 운영 관리자만 볼 수 있습니다.</p>
          <Link className="adm-btn adm-btn--ghost" href="/admin/insight">Insight 관리로</Link>
        </div>
      </div>
    </>
  )
}
