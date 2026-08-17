import { createClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'
import Forbidden from '../forbidden'
import VideoView, { type Row } from './view'
import '../site-content.css'

/* A-10 콘텐츠(유튜브) 관리 — 범위 변경분 (백로그 §1.8). 운영 관리자 전용. */

export const dynamic = 'force-dynamic'

export default async function VideoAdminPage() {
  const me = await requireAdmin()
  if (!me) return <Forbidden />

  const supabase = await createClient()
  const [{ data: videos }, { data: channels }] = await Promise.all([
    supabase.from('videos')
      .select('youtube_id, title, subtitle, channel_name, duration, is_active').order('sort'),
    supabase.from('video_channels').select('name').order('sort'),
  ])

  /* null 을 그대로 넘기면 제어 입력이 비제어로 바뀌었다는 경고가 난다 */
  const rows: Row[] = (videos ?? []).map(v => {
    const r = v as Record<string, unknown>
    return {
      youtube_id: String(r.youtube_id ?? ''),
      title: String(r.title ?? ''),
      subtitle: String(r.subtitle ?? ''),
      channel_name: String(r.channel_name ?? ''),
      duration: String(r.duration ?? ''),
      is_active: r.is_active !== false,
    }
  })

  return <VideoView rows={rows} channels={(channels ?? []) as { name: string }[]} />
}
