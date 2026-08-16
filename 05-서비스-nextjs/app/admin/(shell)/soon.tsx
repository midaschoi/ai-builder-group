import Link from 'next/link'

/* 아직 만들지 않은 화면. 404 를 보여주면 "고장난 건가?" 싶으므로
   어느 화면이고 언제 만드는지 밝힌다. 화면설계 문서는 이미 다 있다. */
export default function Soon({ id, title, doc }: { id: string; title: string; doc: string }) {
  return (
    <>
      <h1 className="adm-title">{title}</h1>
      <div className="adm-card">
        <div className="adm-empty">
          <p>
            <b>{id}</b> — 화면설계는 끝났고 개발이 남았습니다.
          </p>
          <p className="adm-dim">
            설계 문서: <code>02-화면설계/{doc}</code>
          </p>
          <Link className="adm-btn adm-btn--ghost" href="/admin/insight">Insight 관리로</Link>
        </div>
      </div>
    </>
  )
}
