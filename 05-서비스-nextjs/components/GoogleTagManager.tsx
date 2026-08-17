'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/* 구글 태그 관리자(GTM).

   ⚠ GTM 은 **측정 도구가 아니라 태그를 담는 그릇**이다.
     이것만 넣으면 아무 데이터도 쌓이지 않는다 — GTM 안에서 GA4 태그를 또 만들어야 한다.
     GA4 속성(G-…)은 어느 쪽이든 별도로 필요하다.

   ⛔ GA4 를 두 곳에서 연결하지 말 것.
     사이트 설정의 `GA4 측정 ID` 를 채우고 + GTM 안에서도 GA4 태그를 만들면
     **같은 이벤트가 두 번 집계된다.** 둘 중 하나만 쓴다:
       · 직접 연결  — GA4 측정 ID 만 채운다 (가장 단순. 이벤트 7종이 바로 동작)
       · GTM 경유  — 컨테이너 ID 만 채우고, GA4 태그·트리거를 GTM 에서 만든다

   우리 이벤트를 GTM 으로 보내는 법 —
     window.track() 이 dataLayer 에 { event: 이름, …파라미터 } 를 넣는다.
     GTM 에서 "맞춤 이벤트" 트리거를 그 이름으로 만들고 GA4 이벤트 태그에 연결하면 된다.
     보내는 이름은 6종 — cta_click · work_detail_view · insight_detail_view
                        · youtube_outbound · contact_submit · chat_start

   noscript iframe 은 넣지 않는다. 스크립트가 꺼진 브라우저용 대체 수단인데,
   이 사이트는 애초에 스크립트 없이는 동작하지 않는다 (리빌·아코디언·매칭 전부 JS).
   그 상태에서 태그만 살려봐야 셀 사람이 없고, body 최상단에 iframe 하나가 늘 뜬다. */

export default function GoogleTagManager({ containerId }: { containerId: string }) {
  useEffect(() => {
    if (!containerId) return

    /* SiteFx 의 콘솔 스텁을 갈아끼운다.
       ⚠ Analytics.tsx(GA4 직접)도 같은 자리를 덮어쓴다. 둘 다 켜져 있으면 나중에 마운트된 쪽이
         이긴다 — 그래서 위 주석대로 **한쪽만** 켜는 것이 전제다. */
    window.dataLayer = window.dataLayer || []
    window.track = (name: string, params?: Record<string, unknown>) => {
      window.dataLayer!.push({ event: name, ...(params ?? {}) })
    }
  }, [containerId])

  if (!containerId) return null

  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${containerId}');`}
    </Script>
  )
}
