import { SITE, SITE_URL, DEFAULT_DESC } from '@/app/_meta'

/* SR-04 — JSON-LD 3종 (Organization / Article / BreadcrumbList).

   ⚠ 스크립트 태그로 넣지만 사용자 입력을 붙이지 않는다. 값은 전부 서버에서 만든 객체를
     JSON.stringify 한 것이고, `<` 만 이스케이프해 `</script>` 로 태그가 닫히는 것을 막는다.
     문자열을 손으로 조립하면 제목에 따옴표 하나만 들어가도 구조가 깨진다. */
function Ld({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

const abs = (p: string) => new URL(p, SITE_URL).toString()

/** 전역 — 이 사이트가 누구의 것인지. 루트 레이아웃에 한 번만 둔다 */
export function OrganizationLd() {
  return (
    <Ld data={{
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE,
      url: SITE_URL,
      description: DEFAULT_DESC,
      logo: abs('/icon.svg'),
    }} />
  )
}

/** 상세 페이지 — 글·프로젝트 하나 */
export function ArticleLd({
  headline, description, image, published, modified, author, path,
}: {
  headline: string
  description?: string | null
  image?: string | null
  published?: string | null
  modified?: string | null
  author?: string | null
  path: string
}) {
  return (
    <Ld data={{
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline,
      ...(description ? { description } : {}),
      ...(image ? { image: [image] } : {}),
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      author: { '@type': author ? 'Person' : 'Organization', name: author || SITE },
      publisher: { '@type': 'Organization', name: SITE, logo: { '@type': 'ImageObject', url: abs('/icon.svg') } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': abs(path) },
    }} />
  )
}

/** 상세 페이지 — 홈 › 목록 › 현재 */
export function BreadcrumbLd({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <Ld data={{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: '홈', path: '/' }, ...trail].map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.name,
        item: abs(t.path),
      })),
    }} />
  )
}
