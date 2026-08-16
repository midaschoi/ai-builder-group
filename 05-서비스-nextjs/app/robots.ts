import type { MetadataRoute } from 'next'
import { SITE_URL } from './_meta'

/* robots.txt 가 없으면 404 가 나가고, 크롤러는 "제한 없음"으로 해석한다. 동작은 같지만
   사이트맵 위치를 알려줄 자리가 사라진다 — 이 파일의 실제 목적은 그쪽이다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /* 내부 제작 문서. 페이지 metadata 에도 noindex 를 걸어 뒀지만,
         크롤 자체를 막아 두면 색인 후보에도 오르지 않는다.
         /admin 도 같은 이유다 — 수주용 랜딩에 백오피스 주소가 검색에 뜨면 안 된다 (FR-A00-02).
         sitemap.ts 는 허용 목록 방식이라 /admin 이 애초에 들어가지 않는다. */
      disallow: ['/image-guide', '/admin'],
    },
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  }
}
