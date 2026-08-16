'use client'

import { usePathname } from 'next/navigation'

/* 공개 웹의 껍데기(GNB · Footer · SiteFx · 채널톡)를 관리자에서 걷어낸다.

   왜 이렇게 하는가 —
   루트 레이아웃은 서버 컴포넌트라 경로를 알 수 없고, 경로를 알아내려고 headers() 를 부르면
   공개 페이지 11장이 전부 동적 렌더로 바뀐다(SSG 포기). 라우트 그룹으로 나누는 방법도 있지만
   원작자 파일 30여 개를 통째로 옮겨야 해서 upstream 머지 때 비싸다.
   그래서 클라이언트 컴포넌트 한 겹으로 감싸 가린다. 공개 페이지의 정적 생성은 그대로다.

   ⛔ 특히 SiteFx(스크롤 리빌·커서 추종)는 관리자에 있으면 안 된다 —
      목록을 스크롤할 때마다 행이 하나씩 떠오른다 (A-00 §0). */
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}
