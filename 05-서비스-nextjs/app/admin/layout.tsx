import type { Metadata } from 'next'
import './admin.css'

/* /admin/* 전체에 걸리는 껍데기.

   여기서는 색인 차단만 한다 (FR-A00-02). 사이드바·헤더가 있는 실제 셸은
   (shell)/layout.tsx 에 있다 — A-01 로그인은 셸을 쓰지 않기 때문에 한 겹 나눴다.

   robots.txt 의 disallow 는 app/robots.ts 에, sitemap 제외는 app/sitemap.ts 가
   허용 목록 방식이라 자동으로 된다. */
export const metadata: Metadata = {
  title: '관리자',
  robots: { index: false, follow: false, nocache: true },
}

/* 관리자는 사람마다 보이는 것이 다르다. 한 장이라도 정적으로 굳으면 남의 목록이 캐시된다.
   ⚠ 접속 정보가 없는 상태로 빌드하면 세션 조회가 일찍 빠져나가 Next 가 "정적"으로 판정한다.
     그 상태로 배포한 뒤 환경변수를 채우면 런타임에 어긋난다. 여기서 못박아 둔다. */
export const dynamic = 'force-dynamic'

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
