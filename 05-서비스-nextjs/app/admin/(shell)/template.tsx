/* 관리자 본문 전환 효과.

   layout 이 아니라 template 인 이유 — layout 은 이동해도 그대로 유지되지만
   template 은 이동할 때마다 **새 key 로 다시 마운트**된다. 그래서 CSS 애니메이션이
   매번 다시 재생된다. (node_modules/next/dist/docs/.../template.md)

   ⚠ 짧고 세로로만 움직인다. 예전에 넣었던 스켈레톤이 "투명해졌다가 좌우로 움직이다가
     글이 나타나서 느리고 불편하다" 는 지적을 받았다. 그 교훈:
       · 가로 이동 금지 — 자리를 잡는 것처럼 보여 실제보다 느리게 느껴진다
       · 총 0.3초를 넘기지 않는다 — 전환 효과가 체감 지연을 늘리면 안 된다
       · 껍데기(사이드바·헤더)는 건드리지 않는다. 본문만 바뀐다

   ⚠ wrapper 가 .adm-main 의 flex 자식이 되므로 세로 간격 규칙을 그대로 물려받아야 한다.
     안 그러면 제목과 카드 사이 16px 이 사라진다. */
export default function ShellTemplate({ children }: { children: React.ReactNode }) {
  return <div className="adm-page">{children}</div>
}
