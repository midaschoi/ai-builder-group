'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useAutosave, useSlugCheck } from '../../editor-hooks'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { saveWork, uploadWorkImage, type SaveState } from './actions'
import { BuilderPicker } from './builder-picker'

/* A-05 Work 편집.

   A-03 과 같은 것: 상단 바 · 상태 머신 · 슬러그 · 이탈 경고 · 서버 sanitize.
   A-03 과 다른 것: 본문이 자유 에디터가 아니라 문제/해결/결과 3막 고정이고,
   참여 빌더를 다대다로 연결하며, 이미지가 히어로·썸네일·OG 셋이다.

   ⛔ 입력칸은 전부 제어 컴포넌트(value + onChange)다. defaultValue 를 쓰면 안 된다 —
      React 19 는 <form action={fn}> 제출 시 네이티브 form.reset() 을 호출해
      비제어 입력을 전부 비운다. 자세한 내용은 insight/[id]/editor.tsx 상단 주석. */

const INITIAL: SaveState = {}

export type Category = { id: string; name: string }
export type BuilderOption = { id: string; name: string; role_label: string | null; is_active: boolean }
export type Member = { id: string; name: string; is_active: boolean; role_label: string }

export type Record_ = {
  id: string | null
  title: string
  slug: string
  summary: string
  category_id: string
  hero_url: string
  thumb_url: string
  og_image_url: string
  body_problem: string
  body_solution: string
  body_result: string
  tech_tags: string[]
  period_label: string
  scope_label: string
  result_url: string
  seo_title: string
  seo_description: string
  status: string
  reject_reason: string | null
  members: Member[]
  updated_at: string | null
}

const LABEL: Record<string, string> = {
  draft: '초안', pending: '승인대기', published: '발행', rejected: '반려', archived: '보관',
}

/* 역할은 선택형이다. 자유 입력만 두면 "개발"·"개발자"·"Dev" 가 섞여 공개 지면이 지저분해진다 */
const ROLES = ['리드', '기획', '디자인', '개발', 'AI · 데이터'] as const

/* ── 3막용 Tiptap 축소판 ──────────────────────────────────────────────
   ⛔ 제목(H2·H3)·인용·코드블록이 없다 (A-05 §축소판 툴바).
      3막 안에 제목을 또 넣으면 공개 상세(P-03)의 섹션 제목과 중복된다. */
function useMiniEditor(initial: string, readOnly: boolean, onChange: (html: string) => void) {
  return useEditor({
    immediatelyRender: false,          /* SSR 하이드레이션 어긋남 방지 */
    shouldRerenderOnTransaction: true, /* 툴바 활성 상태 갱신 */
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        /* ⛔ 제목은 없다 — 3막의 01·02·03 과 겹친다 (A-05 §축소판 툴바).
           인용은 남긴다: 공개 상세(P-03) 템플릿이 고객 인터뷰 인용을 실제로 쓰고 있어서
           빼두면 그 자리를 채울 방법이 없다. */
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ inline: false }),
    ],
    content: initial || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })
}

function MiniToolbar({
  editor, onPickImage,
}: {
  editor: Editor
  onPickImage: (file: File) => void
}) {
  return (
    <div className="ed-toolbar ed-toolbar--mini">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'on' : ''}><b>B</b></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'on' : ''}><i>I</i></button>
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
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'on' : ''}>인용</button>
      <i />
      <label className="ed-upload">
        이미지
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) onPickImage(f); e.target.value = '' }} />
      </label>
    </div>
  )
}

export default function WorkEditor({
  record, categories, builders, isAdmin, readOnly,
}: {
  record: Record_
  categories: Category[]
  builders: BuilderOption[]
  isAdmin: boolean
  readOnly: boolean
}) {
  const [state, action, pending] = useActionState(saveWork, INITIAL)
  const [dirty, setDirty] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const dirtyRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  const markDirty = useCallback(() => {
    dirtyRef.current = true
    setDirty(true)
  }, [])

  const [title, setTitle] = useState(record.title)
  const [slug, setSlug] = useState(record.slug)
  const [summary, setSummary] = useState(record.summary)
  const [categoryId, setCategoryId] = useState(record.category_id)
  const [hero, setHero] = useState(record.hero_url)
  const [thumb, setThumb] = useState(record.thumb_url)
  const [og, setOg] = useState(record.og_image_url)
  const [periodLabel, setPeriodLabel] = useState(record.period_label)
  const [scopeLabel, setScopeLabel] = useState(record.scope_label)
  const [resultUrl, setResultUrl] = useState(record.result_url)
  const [seoTitle, setSeoTitle] = useState(record.seo_title)
  const [seoDescription, setSeoDescription] = useState(record.seo_description)

  const [problem, setProblem] = useState(record.body_problem)
  const [solution, setSolution] = useState(record.body_solution)
  const [result, setResult] = useState(record.body_result)

  const [members, setMembers] = useState<Member[]>(record.members)
  const [tags, setTags] = useState<string[]>(record.tech_tags)
  const [tagDraft, setTagDraft] = useState('')
  const dragFrom = useRef<number | null>(null)

  const bind = useCallback(
    <T,>(set: (v: T) => void) => (v: T) => { set(v); markDirty() },
    [markDirty],
  )

  const upload = useCallback(async (file: File, kind: string): Promise<string | null> => {
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const res = await uploadWorkImage(fd)
    if (res.error) { setUploadError(res.error); return null }
    return res.url ?? null
  }, [])

  const uploadInto = useCallback(async (file: File, set: (v: string) => void, kind: string) => {
    const url = await upload(file, kind)
    if (url) { set(url); markDirty() }
  }, [upload, markDirty])

  const uploadIntoEditor = useCallback(async (file: File, editor: Editor | null) => {
    const url = await upload(file, 'body')
    if (url) editor?.chain().focus().setImage({ src: url, alt: '' }).run()
  }, [upload])

  const onBody = useCallback(
    (set: (v: string) => void) => (html: string) => { set(html); markDirty() },
    [markDirty],
  )

  const edProblem = useMiniEditor(record.body_problem, readOnly, onBody(setProblem))
  const edSolution = useMiniEditor(record.body_solution, readOnly, onBody(setSolution))
  const edResult = useMiniEditor(record.body_result, readOnly, onBody(setResult))

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
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  /* ── 참여 빌더 ──────────────────────────────────────────────────── */
  /* 후보는 활성 계정만, 그리고 이미 붙은 사람은 뺀다 —
     복합 PK 라 같은 사람을 두 번 넣으면 저장이 통째로 실패한다 (A-05 §참여 빌더). */
  const candidates = builders.filter(b => b.is_active && !members.some(m => m.id === b.id))

  const addMember = (id: string) => {
    const b = builders.find(x => x.id === id)
    if (!b || members.some(m => m.id === id)) return
    setMembers([...members, { id: b.id, name: b.name, is_active: b.is_active, role_label: '' }])
    markDirty()
  }
  const patchMember = (i: number, patch: Partial<Member>) => {
    setMembers(members.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
    markDirty()
  }
  const removeMember = (i: number) => { setMembers(members.filter((_, idx) => idx !== i)); markDirty() }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= members.length || from === to) return
    const next = [...members]
    const [row] = next.splice(from, 1)
    next.splice(to, 0, row)
    setMembers(next)
    markDirty()
  }

  /* ── 기술 태그 ──────────────────────────────────────────────────── */
  const addTag = (raw: string) => {
    const v = raw.trim()
    if (!v || tags.includes(v)) { setTagDraft(''); return }
    setTags([...tags, v])
    setTagDraft('')
    markDirty()
  }

  /* 30초 자동 저장 · 슬러그 실시간 확인 (../../editor-hooks.ts) */
  const savedAt = useAutosave({
    formRef,
    enabled: !readOnly && Boolean(record.id),
    isDirty: () => dirtyRef.current,
    pending,
  })
  const slugCheck = useSlugCheck('work', slug, record.id)

  /* ── 상단 바 버튼 (A-03 §상단 바와 동일) ────────────────────────── */
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

  const stage = (
    n: string, heading: string, hint: string,
    editor: Editor | null, warn?: React.ReactNode,
  ) => (
    <section className="adm-card wk-stage">
      <div className="wk-stage-head">
        <b>{n} {heading} <span className="wk-req" aria-hidden="true">*</span></b>
        <span className="adm-dim">{hint}</span>
      </div>
      {!readOnly && editor && (
        <MiniToolbar editor={editor} onPickImage={f => uploadIntoEditor(f, editor)} />
      )}
      {warn}
      <EditorContent editor={editor} className="ed-body ed-body--mini" />
    </section>
  )

  const imageBox = (
    label: string, value: string, set: (v: string) => void,
    kind: string, ratio: string, note?: React.ReactNode,
  ) => (
    <div className="adm-field">
      <label>{label}</label>
      {value
        ? <img className={`wk-img wk-img--${kind}`} src={value} alt="" />
        : <div className={`wk-img wk-img--${kind} wk-img--empty`}>{ratio}</div>}
      {!readOnly && (
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <label className="adm-btn adm-btn--ghost ed-upload">
            {value ? '이미지 변경' : '+ 이미지 업로드'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) uploadInto(f, set, kind)
                e.target.value = ''
              }} />
          </label>
          {value && (
            <button type="button" className="adm-btn adm-btn--ghost"
              onClick={() => { set(''); markDirty() }}>제거</button>
          )}
        </span>
      )}
      {note && <small className="adm-dim">{note}</small>}
    </div>
  )

  return (
    <form action={action} className="ed" ref={formRef}>
      <input type="hidden" name="id" value={record.id ?? 'new'} />
      {/* useAutosave 가 이 버튼을 눌러 보낸다 — 저장 경로를 하나로 유지한다 */}
      <button type="submit" name="intent" value="save" data-autosave hidden aria-hidden="true" tabIndex={-1} />
      <input type="hidden" name="hero_url" value={hero} />
      <input type="hidden" name="thumb_url" value={thumb} />
      <input type="hidden" name="og_image_url" value={og} />
      <input type="hidden" name="body_problem" value={problem} />
      <input type="hidden" name="body_solution" value={solution} />
      <input type="hidden" name="body_result" value={result} />
      <input type="hidden" name="tech_tags" value={tags.join(',')} />
      <input
        type="hidden" name="members"
        value={JSON.stringify(members.map(m => ({ id: m.id, role_label: m.role_label })))}
      />

      {/* 좁은 화면에서는 편집을 막는다 (A-00 §모바일). 목록·읽기는 그대로 된다 */}
      <div className="ed-mobile">
        <b>이 화면은 데스크톱에서 작업해 주세요</b>
        <p>
          편집기 툴바와 발행 설정을 좁은 화면에 우겨넣으면 오히려 잘못 눌립니다.
          프로젝트 목록과 읽기는 휴대폰에서도 그대로 됩니다.
        </p>
        <Link className="adm-btn" href="/admin/work">목록으로</Link>
      </div>

      {/* ── 상단 바 ─────────────────────────────────────────── */}
      <div className="ed-top">
        <Link className="adm-manage" href="/admin/work">← 목록</Link>
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
          <a className="adm-manage" href={`/work/${slug}/preview`} target="_blank" rel="noreferrer">미리보기 ↗</a>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {buttons.map(b => (
            <button key={b.intent} className={b.primary ? 'adm-btn' : 'adm-btn adm-btn--ghost'}
              type="submit" name="intent" value={b.intent} disabled={pending}>
              {pending ? '저장 중…' : b.label}
            </button>
          ))}
        </span>
      </div>

      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && (
        <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
          저장했습니다.{state.notice ? ` ${state.notice}` : ''}
        </p>
      )}
      {uploadError && <p className="adm-error" role="alert">{uploadError}</p>}

      {record.status === 'rejected' && record.reject_reason && (
        <p className="adm-error" role="status"><b>반려됨</b> — {record.reject_reason}</p>
      )}

      {readOnly && (
        <p className="adm-notice">
          {record.status === 'pending'
            ? '제출한 프로젝트는 승인·반려 전까지 수정할 수 없습니다.'
            : '이 프로젝트는 운영 관리자만 수정할 수 있습니다.'}
        </p>
      )}

      <div className="ed-grid">
        {/* ── 본문 ──────────────────────────────────────────── */}
        <div className="wk-main">
          <section className="adm-card wk-basic">
            {imageBox('히어로 이미지 *', hero, setHero, 'hero', '21:9 · 최대 3MB',
              <>ⓘ 고객사 로고·인물 사진은 <b>서면 동의 후 게재</b>합니다 (기획서 절대 규칙).</>)}

            {imageBox('썸네일', thumb, setThumb, 'thumb', '16:9 · 최대 2MB',
              '비우면 히어로를 씁니다.')}

            <div className="adm-field">
              <label htmlFor="wk-title">제목 <span aria-hidden="true">*</span></label>
              <input id="wk-title" name="title" value={title} maxLength={120} readOnly={readOnly}
                onChange={e => bind(setTitle)(e.target.value)}
                placeholder="iloom — 리빙 커머스 리뉴얼" />
            </div>

            <div className="adm-field">
              <label htmlFor="wk-summary">한 줄 개요 <span aria-hidden="true">*</span></label>
              <textarea id="wk-summary" name="summary" value={summary} rows={2} maxLength={120}
                readOnly={readOnly} onChange={e => bind(setSummary)(e.target.value)} />
              <small className="adm-dim">{summary.length}/120 · 목록 카드에 노출됩니다.</small>
            </div>
          </section>

          {stage('①', '문제', '무엇이 문제였는지', edProblem)}
          {stage('②', '해결', '어떻게 풀었는지', edSolution)}
          {stage('③', '결과', '무엇이 달라졌는지', edResult,
            /* 자동 판정이 불가능하므로 차단하지 않는다. 승인 단계(A-07)에서 사람이 거른다 */
            <p className="wk-warn">
              ⚠ &ldquo;전환율 3배&rdquo; 같은 수치는 출처나 측정 조건 없이 쓰지 않습니다.
            </p>)}
        </div>

        {/* ── 사이드 ────────────────────────────────────────── */}
        <aside className="ed-side">
          <section className="adm-card">
            <h2>발행 설정</h2>

            <div className="adm-field">
              <label htmlFor="slug">슬러그 <span aria-hidden="true">*</span></label>
              <input id="slug" name="slug" value={slug} readOnly={readOnly} spellCheck={false}
                onChange={e => bind(setSlug)(e.target.value)}
                placeholder="living-commerce-renewal" />
              {/* 저장할 때만 알려주면 다 쓰고 발행을 누른 다음에야 중복을 안다 */}
              {slugCheck.state !== 'idle' && (
                <small className={`ed-slug ed-slug--${slugCheck.state}`}>
                  {slugCheck.state === 'checking' && '확인 중…'}
                  {slugCheck.state === 'ok' && '✓ 사용 가능'}
                  {slugCheck.state !== 'checking' && slugCheck.state !== 'ok' && slugCheck.message}
                </small>
              )}
              {/* ⚠ 형식 설명("영문 소문자·숫자·하이픈…")은 뺐다 —
                  잘못 쓰면 위 실시간 확인이 정확한 문구를 바로 띄우므로 중복이다.
                  고객사명 안내는 A-05 §슬러그가 "상시 안내"로 못박은 항목이라 남긴다 (Q7 확정). */}
              <small className="adm-dim">
                {slug && <><code>/work/{slug}</code><br /></>}
                ⓘ <b>고객사명은 넣지 않습니다.</b>
                {record.status === 'published' && (
                  <><br />⚠ 주소를 바꾸면 이전 주소를 넘기는 301 을 자동으로 만듭니다.</>
                )}
              </small>
            </div>

            <div className="adm-field">
              <label htmlFor="category_id">카테고리 <span aria-hidden="true">*</span></label>
              <select id="category_id" name="category_id" value={categoryId} disabled={readOnly}
                onChange={e => bind(setCategoryId)(e.target.value)}>
                <option value="">선택하세요</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="adm-field">
              <label htmlFor="period_label">기간 라벨</label>
              <input id="period_label" name="period_label" value={periodLabel} readOnly={readOnly}
                onChange={e => bind(setPeriodLabel)(e.target.value)} placeholder="2026 · 3개월" />
            </div>

            <div className="adm-field">
              <label htmlFor="scope_label">범위 라벨</label>
              <input id="scope_label" name="scope_label" value={scopeLabel} readOnly={readOnly}
                onChange={e => bind(setScopeLabel)(e.target.value)} placeholder="기획 · 디자인 · 개발" />
            </div>

            <div className="adm-field">
              <label htmlFor="result_url">결과물 URL</label>
              <input id="result_url" name="result_url" type="url" value={resultUrl} readOnly={readOnly}
                onChange={e => bind(setResultUrl)(e.target.value)} placeholder="https://…" />
              <small className="adm-dim">ⓘ 공개 동의를 받은 것만 넣습니다.</small>
            </div>
          </section>

          {/* ── 참여 빌더 (FR-A05-02) ─────────────────────── */}
          <section className="adm-card">
            <h2>참여 빌더 <span aria-hidden="true">*</span></h2>

            {members.length === 0 && (
              <p className="adm-dim" style={{ fontSize: 12.5, margin: 0 }}>
                아직 없습니다. 제출·발행하려면 1명 이상 필요합니다.
              </p>
            )}

            <ul className="wk-members">
              {members.map((m, i) => {
                const preset = ROLES.includes(m.role_label as typeof ROLES[number])
                return (
                  <li
                    key={m.id}
                    draggable={!readOnly}
                    onDragStart={() => { dragFrom.current = i }}
                    onDragOver={e => { if (dragFrom.current !== null) e.preventDefault() }}
                    onDrop={e => {
                      e.preventDefault()
                      if (dragFrom.current !== null) move(dragFrom.current, i)
                      dragFrom.current = null
                    }}
                  >
                    <span className="wk-grip" aria-hidden="true">⠿</span>
                    <span className="wk-mname">
                      {m.name}
                      {/* 회수된 계정도 연결은 유지한다 (PRD D4) — 콘텐츠에서 사람을 지우지 않는다 */}
                      {!m.is_active && <em> (비활성)</em>}
                    </span>

                    <select
                      aria-label={`${m.name} 역할`} disabled={readOnly}
                      value={m.role_label === '' ? '' : preset ? m.role_label : '기타'}
                      onChange={e => patchMember(i, { role_label: e.target.value === '기타' ? ' ' : e.target.value })}
                    >
                      <option value="">역할</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="기타">기타</option>
                    </select>

                    {!readOnly && (
                      <span className="wk-mbtns">
                        <button type="button" onClick={() => move(i, i - 1)}
                          disabled={i === 0} aria-label="위로">↑</button>
                        <button type="button" onClick={() => move(i, i + 1)}
                          disabled={i === members.length - 1} aria-label="아래로">↓</button>
                        <button type="button" onClick={() => removeMember(i)} aria-label="제거">✕</button>
                      </span>
                    )}

                    {/* 기타를 고르면 직접 입력한다 (A-05 §역할 라벨) */}
                    {!preset && m.role_label !== '' && (
                      <input
                        className="wk-mrole" value={m.role_label.trim()} readOnly={readOnly}
                        placeholder="역할을 입력하세요" maxLength={20}
                        onChange={e => patchMember(i, { role_label: e.target.value || ' ' })}
                      />
                    )}
                  </li>
                )
              })}
            </ul>

            {!readOnly && (
              <div className="adm-field">
                <label htmlFor="wk-add">빌더 추가</label>
                <BuilderPicker candidates={candidates} onPick={addMember} />
                <small className="adm-dim">
                  ↑↓ 또는 드래그로 순서를 바꿉니다. <b>이 순서가 공개 지면 노출 순서</b>입니다.
                </small>
              </div>
            )}
          </section>

          {/* ── 기술 태그 ──────────────────────────────────── */}
          <section className="adm-card">
            <h2>기술 태그</h2>
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
                  value={tagDraft} placeholder="Next.js 입력 후 Enter" maxLength={24}
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

          {/* ── SEO ────────────────────────────────────────── */}
          <section className="adm-card">
            <h2>SEO</h2>
            <div className="adm-field">
              <label htmlFor="seo_title">SEO 타이틀</label>
              <input id="seo_title" name="seo_title" value={seoTitle} maxLength={60} readOnly={readOnly}
                onChange={e => bind(setSeoTitle)(e.target.value)} />
              <small className="adm-dim">비우면 제목을 씁니다.</small>
            </div>
            <div className="adm-field">
              <label htmlFor="seo_description">SEO 디스크립션</label>
              <textarea id="seo_description" name="seo_description" value={seoDescription} rows={3}
                maxLength={160} readOnly={readOnly}
                onChange={e => bind(setSeoDescription)(e.target.value)} />
              <small className="adm-dim">비우면 한 줄 개요를 씁니다.</small>
            </div>
            {imageBox('OG 이미지', og, setOg, 'og', '1200×630 · 최대 2MB', '비우면 히어로를 씁니다.')}
          </section>

          <section className="adm-card">
            <h2>정보</h2>
            <dl className="ed-meta">
              <dt>수정</dt>
              <dd>{record.updated_at ? new Date(record.updated_at).toLocaleString('ko-KR') : '—'}</dd>
            </dl>
          </section>
        </aside>
      </div>
    </form>
  )
}
