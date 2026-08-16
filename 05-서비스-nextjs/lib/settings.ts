import { unstable_cache } from 'next/cache'
import { createPublicClient, SUPABASE_READY } from './supabase'

/* 사이트 전역 설정 (260812 2차 미팅).

   클라이언트가 관리자 화면에서 직접 바꿔야 하는 값들이다 —
   pluug 폼 주소 · GA4 측정 ID · 구글/네이버 서치콘솔 확인 코드 · 채널톡 키.

   ⚠ 캐시가 이 파일의 핵심이다.
     공개 웹 11장은 정적 생성(SSG)이다. 설정을 매 요청 DB 에서 읽으면 전부 동적 렌더로
     바뀌어 첫 응답이 느려진다. 그래서 태그 캐시로 감싸고, 관리자가 저장할 때
     revalidateTag('site-settings') 로만 깬다. */

export const SETTINGS_TAG = 'site-settings'

export type SiteSettings = {
  pluugFormUrl: string
  ga4MeasurementId: string
  googleSiteVerification: string
  naverSiteVerification: string
  channelPluginKey: string
}

/* DB 가 아직 없거나 값이 비었을 때 돌아갈 자리.
   기존 .env.local 로 운영하던 상태와 그대로 호환된다 — 마이그레이션 전에도 사이트가 죽지 않는다. */
const FALLBACK: SiteSettings = {
  pluugFormUrl: process.env.NEXT_PUBLIC_PLUUG_FORM_URL ?? '',
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID ?? '',
  googleSiteVerification: '',
  naverSiteVerification: '',
  channelPluginKey: process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY ?? '',
}

type Row = {
  pluug_form_url: string | null
  ga4_measurement_id: string | null
  google_site_verification: string | null
  naver_site_verification: string | null
  channel_plugin_key: string | null
}

async function read(): Promise<SiteSettings> {
  if (!SUPABASE_READY) return FALLBACK

  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('site_settings')
      .select('pluug_form_url, ga4_measurement_id, google_site_verification, naver_site_verification, channel_plugin_key')
      .eq('id', 1)
      .maybeSingle<Row>()

    if (!data) return FALLBACK

    /* 빈 문자열도 "설정 안 함"으로 본다. 관리자가 칸을 비우면 환경변수 값으로 되돌아간다. */
    return {
      pluugFormUrl: data.pluug_form_url?.trim() || FALLBACK.pluugFormUrl,
      ga4MeasurementId: data.ga4_measurement_id?.trim() || FALLBACK.ga4MeasurementId,
      googleSiteVerification: data.google_site_verification?.trim() || '',
      naverSiteVerification: data.naver_site_verification?.trim() || '',
      channelPluginKey: data.channel_plugin_key?.trim() || FALLBACK.channelPluginKey,
    }
  } catch {
    /* 설정을 못 읽었다고 사이트가 죽으면 안 된다. 연동만 꺼진 상태로 계속 뜬다. */
    return FALLBACK
  }
}

export const getSiteSettings = unstable_cache(read, ['site-settings-v1'], {
  tags: [SETTINGS_TAG],
  /* 태그로 즉시 깨지만, 혹시 revalidate 호출을 놓쳐도 5분이면 따라잡는다 */
  revalidate: 300,
})
