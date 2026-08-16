import { pageMeta } from '@/app/_meta'
import { getCategories, getInsights } from '@/lib/content'
import './insight.css'
import InsightView from './view'

export const metadata = pageMeta({
  title: 'Insight — AI 빌더 그룹',
  path: '/insight',
})

export const revalidate = 300

export default async function InsightPage() {
  const [articles, categories] = await Promise.all([getInsights(), getCategories('insight')])

  const counts: Record<string, number> = {}
  for (const a of articles) counts[a.category_slug] = (counts[a.category_slug] ?? 0) + 1

  return <InsightView articles={articles} categories={categories} counts={counts} />
}
