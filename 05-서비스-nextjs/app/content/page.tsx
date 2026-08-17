import { pageMeta } from '@/app/_meta'
import './content.css'
import { getVideos } from '@/lib/content'
import ContentView from './view'

export const metadata = pageMeta({
  title: '콘텐츠 — AI 빌더 그룹',
  path: '/content',
})

export const revalidate = 300

export default async function ContentPage() {
  const { videos, channels } = await getVideos()
  return (
    <ContentView
      videos={videos.map(v => ({ yt: v.youtubeId, ch: v.channel, dur: v.duration, title: v.title, sub: v.subtitle }))}
      channels={channels.map(c => ({ name: c.name, href: c.url, slug: c.slug }))}
    />
  )
}
