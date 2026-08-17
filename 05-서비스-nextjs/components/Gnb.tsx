'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import BrandLink from './BrandLink'

const NAV = [
  { href: '/', label: 'Home', match: (p: string) => p === '/' },
  { href: '/work', label: 'Work', match: (p: string) => p.startsWith('/work') || p.startsWith('/builder') },
  { href: '/insight', label: 'Insight', match: (p: string) => p.startsWith('/insight') },
  { href: '/content', label: 'Content', match: (p: string) => p.startsWith('/content') },
  { href: '/faq', label: 'FAQ', match: (p: string) => p.startsWith('/faq') },
]

export default function Gnb() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* 페이지 이동 시 모바일 메뉴 닫기 */
  useEffect(() => { setOpen(false) }, [pathname])

  /* v22: 오버레이 열림 시 body 스크롤 잠금 (PRD FR-C-04) */
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open)
    return () => document.body.classList.remove('no-scroll')
  }, [open])

  /* FR-C-04 판정 기준은 "ESC·✕·라우트 변경으로 닫힘" 인데 ESC 가 빠져 있었다.
     오버레이는 body 스크롤을 잠그므로, 닫는 길이 막히면 사용자가 갇힌다. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`gnb${scrolled ? ' scrolled' : ''}${open ? ' menu-open' : ''}`}>
      <div className="gnb__in">
        <BrandLink onNavigate={() => setOpen(false)} />
        <button className="gnb__burger" type="button"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open} aria-controls="gnb-nav"
          onClick={() => setOpen(v => !v)}>
          {open ? '✕' : '☰'}
        </button>
        <nav id="gnb-nav">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className={item.match(pathname) ? 'active' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        {/* 문의(진입)·접수 완료 페이지에서는 GNB CTA 미노출 (원본 스펙) */}
        {pathname !== '/contact' && pathname !== '/submit' && (
          <Link className="btn btn--lime btn--sm btn--pulse" href="/contact" data-track="cta_click" data-location="gnb">
            문의하기
          </Link>
        )}
      </div>
    </header>
  )
}
