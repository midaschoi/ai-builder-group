'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import type { InsightCard, InsightDetail } from '@/lib/content'
import { readingMinutes, withToc } from '@/lib/toc'

export default function InsightArticle({
  post, related,
}: {
  post: InsightDetail
  related: InsightCard[]
}) {
  /* 목차는 렌더할 때마다 같은 규칙으로 만들어진다 — 서버·클라이언트 결과가 같아
     하이드레이션이 어긋나지 않는다 */
  const { html, toc } = withToc(post.body_html)
  const minutes = readingMinutes(post.body_html)
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR')
    : ''

  useEffect(() => {
    window.track?.('insight_detail_view', {
      slug: post.slug,
      category: post.category_slug,
      author_type: 'team',
    })
  }, [post.slug, post.category_slug])

  /* 스크롤 위치에 따라 현재 항목을 표시한다 */
  useEffect(() => {
    if (toc.length === 0) return
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc a'))
    const heads = toc.map(t => document.getElementById(t.id))
    const onScroll = () => {
      let i = heads.length - 1
      while (i > 0 && heads[i] && heads[i]!.getBoundingClientRect().top > 140) i--
      links.forEach((l, j) => l.classList.toggle('now', j === i))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])

  return (
    <main id="main">
      <div className="wrap art-head">
        <Link className="backlink" href="/insight">인사이트 목록으로</Link>
        <h1>{post.title}</h1>
        <p className="meta">
          {post.category_name} · <b>{post.author}</b>
          {date && <> · {date}</>} · 읽는 데 {minutes}분
        </p>
      </div>

      <div className="wrap art-body">
        <article className="art">
          {post.thumb_url && (
            <img className="art-cover" src={post.thumb_url} alt={`${post.title} 대표 이미지`} />
          )}

          {/* 저장 시점에 서버에서 sanitize 한 값이다 (FR-A03-03 · lib/sanitize.ts) */}
          <div dangerouslySetInnerHTML={{ __html: html }} />

          {post.tags.length > 0 && (
            <div className="tags">
              {post.tags.map(t => <span className="tag" key={t}>{t}</span>)}
            </div>
          )}
        </article>

        {toc.length > 0 && (
          <nav className="toc" aria-label="목차">
            <b>Contents</b>
            {toc.map((t, i) => (
              <a key={t.id} href={`#${t.id}`} className={i === 0 ? 'now' : undefined}>
                {i + 1}. {t.text}
              </a>
            ))}
          </nav>
        )}
      </div>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 776 }}>
          {related.length > 0 && (
            <>
              <h3 className="rel-h">함께 읽기</h3>
              {related.map(r => (
                <Link className="relrow" key={r.slug} href={`/insight/${r.slug}`}>
                  <span className="c">{r.category_name}</span>
                  <span className="t">{r.title}</span>
                </Link>
              ))}
            </>
          )}

          <div className="cta-banner" style={{ marginTop: 52 }}>
            <div>
              <h3>글이 도움되셨나요?</h3>
              <p>프로젝트 이야기를 들려주세요.</p>
            </div>
            <Link className="btn btn--lime" href="/contact"
              data-track="cta_click" data-location="insight_detail">
              문의하기 <span className="arr">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
