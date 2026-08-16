'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* 사이드바 메뉴 (A-00 §1).

   ⚠ 여기서 메뉴를 숨기는 것은 편의일 뿐이다. 차단은 서버에서 한다 (PRD §2.2) —
      숨겨도 URL 을 직접 치면 들어와진다. 각 화면이 requireAdmin() 으로 다시 막는다. */

type Item = { href: string; label: string; adminOnly?: boolean; badge?: number }

export default function AdminNav({
  isAdmin,
  pendingCount,
}: {
  isAdmin: boolean
  pendingCount: number
}) {
  const pathname = usePathname()

  const items: Item[] = [
    { href: '/admin/insight', label: 'Insight 관리' },
    { href: '/admin/work', label: 'Work 관리' },
    { href: '/admin/approvals', label: '승인 대기', adminOnly: true, badge: pendingCount },
    { href: '/admin/builders', label: '빌더 관리', adminOnly: true },
    /* A-08 — 260812 2차 미팅에서 추가된 화면. 클라이언트가 pluug 주소·GA4·서치콘솔 코드를
       직접 바꿔야 한다는 요구라 운영 관리자 전용이다. */
    { href: '/admin/settings', label: '사이트 설정', adminOnly: true },
  ]

  return (
    <nav className="adm-nav">
      {items
        .filter(item => !item.adminOnly || isAdmin)
        .map(item => {
          const current = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} aria-current={current ? 'page' : undefined}>
              <span>{item.label}</span>
              {/* 0건이면 배지를 숨긴다 — 늘 붙어 있으면 신호가 아니라 장식이 된다 */}
              {item.badge ? <em>{item.badge}</em> : null}
            </Link>
          )
        })}
    </nav>
  )
}
