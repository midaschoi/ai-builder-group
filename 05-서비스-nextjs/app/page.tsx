import { getBuilders, getWorks } from '@/lib/content'
import { getSiteSettings } from '@/lib/settings'
import { faqTopics } from '@/lib/faq-view'
import './home.css'
import HomeView from './home-view'

/* 홈은 서버에서 값을 읽어 view 에 넘긴다.
   FAQ·히어로 문구는 관리자에서 바뀌고, 지표 두 개는 DB 를 센다 —
   손으로 적어두면 발행할 때마다 화면이 사실과 어긋난다. */
export const revalidate = 300

export default async function HomePage() {
  const [{ home }, settings, builders, works] = await Promise.all([
    faqTopics(), getSiteSettings(), getBuilders(), getWorks(),
  ])

  return (
    <HomeView
      faq={home}
      heroTitle={settings.heroTitle}
      heroSub={settings.heroSub}
      /* 아직 아무도 등록하지 않았으면 기존 화면의 숫자를 유지한다 */
      builderCount={builders.length || 10}
      workCount={works.length || 9}
      statRating={settings.statRating}
    />
  )
}
