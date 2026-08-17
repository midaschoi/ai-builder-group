'use server'

import { updateTag, revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import { SETTINGS_TAG } from '@/lib/settings'
import { CONTENT_TAG } from '@/lib/content'

/* A-08 사이트 설정 저장 (260812 2차 미팅).

   클라이언트가 pluug 폼 주소·GA4·서치콘솔 코드를 스스로 바꿀 수 있어야 한다는 요구다.
   그래서 값 검증을 후하게 잡았다 — 태그를 통째로 붙여넣어도 받아준다. */

export type SettingsState = { error?: string; ok?: boolean }

/* 사람들은 서치콘솔이 준 <meta ... content="abc"> 를 통째로 복사한다.
   그대로 저장하면 태그 안에 태그가 들어가 소유권 확인이 실패한다.
   content 값만 뽑아내고, 없으면 입력값을 그대로 쓴다. */
function unwrapVerification(raw: string): string {
  const value = raw.trim()
  const matched = value.match(/content=["']([^"']+)["']/i)
  return (matched ? matched[1] : value).trim()
}

function normalizeUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return ''
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return u.toString()
  } catch {
    return null
  }
}

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  /* 화면에서 메뉴를 숨기는 것과 별개로 서버에서 다시 막는다 (PRD §2.2 · NFR-11) */
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 저장할 수 있습니다.' }

  const pluug = normalizeUrl(String(form.get('pluug_form_url') ?? ''))
  if (pluug === null) {
    return { error: '문의 폼 주소가 올바른 URL 이 아닙니다. https:// 로 시작하는 주소를 넣어주세요.' }
  }

  const ga4 = String(form.get('ga4_measurement_id') ?? '').trim().toUpperCase()
  if (ga4 && !/^G-[A-Z0-9]{4,}$/.test(ga4)) {
    return { error: 'GA4 측정 ID 형식이 아닙니다. G- 로 시작하는 값입니다. (예: G-ABCD1234)' }
  }

  const gtm = String(form.get('gtm_container_id') ?? '').trim().toUpperCase()
  if (gtm && !/^GTM-[A-Z0-9]{4,}$/.test(gtm)) {
    return { error: 'GTM 컨테이너 ID 형식이 아닙니다. GTM- 으로 시작하는 값입니다. (예: GTM-ABC1234)' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('site_settings')
    .update({
      pluug_form_url: pluug || null,
      ga4_measurement_id: ga4 || null,
      gtm_container_id: gtm || null,
      google_site_verification: unwrapVerification(String(form.get('google_site_verification') ?? '')) || null,
      naver_site_verification: unwrapVerification(String(form.get('naver_site_verification') ?? '')) || null,
      channel_plugin_key: String(form.get('channel_plugin_key') ?? '').trim() || null,
      hero_title: String(form.get('hero_title') ?? '').trim() || null,
      hero_sub: String(form.get('hero_sub') ?? '').trim() || null,
      /* 비우면 화면에서 지표를 아예 뺀다 — 근거 없는 수치를 기본값으로 두지 않는다 (기획서 C2) */
      stat_rating: String(form.get('stat_rating') ?? '').trim() || null,
      updated_by: me.id,
    })
    .eq('id', 1)

  if (error) return { error: `저장하지 못했습니다. ${error.message}` }

  /* 공개 웹은 이 값을 캐시해 두고 있다. 깨주지 않으면 최대 5분간 옛 값이 나간다.

     ⚠ revalidateTag 가 아니라 updateTag 다. Next 16 에서 revalidateTag 는 만료 프로파일을
       받는 형태로 바뀌었고, 서버 액션에서 "저장한 값을 곧바로 다시 읽는" 용도는 updateTag 다.
       revalidateTag 를 쓰면 저장 직후 화면에 옛 값이 한 번 더 보인다. */
  updateTag(SETTINGS_TAG)
  /* 홈 지표는 공개 콘텐츠 캐시도 함께 본다 */
  updateTag(CONTENT_TAG)
  revalidatePath('/', 'layout')

  return { ok: true }
}
