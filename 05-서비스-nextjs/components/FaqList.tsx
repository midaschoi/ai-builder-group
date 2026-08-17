'use client'

import { useMemo, useState } from 'react'
import type { FaqTopic } from '@/app/_faq'

/* 주제 탭 + 아코디언. 홈 프리뷰(S9)와 /faq 가 같은 컴포넌트를 쓴다.
   전에는 홈에만 마크업이 있고 열림 상태를 전역 DOM 이벤트로 다뤘는데,
   페이지가 둘이 되는 순간 같은 스크립트가 두 벌 돌게 된다. 상태를 컴포넌트 안에 둔다.

   열림은 Set 이다. '하나 열면 앞의 것이 닫히는' 방식이면 '모두 펼치기'가 성립하지 않고,
   답을 두 개 비교해서 읽고 싶은 경우도 막힌다. */
export default function FaqList({
  topics,
  defaultOpen,
  defaultTopic,
  expandAll = false,
}: {
  topics: FaqTopic[]
  defaultOpen?: string
  /** 처음 열릴 주제. /faq/[topic] 이 경로로 들어올 때 쓴다 */
  defaultTopic?: string
  /** '모두 펼치기' 버튼 노출. 문항이 많은 전용 페이지에서만 켠다 */
  expandAll?: boolean
}) {
  const [topic, setTopic] = useState(
    topics.some(t => t.key === defaultTopic) ? defaultTopic! : (topics[0]?.key ?? ''),
  )
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen ? [defaultOpen] : []))
  const current = topics.find(t => t.key === topic) ?? topics[0]

  const ids = useMemo(() => current?.items.map(i => i.id) ?? [], [current])
  /* 현재 주제의 문항 기준으로만 판단한다 — 다른 주제까지 세면 버튼 라벨이 화면과 어긋난다 */
  const allOpen = ids.length > 0 && ids.every(id => open.has(id))

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setOpen(prev => {
      const next = new Set(prev)
      if (allOpen) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })

  return (
    <>
      {(topics.length > 1 || expandAll) && (
        <div className="faq-bar">
          {topics.length > 1 && (
            <div className="topics" role="tablist" aria-label="FAQ 주제">
              {topics.map(t => (
                <button
                  key={t.key}
                  className="topic"
                  role="tab"
                  type="button"
                  aria-selected={t.key === topic}
                  data-topic={t.key}
                  data-track="faq_topic_change"
                  onClick={() => setTopic(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {expandAll && (
            <button className="faq-all" type="button" onClick={toggleAll} aria-expanded={allOpen}>
              {allOpen ? '모두 접기' : '모두 펼치기'}
              <i aria-hidden="true">{allOpen ? '↑' : '↓'}</i>
            </button>
          )}
        </div>
      )}

      <div>
        {current?.items.map(it => (
          <div className="faq-item" key={it.id}>
            <button
              className="faq-q"
              type="button"
              aria-expanded={open.has(it.id)}
              aria-controls={it.id}
              onClick={() => toggle(it.id)}
            >
              {it.q}
            </button>
            {/* 안쪽 래퍼가 꼭 필요하다. 0fr 트랙은 그리드 아이템의 '자동 최소 크기'까지만
                줄이는데, p 에 padding 이 있으면 min-height:0 으로도 그 패딩만큼(28px)이
                남아 접었을 때 한 줄이 새어 나온다. 패딩 없는 래퍼를 아이템으로 둔다. */}
            <div className="faq-a" id={it.id} role="region">
              <div className="faq-a__in"><p>{it.a}</p></div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
