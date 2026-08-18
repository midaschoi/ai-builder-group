'use client'

import { useActionState, useEffect, useState } from 'react'
import { saveSettings, type SettingsState } from './actions'
import SaveBar from '../save-bar'

const INITIAL: SettingsState = {}

/* 구획별 색조. FAQ 토픽(faq/view.tsx)과 **같은 팔레트**를 쓴다 —
   관리자 안에서 "색이 구역을 가른다" 는 규칙을 한 벌로 유지하려는 것이다.
   순서대로 돌려 쓰므로 구획이 늘어도 그대로 동작한다. */
const TONES = ['#8C9E2B', '#5B7290', '#A8742A', '#6E6A86'] as const

export type SettingsForm = {
  pluug_form_url: string
  ga4_measurement_id: string
  gtm_container_id: string
  google_site_verification: string
  naver_site_verification: string
  channel_plugin_key: string
  hero_title: string
  hero_sub: string
  stat_rating: string
}

export default function SettingsView({ current }: { current: SettingsForm }) {
  const [state, action, pending] = useActionState(saveSettings, INITIAL)

  /* 제어 컴포넌트로 둔다. React 19 는 <form action={fn}> 제출 시 네이티브 form.reset() 을
     호출하므로 defaultValue 로 두면 저장에 실패했을 때 방금 입력한 값이 통째로 날아간다.
     같은 이유의 버그가 A-03 편집기에 있었다 — insight/[id]/editor.tsx 상단 주석 참고. */
  const [form, setForm] = useState<SettingsForm>(current)
  const [dirty, setDirty] = useState(false)
  const set = (k: keyof SettingsForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirty(true)
    setForm(f => ({ ...f, [k]: e.target.value }))
  }

  /* 저장이 끝나면 "저장하지 않은 변경" 표시를 내린다.
     ⚠ 의존성은 state 객체다 — ok 는 한 번 true 가 되면 계속 true 라
       .ok 로 두면 두 번째 저장부터 effect 가 다시 돌지 않는다 (faq/view.tsx 와 같은 이유). */
  useEffect(() => { if (state.ok) setDirty(false) }, [state])

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && (
        <p className="adm-notice" role="status" style={{ background: '#DBF3E4', color: '#14663C' }}>
          저장했습니다. 공개 사이트에 바로 반영됩니다.
        </p>
      )}

      {/* ── 문의 폼 ───────────────────────────────────────────── */}
      <section className="adm-card set-card" style={{ '--tone': TONES[0] } as React.CSSProperties}>
        <div className="set-head">
          <h2>문의 폼 (pluug)</h2>
          <p className="adm-dim">
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
      <section className="adm-card set-card" style={{ '--tone': TONES[1] } as React.CSSProperties}>
        <div className="set-head">
          <h2>검색 등록 · 분석</h2>
          <p className="adm-dim">
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

        <div className="adm-field">
          <label htmlFor="gtm_container_id">태그 관리자(GTM) 컨테이너 ID</label>
          <input
            id="gtm_container_id" name="gtm_container_id" type="text"
            value={form.gtm_container_id} onChange={set('gtm_container_id')}
            placeholder="GTM-ABC1234" spellCheck={false}
          />
          <small className="adm-dim" style={{ fontSize: 12 }}>
            ⛔ <b>위 GA4 측정 ID 와 둘 중 하나만</b> 채우세요. 둘 다 GA4 를 연결하면
            같은 이벤트가 두 번 집계됩니다.
            <br />GTM 은 태그를 담는 그릇일 뿐이라, 이 값만 넣으면 아무 데이터도 쌓이지 않습니다 —
            GTM 안에서 GA4 태그를 따로 만들어야 합니다.
          </small>
        </div>
      </section>

      {/* ── 홈 카피 (범위 변경분 · 백로그 §1.8) ────────────────── */}
      <section className="adm-card set-card" style={{ '--tone': TONES[2] } as React.CSSProperties}>
        <div className="set-head">
          <h2>홈 첫 화면</h2>
          <p className="adm-dim">
            홈 전체가 아니라 <b>첫 화면 문구와 지표</b>만 엽니다. 나머지 카피는 코드에서 바꿉니다 —
            홈 전체를 편집 가능하게 만들면 CMS 를 짓는 일이 됩니다.
          </p>
        </div>

        <div className="adm-field">
          <label htmlFor="hero_title">헤드라인</label>
          <input id="hero_title" name="hero_title" type="text" maxLength={80}
            value={form.hero_title} onChange={set('hero_title')}
            placeholder="아이디어만 가져오세요 — 나머지는 검증된 빌더의 일입니다." />
          <small className="adm-dim" style={{ fontSize: 12 }}>비우면 기존 문구를 씁니다.</small>
        </div>

        <div className="adm-field">
          <label htmlFor="hero_sub">보조 문구</label>
          <input id="hero_sub" name="hero_sub" type="text" maxLength={120}
            value={form.hero_sub} onChange={set('hero_sub')} />
        </div>

        <div className="adm-field">
          <label htmlFor="stat_rating">평균 만족도 지표</label>
          <input id="stat_rating" name="stat_rating" type="text" maxLength={12}
            value={form.stat_rating} onChange={set('stat_rating')} placeholder="4.9" />
          <small className="adm-dim" style={{ fontSize: 12 }}>
            ⚠ <b>근거가 있을 때만 채우세요.</b> 기획서 절대 규칙이 근거 없는 수치를 금지합니다 (C2).
            <br />비워두면 홈·Work 에서 이 지표를 <b>아예 표시하지 않습니다.</b>
            <br />빌더 수·프로젝트 수는 DB 에서 자동으로 셉니다 — 여기서 입력하지 않습니다.
          </small>
        </div>
      </section>
      {/* ── 상담 ──────────────────────────────────────────────── */}
      <section className="adm-card set-card" style={{ '--tone': TONES[3] } as React.CSSProperties}>
        <div className="set-head">
          <h2>채널톡</h2>
          <p className="adm-dim">
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

      {/* 저장은 화면 오른쪽 아래에 고정한다. 예전에는 맨 아래 왼쪽에 덩그러니 있었는데,
          이 화면은 섹션이 넷이라 끝까지 스크롤해야 버튼이 보였다.
          FAQ·영상 관리와 같은 부품을 쓴다 (../save-bar.tsx). */}
      <SaveBar dirty={dirty} pending={pending} />
    </form>
  )
}
