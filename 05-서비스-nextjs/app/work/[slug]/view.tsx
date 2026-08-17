'use client'

import Link from 'next/link'
import { Fragment, useEffect } from 'react'
import type { WorkCard, WorkDetail } from '@/lib/content'

/* 3막의 h2 는 템플릿이 가지고 있고, 본문 HTML 은 각 막 안쪽만 담는다.
   에디터에서 제목을 못 쓰게 막아 둔 이유가 이것이다 (A-05 §축소판 툴바) —
   막 안에 제목이 또 생기면 01·02·03 과 겹친다. */
const ACTS = [
  { no: '01', label: '문제', key: 'body_problem' },
  { no: '02', label: '해결', key: 'body_solution' },
  { no: '03', label: '결과', key: 'body_result' },
] as const

export default function WorkArticle(
  { work, related = [] }: { work: WorkDetail; related?: WorkCard[] },
) {
  useEffect(() => {
    window.track?.('work_detail_view', { slug: work.slug, category: work.category_slug })
  }, [work.slug, work.category_slug])

  return (
    <main id="main">
      <div className="wrap wd-head">
        <Link className="backlink" href="/work">Work 목록으로</Link>
        <h1>{work.title}</h1>
        {work.summary && <p className="sum">{work.summary}</p>}
        <div className="tags">
          {work.category_name && <span className="tag">{work.category_name}</span>}
          {work.tech_tags.map(t => <span className="tag" key={t}>{t}</span>)}
          {work.year && <span className="tag num">{work.year}</span>}
        </div>
      </div>

      {work.hero_url && (
        <div className="wrap wd-cover">
          <div className="slot mask">
            {/* 21:9 로 올린 히어로다. 비율은 .wd-cover .slot 이 잡는다 */}
            <img className="cover" src={work.hero_url} alt={`${work.title} 대표 화면`} />
          </div>
        </div>
      )}

      <div className="wrap wd-body">
        <article className="wd-art">
          {ACTS.map(act => {
            const html = work[act.key]
            if (!html) return null
            /* ⚠ <section> 으로 감싸면 안 된다 — .wd-art h2:first-child 가 세 막 전부에
               걸려 막 사이 간격이 사라진다. 형제로 늘어놓아야 시안과 같은 리듬이 나온다. */
            return (
              <Fragment key={act.no}>
                <h2><span className="no">{act.no}</span>{act.label}</h2>
                {/* 저장 시점에 서버에서 sanitize 한 값이다 (FR-A03-03 · lib/sanitize.ts).
                    그것이 유일한 방어선이므로 여기서 다시 거르지 않는다 — 두 곳에서 거르면
                    어느 쪽이 실제로 막고 있는지 알 수 없게 된다. */}
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </Fragment>
            )
          })}
        </article>

        <aside className="aside">
          <div className="aside__head"><span>Project Sheet</span><span>{work.year}</span></div>
          <dl>
            {work.period_label && (
              <div className="row"><dt>기간</dt><dd className="num">{work.period_label}</dd></div>
            )}
            {work.year && (
              <div className="row"><dt>연도</dt><dd className="num">{work.year}</dd></div>
            )}
            {work.scope_label && (
              <div className="row"><dt>범위</dt><dd>{work.scope_label}</dd></div>
            )}
            {work.tech_tags.length > 0 && (
              <div className="row"><dt>기술</dt><dd>{work.tech_tags.join(' · ')}</dd></div>
            )}
            {work.result_url && (
              <div className="row">
                <dt>결과물</dt>
                <dd>
                  {/* 외부로 나가는 링크다 — opener 로 원래 탭을 조작하지 못하게 막는다 */}
                  <a href={work.result_url} target="_blank" rel="noopener noreferrer nofollow">
                    바로가기 ↗
                  </a>
                </dd>
              </div>
            )}
            {work.builders.length > 0 && (
              <div className="row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <dt>참여 빌더</dt>
                <dd style={{ textAlign: 'left' }}>
                  {work.builders.map(b => (
                    <Link key={b.slug} className="b-chip" href={`/builder?b=${b.slug}`}
                      style={{ textDecoration: 'none' }}>
                      <i style={b.avatar_url
                        ? { backgroundImage: `url(${b.avatar_url})`, backgroundSize: 'cover' }
                        : undefined} />
                      {b.name}{b.role_label ? ` · ${b.role_label}` : ''}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          {work.builders.length > 0 && (
            <p className="note">빌더 칩을 누르면 프로필과 작업물로 이동합니다.</p>
          )}
        </aside>
      </div>

      {/* FR-P03-03 — 같은 카테고리 최신 3건. 0건이면 섹션째 그리지 않는다 */}
      {related.length > 0 && (
        <section className="wd-rel">
          <div className="wrap">
            <h3>같은 카테고리의 다른 프로젝트</h3>
            <div className="wd-rel__grid">
              {related.map(r => (
                <Link className="wd-rel__card" key={r.slug} href={`/work/${r.slug}`}>
                  <span className="slot">
                    {r.thumb_url && <img src={r.thumb_url} alt={`${r.title} 대표 화면`} loading="lazy" />}
                  </span>
                  <span className="c">{r.category_name}{r.year ? ` · ${r.year}` : ''}</span>
                  <span className="t">{r.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="wrap">
          <div className="cta-banner">
            <div>
              <h3>비슷한 프로젝트를 계획 중이신가요?</h3>
              <p>지금 상황을 알려주시면, 맞는 빌더와 진행 방식을 제안드립니다.</p>
            </div>
            <Link className="btn btn--lime" href="/contact"
              data-track="cta_click" data-location="work_detail">
              프로젝트 문의 <span className="arr">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
