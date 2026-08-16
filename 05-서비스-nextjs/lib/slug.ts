/* 슬러그 규칙 (FR-A03-04 · FR-A05-03).

   ⚠ 한글 제목을 로마자로 자동 변환하지 않는다.
     "바이브 코딩 외주" → "baibeu-koding-oeju" 같은 주소가 나오는데,
     읽을 수도 없고 검색에도 도움이 안 된다. 비워두고 직접 쓰게 한다. */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type SlugCheck = { ok: true; value: string } | { ok: false; message: string }

export function checkSlug(raw: string): SlugCheck {
  const value = raw.trim().toLowerCase()

  if (!value) return { ok: false, message: '슬러그를 입력해 주세요.' }
  if (value.length > 80) return { ok: false, message: '슬러그가 너무 깁니다. 80자 이하로 써주세요.' }
  if (!SLUG_PATTERN.test(value)) {
    return {
      ok: false,
      message: '영문 소문자·숫자·하이픈만 쓸 수 있습니다. 하이픈으로 시작하거나 끝날 수 없습니다.',
    }
  }
  return { ok: true, value }
}

/** 입력 중 실시간 표시용 — 저장을 막지는 않는다 */
export function slugPreviewPath(kind: 'insight' | 'work', slug: string): string {
  return `/${kind}/${slug || '...'}`
}
