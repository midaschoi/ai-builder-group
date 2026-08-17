'use client'

import Link, { useLinkStatus } from 'next/link'
import { Suspense, use } from 'react'
import { usePathname } from 'next/navigation'

/* 사이드바 메뉴 (A-00 §1).

   ⚠ 여기서 메뉴를 숨기는 것은 편의일 뿐이다. 차단은 서버에서 한다 (PRD §2.2) —
      숨겨도 URL 을 직접 치면 들어와진다. 각 화면이 requireAdmin() 으로 다시 막는다. */

type Item = { href: string; label: string; icon: React.ReactNode; adminOnly?: boolean; badge?: boolean }

/* 라인 아이콘 (A-00 §디자인 토큰 — 이모지 ⛔).
   좁은 화면에서 사이드바가 64px 레일로 접히면 라벨이 사라지고 이것만 남는다.
   아이콘이 없으면 레일이 빈 칸이 되어 메뉴를 아예 고를 수 없다.
   Lucide 를 권장하지만 메뉴 5개에 패키지를 하나 더 얹지 않고 같은 규격(24 그리드·1.75 stroke)으로 직접 그렸다. */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

/* 눌린 메뉴를 표시한다 (Next 16 useLinkStatus).

   한때 여기에 (shell)/loading.tsx 스켈레톤을 뒀는데 더 나빴다 —
   관리 화면은 전부 force-dynamic 이라 프리페치가 가져올 수 있는 건 그 스켈레톤뿐이다.
   그래서 누를 때마다 **반드시** 본문이 회색 막대로 비워지고, 반짝임이 좌우로 쓸고 지나간 뒤,
   진짜 내용이 다른 너비로 들어오며 자리가 튀었다. 멈춤을 깜빡임으로 바꾼 셈이다.

   지금은 이전 화면을 그대로 둔 채 두 가지만 바꾼다 —
     ① 화면 맨 위에 얇은 진행 막대 (이 span 자체다)
     ② 누른 메뉴에 눌린 표시 (admin.css 의 :has(.nav-wait))
   본문은 새 내용이 준비된 순간 한 번에 바뀐다. 중간 상태가 없으니 튀지 않는다.

   ⚠ Link 의 자손 컴포넌트 안에서만 동작한다. Link 와 같은 파일에서 바로 호출하면 항상 false 다. */
function NavWait() {
  const { pending } = useLinkStatus()
  return pending ? <span className="nav-wait" aria-hidden="true" /> : null
}

/* 서버가 넘긴 Promise 를 여기서 푼다. 셸은 이미 그려진 뒤라 숫자만 나중에 붙는다.
   0건이면 배지를 숨긴다 — 늘 붙어 있으면 신호가 아니라 장식이 된다. */
function PendingBadge({ count }: { count: Promise<number> }) {
  const n = use(count)
  return n ? <em>{n}</em> : null
}

export default function AdminNav({
  isAdmin,
  pendingCount,
}: {
  isAdmin: boolean
  /** await 하지 않은 Promise 다 (layout.tsx 주석 참조) */
  pendingCount: Promise<number>
}) {
  const pathname = usePathname()

  const items: Item[] = [
    {
      href: '/admin/insight', label: 'Insight 관리',
      icon: <Icon><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></Icon>,
    },
    {
      href: '/admin/work', label: 'Work 관리',
      icon: <Icon><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" /><path d="M3 12h18" /></Icon>,
    },
    {
      href: '/admin/approvals', label: '승인 대기', adminOnly: true, badge: true,
      icon: <Icon><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.5" /><path d="m8.5 11.5 3 3 8-8.5" /></Icon>,
    },
    {
      href: '/admin/builders', label: '빌더 관리', adminOnly: true,
      icon: <Icon><path d="M15 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="9.5" cy="8" r="3.5" /><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4" /><path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" /></Icon>,
    },
    /* A-09 · A-10 — 범위 변경분 (백로그 §1.8). 기획서 §5.6 이 정한 네 개 밖이다. */
    {
      href: '/admin/faq', label: 'FAQ 관리', adminOnly: true,
      icon: <Icon><circle cx="12" cy="12" r="9" /><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.2-2.8 4" /><path d="M12 17.5h.01" /></Icon>,
    },
    {
      href: '/admin/videos', label: '콘텐츠 관리', adminOnly: true,
      icon: <Icon><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="m10 9.5 5 2.5-5 2.5z" /></Icon>,
    },
    /* A-08 — 260812 2차 미팅에서 추가된 화면. 클라이언트가 pluug 주소·GA4·서치콘솔 코드를
       직접 바꿔야 한다는 요구라 운영 관리자 전용이다. */
    {
      href: '/admin/settings', label: '사이트 설정', adminOnly: true,
      icon: <Icon><path d="M5 21v-6M5 11V3M12 21v-9M12 8V3M19 21v-4M19 13V3" /><path d="M2.5 15h5M9.5 12h5M16.5 17h5" /></Icon>,
    },
  ]

  return (
    <nav className="adm-nav">
      {items
        .filter(item => !item.adminOnly || isAdmin)
        .map(item => {
          const current = pathname === item.href || pathname.startsWith(item.href + '/')
          /* title 은 레일로 접혔을 때의 툴팁이다 (A-00 §태블릿) — 라벨이 숨겨져 있어도 이름을 알 수 있다 */
          return (
            <Link key={item.href} href={item.href} title={item.label}
              aria-current={current ? 'page' : undefined}>
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <Suspense fallback={null}><PendingBadge count={pendingCount} /></Suspense>
              )}
              <NavWait />
            </Link>
          )
        })}
    </nav>
  )
}
