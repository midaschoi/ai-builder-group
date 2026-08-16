import sanitizeHtml from 'sanitize-html'

/* 본문 정제 (FR-A03-03).

   ⚠ 이 파일이 유일한 방어선이다.
     공개 상세 페이지는 body_html 을 dangerouslySetInnerHTML 로 그린다.
     에디터(클라이언트)에서 거른 것은 신뢰하지 않는다 — 요청을 직접 만들면 우회된다.
     그래서 저장 직전 서버에서 한 번 더 통과시킨다. */

const ALLOWED_TAGS = [
  'h2', 'h3', 'p', 'strong', 'em', 's', 'a',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'img', 'hr', 'br',
]

export function sanitizeBody(dirty: string): string {
  return sanitizeHtml(dirty ?? '', {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      code: ['class'],       /* 하이라이트용 language-* */
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    /* data: URI 를 막는다. 허용하면 본문에 수 MB 짜리 이미지가 통째로 박혀
       DB 행이 부풀고 목록 쿼리까지 느려진다. 이미지는 Storage 를 거친다. */
    allowedSchemesByTag: { img: ['http', 'https'] },

    transformTags: {
      /* h1 강등 (FR-A03-02).
         툴바에서 H1 을 뺐지만 다른 곳에서 복사해 붙이면 그대로 들어온다.
         공개 상세(P-05)는 글 제목이 h1 이므로 본문에 h1 이 또 생기면 문서 구조가 깨진다. */
      h1: 'h2',

      /* 외부 링크에 rel 을 강제한다. target=_blank 만 있고 noopener 가 없으면
         열린 창이 window.opener 로 원래 탭을 조작할 수 있다. */
      a: (tagName, attribs) => {
        const href = attribs.href ?? ''
        const external = /^https?:\/\//i.test(href)
        return {
          tagName,
          attribs: external
            ? { ...attribs, target: '_blank', rel: 'nofollow noopener noreferrer' }
            : { ...attribs },
        }
      },
    },

    /* 태그가 제거돼도 안쪽 글자는 남긴다 — 문단이 통째로 사라지는 것보다 낫다 */
    nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  })
}

/** 본문에 실제 내용이 있는가. Tiptap 은 빈 상태에서도 `<p></p>` 를 내보낸다. */
export function isBodyEmpty(html: string): boolean {
  return sanitizeHtml(html ?? '', { allowedTags: [], allowedAttributes: {} }).trim().length === 0
    && !/<img\b/i.test(html ?? '')
}
