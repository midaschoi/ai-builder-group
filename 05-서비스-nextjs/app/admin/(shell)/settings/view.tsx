'use client'

import { useActionState, useState } from 'react'
import { saveSettings, type SettingsState } from './actions'

const INITIAL: SettingsState = {}

export type SettingsForm = {
  pluug_form_url: string
  ga4_measurement_id: string
  google_site_verification: string
  naver_site_verification: string
  channel_plugin_key: string
}

export default function SettingsView({ current }: { current: SettingsForm }) {
  const [state, action, pending] = useActionState(saveSettings, INITIAL)

  /* 제어 컴포넌트로 둔다. React 19 는 <form action={fn}> 제출 시 네이티브 form.reset() 을
     호출하므로 defaultValue 로 두면 저장에 실패했을 때 방금 입력한 값이 통째로 날아간다.
     같은 이유의 버그가 A-03 편집기에 있었다 — insight/[id]/editor.tsx 상단 주석 참고. */
  const [form, setForm] = useState<SettingsForm>(current)
  const set = (k: keyof SettingsForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && (
        <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
          저장했습니다. 공개 사이트에 바로 반영됩니다.
        </p>
      )}

      {/* ── 문의 폼 ───────────────────────────────────────────── */}
      <section className="adm-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>문의 폼 (pluug)</h2>
          <p className="adm-dim" style={{ margin: '4px 0 0', fontSize: 12.5 }}>
            문의하기 페이지에 뜨는 폼 주소입니다. 여기만 바꾸면 배포 없이 바로 바뀝니다.
          </p>
        </div>

        <div className="adm-field">
          <label htmlFor="pluug_form_url">폼 주소</label>
          <input
            id="pluug_form_url" name="pluug_form_url" type="url"
            value={form.pluug_form_url} onChange={set('pluug_form_url')}
            placeholder="https://www.pluuug.com/form/폼ID"
          />
          <small className="adm-dim" style={{ fontSize: 12 }}>
            ⚠ pluug 쪽 &ldquo;제출 후 이동 링크&rdquo;를 이 사이트의 <code>/submit</code> 으로 맞춰야
            전환 측정이 성립합니다. www 를 붙인 주소를 쓰세요 — 리다이렉트를 한 번 더 타면 이탈 지점이 늘어납니다.
          </small>
        </div>
      </section>

      {/* ── 검색 등록 ─────────────────────────────────────────── */}
      <section className="adm-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>검색 등록 · 분석</h2>
          <p className="adm-dim" style={{ margin: '4px 0 0', fontSize: 12.5 }}>
            소유권 확인 코드를 넣으면 사이트 &lt;head&gt; 에 확인용 태그가 들어갑니다.
            <b> 태그를 통째로 붙여넣어도 됩니다</b> — content 값만 알아서 뽑습니다.
          </p>
        </div>

        <div className="adm-field">
          <label htmlFor="google_site_verification">구글 서치 콘솔 확인 코드</label>
          <input
            id="google_site_verification" name="google_site_verification" type="text"
            value={form.google_site_verification} onChange={set('google_site_verification')}
            placeholder='google-site-verification=... 또는 <meta ... content="..."> 통째로'
            spellCheck={false}
          />
          <small className="adm-dim" style={{ fontSize: 12 }}>
            search.google.com/search-console → 속성 추가 → HTML 태그 방식에서 복사
          </small>
        </div>

        <div className="adm-field">
          <label htmlFor="naver_site_verification">네이버 서치어드바이저 확인 코드</label>
          <input
            id="naver_site_verification" name="naver_site_verification" type="text"
            value={form.naver_site_verification} onChange={set('naver_site_verification')}
            placeholder='naver-site-verification 값 또는 태그 통째로'
            spellCheck={false}
          />
          <small className="adm-dim" style={{ fontSize: 12 }}>
            searchadvisor.naver.com → 사이트 등록 → HTML 태그 방식에서 복사
          </small>
        </div>

        <div className="adm-field">
          <label htmlFor="ga4_measurement_id">GA4 측정 ID</label>
          <input
            id="ga4_measurement_id" name="ga4_measurement_id" type="text"
            value={form.ga4_measurement_id} onChange={set('ga4_measurement_id')}
            placeholder="G-ABCD1234" spellCheck={false}
          />
          <small className="adm-dim" style={{ fontSize: 12 }}>
            비워두면 분석 스크립트를 아예 넣지 않습니다. 값을 넣는 순간부터 수집이 시작됩니다.
          </small>
        </div>
      </section>

      {/* ── 상담 ──────────────────────────────────────────────── */}
      <section className="adm-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>채널톡</h2>
          <p className="adm-dim" style={{ margin: '4px 0 0', fontSize: 12.5 }}>
            채널 설정 → 보안 및 개발 → 플러그인 키
          </p>
        </div>
        <div className="adm-field">
          <label htmlFor="channel_plugin_key">플러그인 키</label>
          <input
            id="channel_plugin_key" name="channel_plugin_key" type="text"
            value={form.channel_plugin_key} onChange={set('channel_plugin_key')} spellCheck={false}
          />
          <small className="adm-dim" style={{ fontSize: 12 }}>
            ⚠ 키가 틀리면 아무 에러 없이 조용히 안 뜹니다. 바꾼 뒤 런처를 눌러 실제로 열리는지 확인하세요.
          </small>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="adm-btn" type="submit" disabled={pending}>
          {pending ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  )
}
