'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/* GA4 (260812 2차 미팅 — "GA 연동을 각자 하신 다음에 … 최종 컨펌된 것만").

   측정 ID 는 관리자 화면(A-08)에서 넣는다. 값이 없으면 스크립트를 아예 넣지 않는다 —
   빈 gtag 를 로드해 두면 네트워크만 쓰고 아무 데이터도 안 쌓인다.

   TR-03: 이벤트 발화는 공통 래퍼(window.track)를 통해서만 한다.
   여기서 그 래퍼의 진짜 구현을 채운다. SiteFx 의 것은 콘솔 출력 스텁이다. */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export default function Analytics({ measurementId }: { measurementId: string }) {
  useEffect(() => {
    if (!measurementId) return

    /* SiteFx 의 스텁을 실제 전송으로 갈아끼운다.
       SiteFx 는 `??=` 로 넣으므로 마운트 순서가 어느 쪽이든 이 구현이 남는다. */
    /* 시그니처는 SiteFx 의 전역 선언과 정확히 같아야 한다 —
       params 를 Record<string,string> 으로 좁히면 strictFunctionTypes 에서 대입이 막힌다. */
    window.track = (name: string, params?: Record<string, unknown>) => {
      window.gtag?.('event', name, params ?? {})
    }
  }, [measurementId])

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  )
}
