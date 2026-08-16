'use client'

import { useEffect } from 'react'
import { CHANNEL_PLUGIN_KEY } from '@/app/_integrations'

declare global {
  interface Window {
    ChannelIO?: ChannelIOFn
    ChannelIOInitialized?: boolean
  }
}
type ChannelIOFn = {
  (...args: unknown[]): void
  q?: unknown[]
  c?: (args: unknown) => void
}

/* 채널톡 상담 위젯.
   키가 비어 있으면 아무것도 하지 않는다 — 연동 전에도 사이트는 그대로 동작해야 한다.

   ⚠ 잘못된 키를 넣으면 boot 콜백이 오지 않는다 (에러도 없다 — Origin 에서 실측).
      그래서 "실패를 감지해 되돌리는" 구조가 아니라 "성공했을 때만 넘어가는" 구조로 짰다.
      키를 바꾼 뒤에는 반드시 런처를 눌러 메신저가 열리는지 눈으로 확인할 것.

   런처는 채널톡 기본 것을 쓴다. 채널 테마 색을 브랜드 라임으로 맞춰두면 따로 만들 이유가 없고,
   자체 런처와 같이 두면 메신저가 열렸을 때 우하단에서 둘이 겹친다 (Origin 에서 확인).
   대신 기본 런처는 우하단 고정이라 하단 중앙의 .dock 과 부딪힌다 →
   body.ct-on 을 붙여 CSS 쪽에서 dock 이 비켜서게 한다. */
/* 키는 관리자 화면(A-08)에서 온다. 넘어오지 않으면 기존처럼 환경변수를 쓴다 —
   DB 마이그레이션 전에도 그대로 동작한다. (260812 2차 미팅) */
export default function ChannelTalk({ pluginKey }: { pluginKey?: string } = {}) {
  const key = pluginKey || CHANNEL_PLUGIN_KEY

  useEffect(() => {
    if (!key) return
    if (window.ChannelIOInitialized) return
    window.ChannelIOInitialized = true

    /* 플러그인이 내려오기 전 호출을 큐에 쌓아둔다 — 채널톡 공식 스니펫과 같은 구조 */
    const ch = function (...args: unknown[]) { ch.c?.(args) } as ChannelIOFn
    ch.q = []
    ch.c = (args: unknown) => { ch.q!.push(args) }
    window.ChannelIO = ch

    const el = document.createElement('script')
    el.async = true
    el.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js'
    document.head.appendChild(el)

    window.ChannelIO('boot', { pluginKey: key, language: 'ko' }, (err: unknown) => {
      if (err) return
      document.body.classList.add('ct-on')
      /* 대화가 실제로 시작된 시점만 계측한다. 위젯을 열고 닫는 건 UI 상태라 잡지 않는다. */
      window.ChannelIO!('onChatCreated', () => window.track?.('chat_start', { section: 'channeltalk' }))
    })

    return () => {
      try { window.ChannelIO?.('shutdown') } catch {}
      window.ChannelIOInitialized = false
      document.body.classList.remove('ct-on')
    }
  }, [key])

  return null
}
