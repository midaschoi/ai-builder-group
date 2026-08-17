'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAutosave, useSlugCheck } from '../../editor-hooks'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { saveInsight, uploadImage, type SaveState } from './actions'

/* A-03 Insight 편집.

   ⛔ 툴바에 H1 이 없다 (FR-A03-02). 공개 상세(P-05)는 글 제목이 h1 이므로
      본문에 h1 이 또 생기면 문서 구조가 깨진다.
      붙여넣기로 들어오는 h1 은 서버에서 h2 로 강등한다 — lib/sanitize.ts

   ⛔ 입력칸은 전부 제어 컴포넌트(value + onChange)여야 한다. defaultValue 를 쓰면 안 된다.
      React 19 는 <form action={fn}> 을 제출할 때 액션을 부르기 직전에 폼 초기화를 예약하고
      (react-dom requestFormReset), 커밋 단계에서 네이티브 form.reset() 을 호출한다.
      reset() 은 모든 필드를 defaultValue 로 되돌리므로 비제어 입력은 매 저장마다 비워진다 —
      검증 실패 후 "슬러그를 입력해 주세요"가 무한 반복되던 원인이 이것이었다.
      제어 입력은 React 가 value 와 함께 defaultValue 도 같이 맞춰두기 때문에 reset() 이 무해하다. */

const INITIAL: SaveState = {}

export type Category = { id: string; name: string }

export type Record_ = {
  id: string | null
  title: string
  slug: string
  excerpt: string
  body_html: string
  thumb_url: string
  category_id: string
  seo_title: string
  seo_description: string
  tags: string[]
  status: string
  reject_reason: string | null
  author_name: string | null
  updated_at: string | null
}

const LABEL: Record<string, string> = {
  draft: '초안', pending: '승인대기', published: '발행', rejected: '반려', archived: '보관',
}

export default function InsightEditor({
  record, categories, isAdmin, readOnly,
}: {
  record: Record_
  categories: Category[]
  isAdmin: boolean
  readOnly: boolean
}) {
  const [state, action, pending] = useActionState(saveInsight, INITIAL)
  const [dirty, setDirty] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const dirtyRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  /* 폼 값 — 전부 여기서 들고 있는다. 위 주석의 form.reset() 때문이다. */
  const [title, setTitle] = useState(record.title)
  const [slug, setSlug] = useState(record.slug)
  const [categoryId, setCategoryId] = useState(record.category_id)
  const [excerpt, setExcerpt] = useState(record.excerpt)
  const [thumb, setThumb] = useState(record.thumb_url)
  const [seoTitle, setSeoTitle] = useState(record.seo_title)
  const [seoDescription, setSeoDescription] = useState(record.seo_description)
  const [body, setBody] = useState(record.body_html)
  const [tags, setTags] = useState<string[]>(record.tags)
  const [tagDraft, setTagDraft] = useState('')

  const addTag = (raw: string) => {
    const v = raw.trim()
    if (!v || tags.includes(v)) { setTagDraft(''); return }
    setTags([...tags, v])
    setTagDraft('')
    markDirty()
  }

  const markDirty = useCallback(() => {
    dirtyRef.current = true
    setDirty(true)          /* 값이 같으면 React 가 리렌더를 건너뛴다 */
  }, [])

  /* 입력 한 번에 상태 갱신 + 미저장 표시 */
  const bind = useCallback(
    <T,>(set: (v: T) => void) => (v: T) => { set(v); markDirty() },
    [markDirty],
  )

  const editor = useEditor({
    /* SSR 에서 즉시 렌더하면 하이드레이션이 어긋난다 */
    immediatelyRender: false,
    /* 툴바의 활성 상태(굵게가 켜졌는지 등)를 갱신하려면 필요하다 */
    shouldRerenderOnTransaction: true,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },         /* ⛔ H1 없음 */
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ inline: false }),
    ],
    content: record.body_html || '',
    onUpdate: ({ editor }) => {
      setBody(editor.getHTML())
      markDirty()
    },
  })

  /* 저장이 끝나면 더 이상 미저장 상태가 아니다 */
  useEffect(() => {
    if (state.ok) { dirtyRef.current = false; setDirty(false) }
  }, [state.ok])

  /* 이탈 경고 (FR-A00-07) — 브라우저를 닫는 경우 */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  /* 이탈 경고 — 앱 안에서 이동하는 경우.
     브라우저 기본 경고만 붙이면 사이드바 클릭으로 나가는 경우가 안 잡힌다 (A-00 §3.4). */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return
      const a = (e.target as Element | null)?.closest('a')
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (!href.startsWith('/')) return
      if (!confirm('저장하지 않은 변경이 있습니다. 나가시겠습니까?')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('click', onClick, true)   /* 캡처 단계 — Link 보다 먼저 */
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  const upload = useCallback(async (file: File, into: 'body' | 'thumb') => {
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadImage(fd)
    if (res.error) { setUploadError(res.error); return }
    if (!res.url) return
    if (into === 'thumb') { setThumb(res.url); markDirty() }
    else editor?.chain().focus().setImage({ src: res.url, alt: '' }).run()
  }, [editor, markDirty])

  /* 30초 자동 저장 · 슬러그 실시간 확인 (../../editor-hooks.ts) */
  const savedAt = useAutosave({
    formRef,
    enabled: !readOnly && Boolean(record.id),
    isDirty: () => dirtyRef.current,
    pending,
  })
  const slugCheck = useSlugCheck('insight', slug, record.id)

  /* 상단 바 버튼 — 상태와 역할에 따라 달라진다 (A-03 §상단 바) */
  const buttons: Array<{ intent: string; label: string; primary?: boolean }> = []
  if (!readOnly) {
    const s = record.status
    if (s === 'published') {
      buttons.push({ intent: 'save', label: '수정 저장', primary: true })
      buttons.push({ intent: 'archive', label: '보관하기' })
    } else if (s === 'archived') {
      buttons.push({ intent: 'publish', label: '다시 발행', primary: true })
    } else {
      buttons.push({ intent: 'save', label: '임시저장' })
      if (isAdmin) buttons.push({ intent: 'publish', label: '발행하기', primary: true })
      else buttons.push({ intent: 'submit', label: s === 'rejected' ? '다시 제출' : '제출하기', primary: true })
    }
  }

  const btn = (b: { intent: string; label: string; primary?: boolean }) => (
    <button
      key={b.intent}
      className={b.primary ? 'adm-btn' : 'adm-btn adm-btn--ghost'}
      type="submit" name="intent" value={b.intent} disabled={pending}
    >
      {pending ? '저장 중…' : b.label}
    </button>
  )

  return (
    <form action={action} className="ed" ref={formRef}>
      <input type="hidden" name="id" value={record.id ?? 'new'} />
      {/* useAutosave 가 이 버튼을 눌러 보낸다 — 저장 경로를 하나로 유지한다 */}
      <button type="submit" name="intent" value="save" data-autosave hidden aria-hidden="true" tabIndex={-1} />
      <input type="hidden" name="body_html" value={body} />
      <input type="hidden" name="thumb_url" value={thumb} />
      <input type="hidden" name="tags" value={tags.join(',')} />

      {/* 좁은 화면에서는 편집을 막는다 (A-00 §모바일). 목록·읽기는 그대로 된다 */}
      <div className="ed-mobile">
        <b>이 화면은 데스크톱에서 작업해 주세요</b>
        <p>
          편집기 툴바와 발행 설정을 좁은 화면에 우겨넣으면 오히려 잘못 눌립니다.
          글 목록과 읽기는 휴대폰에서도 그대로 됩니다.
        </p>
        <Link className="adm-btn" href="/admin/insight">목록으로</Link>
      </div>

      {/* ── 상단 바 ─────────────────────────────────────────── */}
      <div className="ed-top">
        <Link className="adm-manage" href="/admin/insight">← 목록</Link>
        {/* 제목을 고정 바에도 둔다 (A-03 와이어프레임).
            본문을 쓰려고 스크롤하면 제목 입력칸이 툴바 뒤로 사라져 어느 글인지 알 수 없다. */}
        <span className="ed-top-title" title={title || undefined}>
          {title || <span className="adm-dim">제목 없음</span>}
        </span>
        <span className="adm-badge" data-s={record.status}>{LABEL[record.status] ?? record.status}</span>
        {dirty
          ? <span className="adm-dim" style={{ fontSize: 12 }}>· 저장하지 않은 변경</span>
          : savedAt && (
            <span className="adm-dim" style={{ fontSize: 12 }}>
              · {savedAt.toLocaleTimeString('ko-KR')} 자동 저장됨
            </span>
          )}
        {/* 공개 화면 그대로 보여준다 — 로그인한 사람에게만 열린다 (FR-A07-02) */}
        {slug && (
          <a className="adm-manage" href={`/insight/${slug}/preview`} target="_blank" rel="noreferrer">미리보기 ↗</a>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {buttons.map(btn)}
        </span>
      </div>

      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && (
        <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
          저장했습니다.{state.notice ? ` ${state.notice}` : ''}
        </p>
      )}
      {uploadError && <p className="adm-error" role="alert">{uploadError}</p>}

      {/* 반려 사유는 편집 화면 안에서 보여준다 — 목록에만 있으면 고치는 동안 안 보인다 */}
      {record.status === 'rejected' && record.reject_reason && (
        <p className="adm-error" role="status">
          <b>반려됨</b> — {record.reject_reason}
        </p>
      )}

      {readOnly && (
        <p className="adm-notice">
          {record.status === 'pending'
            ? '제출한 글은 승인·반려 전까지 수정할 수 없습니다.'
            : '이 글은 운영 관리자만 수정할 수 있습니다.'}
        </p>
      )}

      <div className="ed-grid">
        {/* ── 본문 ──────────────────────────────────────────── */}
        <div className="adm-card ed-main">
          {!readOnly && editor && (
            <div className="ed-toolbar">
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'on' : ''}>H2</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'on' : ''}>H3</button>
              <i />
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'on' : ''}><b>B</b></button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'on' : ''}><i>I</i></button>
              <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'on' : ''}><s>S</s></button>
              <i />
              <button type="button" onClick={() => {
                const prev = editor.getAttributes('link').href ?? ''
                const url = prompt('링크 주소', prev)
                if (url === null) return
                if (url === '') editor.chain().focus().unsetLink().run()
                else editor.chain().focus().setLink({ href: url }).run()
              }} className={editor.isActive('link') ? 'on' : ''}>링크</button>
              <i />
              <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'on' : ''}>• 목록</button>
              <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'on' : ''}>1. 목록</button>
              <i />
              <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'on' : ''}>인용</button>
              <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={editor.isActive('codeBlock') ? 'on' : ''}>코드</button>
              <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>구분선</button>
              <i />
              <label className="ed-upload">
                이미지
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                  onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, 'body'); e.target.value = '' }} />
              </label>
            </div>
          )}

          <div className="ed-title">
            <input
              name="title" value={title} placeholder="제목을 입력하세요"
              onChange={e => bind(setTitle)(e.target.value)} readOnly={readOnly} maxLength={120}
            />
          </div>

          <EditorContent editor={editor} className="ed-body" />
        </div>

        {/* ── 사이드 ────────────────────────────────────────── */}
        <aside className="ed-side">
          <section className="adm-card">
            <h2>발행 설정</h2>

            <div className="adm-field">
              <label htmlFor="slug">슬러그 <span aria-hidden="true">*</span></label>
              <input id="slug" name="slug" value={slug} readOnly={readOnly}
                onChange={e => bind(setSlug)(e.target.value)}
                placeholder="vibe-coding-difference" spellCheck={false} />
              {/* 저장할 때만 알려주면 다 쓰고 발행을 누른 다음에야 중복을 안다 */}
              {slugCheck.state !== 'idle' && (
                <small className={`ed-slug ed-slug--${slugCheck.state}`}>
                  {slugCheck.state === 'checking' && '확인 중…'}
                  {slugCheck.state === 'ok' && '✓ 사용 가능'}
                  {slugCheck.state !== 'checking' && slugCheck.state !== 'ok' && slugCheck.message}
                </small>
              )}
              {/* ⚠ 형식 설명은 뺐다 — 잘못 쓰면 위 실시간 확인이 정확한 문구를 바로 띄운다 */}
              {(slug || record.status === 'published') && (
                <small className="adm-dim">
                  {slug && <code>/insight/{slug}</code>}
                  {record.status === 'published' && (
                    <>{slug && <br />}⚠ 주소를 바꾸면 이전 주소를 넘기는 301 을 자동으로 만듭니다.</>
                  )}
                </small>
              )}
            </div>

            <div className="adm-field">
              <label htmlFor="category_id">카테고리 <span aria-hidden="true">*</span></label>
              <select id="category_id" name="category_id" value={categoryId}
                onChange={e => bind(setCategoryId)(e.target.value)} disabled={readOnly}>
                <option value="">선택하세요</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="adm-field">
              <label htmlFor="excerpt">요약 <span aria-hidden="true">*</span></label>
              <textarea id="excerpt" name="excerpt" value={excerpt} rows={3}
                onChange={e => bind(setExcerpt)(e.target.value)} readOnly={readOnly} maxLength={160} />
              <small className="adm-dim">목록 카드에 노출됩니다. 160자 이내.</small>
            </div>

            <div className="adm-field">
              <label>썸네일</label>
              {thumb
                ? <img className="ed-thumb" src={thumb} alt="" />
                : <div className="ed-thumb ed-thumb--empty">16:9 · 최대 2MB</div>}
              {!readOnly && (
                <span style={{ display: 'flex', gap: 6 }}>
                  <label className="adm-btn adm-btn--ghost ed-upload">
                    {thumb ? '이미지 변경' : '+ 이미지 업로드'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                      onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, 'thumb'); e.target.value = '' }} />
                  </label>
                  {thumb && (
                    <button type="button" className="adm-btn adm-btn--ghost"
                      onClick={() => { setThumb(''); markDirty() }}>제거</button>
                  )}
                </span>
              )}
            </div>
          </section>

          {/* 공개 상세(P-05) 하단의 태그 칩이 이 값을 쓴다 */}
          <section className="adm-card">
            <h2>태그</h2>
            {tags.length > 0 && (
              <div className="wk-tags">
                {tags.map(t => (
                  <span key={t}>
                    {t}
                    {!readOnly && (
                      <button type="button" aria-label={`${t} 제거`}
                        onClick={() => { setTags(tags.filter(x => x !== t)); markDirty() }}>✕</button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {!readOnly && (
              <div className="adm-field">
                <input
                  value={tagDraft} placeholder="외주 입력 후 Enter" maxLength={24}
                  onChange={e => setTagDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key !== 'Enter' && e.key !== ',') return
                    /* Enter 로 폼이 제출되면 안 된다 — 태그만 추가하고 멈춘다 */
                    e.preventDefault()
                    addTag(tagDraft)
                  }}
                  onBlur={() => addTag(tagDraft)}
                />
              </div>
            )}
          </section>

          <section className="adm-card">
            <h2>SEO</h2>
            <div className="adm-field">
              <label htmlFor="seo_title">SEO 타이틀</label>
              <input id="seo_title" name="seo_title" value={seoTitle}
                onChange={e => bind(setSeoTitle)(e.target.value)} readOnly={readOnly} maxLength={60} />
              <small className="adm-dim">비우면 제목을 씁니다.</small>
            </div>
            <div className="adm-field">
              <label htmlFor="seo_description">SEO 디스크립션</label>
              <textarea id="seo_description" name="seo_description" value={seoDescription}
                rows={3} onChange={e => bind(setSeoDescription)(e.target.value)}
                readOnly={readOnly} maxLength={160} />
              <small className="adm-dim">비우면 요약을 씁니다.</small>
            </div>
          </section>

          <section className="adm-card">
            <h2>정보</h2>
            <dl className="ed-meta">
              <dt>작성자</dt><dd>{record.author_name ?? '—'}</dd>
              <dt>수정</dt><dd>{record.updated_at ? new Date(record.updated_at).toLocaleString('ko-KR') : '—'}</dd>
            </dl>
          </section>
        </aside>
      </div>
    </form>
  )
}
