/* 관리자 화면 전환 스켈레톤.

   ⚠ 이 파일이 없으면 메뉴를 눌러도 **아무 일도 일어나지 않는 것처럼 보인다.**
     관리자 화면은 요청마다 Supabase 를 3~5번 왕복한다 —
       proxy.ts 의 auth.getUser() (원격 Auth API)
       → 화면의 getCurrentBuilder() (getUser + builders 조회)
       → 목록 카운트 · 목록 본문
     그 동안 브라우저는 **이전 화면을 그대로 붙들고 있다가** 다 끝나면 툭 바뀐다.
     "버퍼링 걸린 것처럼 딱딱하다"는 게 이것이다.

   loading.tsx 는 두 가지를 동시에 해결한다.
     ① 누르는 즉시 이 스켈레톤으로 바뀐다 — 클릭이 먹었다는 신호
     ② <Link> 가 이 경계까지 미리 받아 둔다. 동적 라우트는 loading 경계가 없으면
        프리페치 자체를 하지 않는다 (Next 16 기본값)

   사이드바·헤더는 (shell)/layout.tsx 라 이 경계 밖이다 — 그대로 남고 본문만 바뀐다. */

export default function AdminLoading() {
  return (
    <div className="adm-skel" aria-busy="true" aria-live="polite">
      <span className="adm-sr">불러오는 중</span>

      <div className="sk-bar sk-title" />

      <div className="sk-row sk-tabs">
        {[68, 54, 54, 60, 48].map((w, i) => <div className="sk-bar" key={i} style={{ width: w }} />)}
      </div>

      <div className="sk-row sk-filters">
        <div className="sk-bar sk-grow" />
        <div className="sk-bar" style={{ width: 62 }} />
        <div className="sk-bar" style={{ width: 96 }} />
      </div>

      <div className="adm-card sk-card">
        <div className="sk-thead" />
        {Array.from({ length: 6 }, (_, i) => (
          <div className="sk-tr" key={i}>
            <div className="sk-bar sk-thumb" />
            <div className="sk-bar sk-grow" />
            <div className="sk-bar" style={{ width: 74 }} />
            <div className="sk-bar" style={{ width: 52 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
