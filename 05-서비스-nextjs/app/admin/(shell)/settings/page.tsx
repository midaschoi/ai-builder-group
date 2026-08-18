import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import Forbidden from '../forbidden'
import SettingsView, { type SettingsForm } from './view'
/* 저장바(.sc-savebar)를 FAQ·영상 관리와 공유한다 */
import '../site-content.css'

/* A-08 사이트 설정 — 260812 2차 미팅에서 새로 나온 요구사항.
   "나중에 저희가 바꿀 수 있게끔만 관리자 페이지에서 링크만 딱 바꾸면 렌더링 되게끔" */

const EMPTY: SettingsForm = {
  pluug_form_url: '',
  ga4_measurement_id: '',
  gtm_container_id: '',
  google_site_verification: '',
  naver_site_verification: '',
  channel_plugin_key: '',
  hero_title: '',
  hero_sub: '',
  stat_rating: '',
}

export default async function SettingsPage() {
  if (!(await requireAdmin())) return <Forbidden />

  /* 캐시된 getSiteSettings() 를 쓰지 않는다 — 방금 저장한 값이 아니라 캐시가 보일 수 있다.
     관리 화면은 항상 DB 의 현재 값을 그대로 보여준다. */
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('pluug_form_url, ga4_measurement_id, gtm_container_id, google_site_verification, naver_site_verification, channel_plugin_key, hero_title, hero_sub, stat_rating')
    .eq('id', 1)
    .maybeSingle<Partial<Record<keyof SettingsForm, string | null>>>()

  const current: SettingsForm = {
    pluug_form_url: data?.pluug_form_url ?? '',
    ga4_measurement_id: data?.ga4_measurement_id ?? '',
    gtm_container_id: data?.gtm_container_id ?? '',
    google_site_verification: data?.google_site_verification ?? '',
    naver_site_verification: data?.naver_site_verification ?? '',
    channel_plugin_key: data?.channel_plugin_key ?? '',
    hero_title: data?.hero_title ?? '',
    hero_sub: data?.hero_sub ?? '',
    stat_rating: data?.stat_rating ?? '',
  }

  return (
    <>
      <h1 className="adm-title">사이트 설정</h1>
      {!data && (
        <p className="adm-notice">
          <code>supabase/migrations/0002_site_settings.sql</code> 을 아직 실행하지 않은 것 같습니다.
          실행해야 저장이 됩니다.
        </p>
      )}
      <SettingsView current={data ? current : EMPTY} />
    </>
  )
}
