/* 본문에서 목차를 뽑는다 (P-05 상세의 우측 Contents).

   시안은 `<h2 id="t1">` 을 손으로 박아 두었지만, 관리자에서 쓴 글에는 id 가 없다.
   에디터가 id 를 넣게 하는 대신 여기서 붙인다 — 글쓴이가 앵커를 신경 쓸 일이 아니고,
   같은 글을 다시 저장해도 목차가 늘 같은 규칙으로 만들어진다.

   ⚠ 정규식으로 처리한다. 대상은 lib/sanitize.ts 를 이미 통과한 HTML 이라
     허용 태그가 15종뿐이고 속성도 정해져 있다 — 임의의 HTML 을 파싱하는 것이 아니다. */

export type TocItem = { id: string; text: string }

const H2 = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi

/** 태그를 벗기고 엔티티를 되돌려 목차에 쓸 글자만 남긴다 */
function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, ' ')
    .trim()
}

/** h2 에 순번 id 를 붙이고 목차를 함께 돌려준다 */
export function withToc(html: string): { html: string; toc: TocItem[] } {
  if (!html) return { html: '', toc: [] }

  const toc: TocItem[] = []
  let n = 0

  const out = html.replace(H2, (_match, attrs: string, inner: string) => {
    n += 1
    const id = `t${n}`
    const text = plain(inner)
    toc.push({ id, text })
    /* 이미 id 가 있으면(붙여넣기로 딸려온 경우) 우리 것으로 덮는다 —
       두 개가 남으면 브라우저가 앞의 것만 보고 목차 링크가 엉뚱한 곳으로 간다. */
    const kept = attrs.replace(/\sid\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    return `<h2${kept} id="${id}">${inner}</h2>`
  })

  return { html: out, toc }
}

/** 읽는 데 걸리는 시간(분). 한국어 기준 분당 500자로 잡는다 */
export function readingMinutes(html: string): number {
  const chars = plain(html).length
  return Math.max(1, Math.round(chars / 500))
}
