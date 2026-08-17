import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pageMeta } from '@/app/_meta'
import { faqTopics } from '@/lib/faq-view'
import '../faq.css'
import FaqView from '../view'

/* P-07 `/faq/[topic]` — IA §1 이 요구하는 주제별 주소 (TR-04: 상태 분기는 URL 에 반영).
   화면은 /faq 와 같은 것을 쓰고 처음 열릴 탭만 다르다. */

export const dynamicParams = true
export const revalidate = 300

export async function generateStaticParams() {
  const { all } = await faqTopics()
  return all.map(t => ({ topic: t.key }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ topic: string }> },
): Promise<Metadata> {
  const { topic } = await params
  const { all } = await faqTopics()
  const found = all.find(t => t.key === topic)

  return pageMeta({
    title: found ? `${found.label} — FAQ` : 'FAQ — AI 빌더 그룹',
    description: found
      ? `${found.label}에 대해 가장 많이 받는 질문을 모았습니다.`
      : undefined,
    path: `/faq/${topic}`,
  })
}

export default async function FaqTopicPage(
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params
  const { all } = await faqTopics()
  if (!all.some(t => t.key === topic)) notFound()

  return <FaqView topics={all} defaultTopic={topic} />
}
