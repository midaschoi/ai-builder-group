import type { Metadata } from 'next'
import { pageMeta, SITE, SITE_URL } from './_meta'
import './style.css'
import Gnb from '@/components/Gnb'
import Footer from '@/components/Footer'
import SiteFx from '@/components/SiteFx'
import ChannelTalk from '@/components/ChannelTalk'
import ChromeGate from '@/components/ChromeGate'
import Analytics from '@/components/Analytics'
import { getSiteSettings } from '@/lib/settings'

/* 배포 주소를 코드에 박아두면 안 된다. 실제로 ai-builder-group-pearl(옛 HTML 목업 배포본)이
   박혀 있어서, 이 사이트를 공유해도 og:url · og:image 가 남의 도메인을 가리켰다.
   값은 _meta.ts 의 SITE_URL 하나에서 나온다 — sitemap · robots 도 같은 값을 본다. */
/* 상수였던 것을 함수로 바꿨다 — 검색엔진 소유권 확인 코드가 DB(관리자 화면 A-08)에서 오기 때문이다.
   260812 2차 미팅: "네이버랑 구글 서치 콘솔 이런 것들은 그냥 한 번 등록하면 되는 거라서".
   값은 태그 캐시를 타므로 공개 페이지의 정적 생성은 그대로다 (lib/settings.ts). */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()

  return {
    metadataBase: new URL(SITE_URL),
    /* 나머지 라우트와 같은 조립기를 쓴다 — 값이 한 곳에서만 나온다 */
    ...pageMeta({ title: `${SITE} — 바이브 코딩 외주`, path: '/' }),
    verification: {
      google: s.googleSiteVerification || undefined,
      /* 네이버는 Next 의 전용 필드가 없어 other 로 넣는다 */
      other: s.naverSiteVerification
        ? { 'naver-site-verification': s.naverSiteVerification }
        : undefined,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings()

  return (
    <html lang="ko">
      <body>
        {/* 관리자(/admin/*)에서는 공개 웹 껍데기를 통째로 걷어낸다 — components/ChromeGate.tsx */}
        <ChromeGate>
          <a className="skip" href="#main">본문 바로가기</a>
          <Gnb />
        </ChromeGate>
        {children}
        <ChromeGate>
          <Footer />
          <SiteFx />
          {/* 측정 ID·플러그인 키는 관리자 화면(A-08)에서 온다. 없으면 아무것도 하지 않는다 */}
          <Analytics measurementId={s.ga4MeasurementId} />
          <ChannelTalk pluginKey={s.channelPluginKey} />
        </ChromeGate>
      </body>
    </html>
  )
}
