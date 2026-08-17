import Link from 'next/link'
import { getCurrentBuilder } from '@/lib/session'
import { createClient } from '@/lib/supabase'
import ProfilePanel, { type Profile } from '../profile-panel'
import '../builders.css'

/* 내 프로필 (A-06 §프로필 편집 · FR-A06-05).

   ⛔ 목록은 보여주지 않는다. 빌더가 /admin/builders 로 오면 403 이고,
      계정 메뉴 → 내 프로필 로 오면 본인 패널만 열린다.
      별도 화면을 만든 것이 아니라 A-06 의 패널을 그대로 재사용한다 (화면 수 유지). */

export const dynamic = 'force-dynamic'

export default async function MyProfilePage() {
  const me = (await getCurrentBuilder())!
  const supabase = await createClient()

  const { data } = await supabase
    .from('builders')
    .select('id, name, email, slug, role, role_label, one_liner, avatar_url, bio, focus, stack, principles, badge, link_label, link_url')
    .eq('id', me.id)
    .maybeSingle<Profile>()

  if (!data) {
    return (
      <>
        <h1 className="adm-title">내 프로필</h1>
        <div className="adm-card"><div className="adm-empty">
          <p className="adm-dim">프로필을 불러오지 못했습니다.</p>
        </div></div>
      </>
    )
  }

  return (
    <>
      <h1 className="adm-title">내 프로필</h1>
      <p className="adm-dim" style={{ fontSize: 12.5 }}>
        슬러그·한 줄 소개·아바타는 2차 빌더 프로필 페이지의 원천이 됩니다.
      </p>

      <div className="bd-solo">
        {/* 남에게 재설정 메일을 보내는 버튼은 관리자 화면에만 둔다 */}
        <ProfilePanel profile={data} canSendReset={false} />
      </div>

      <p className="adm-dim" style={{ fontSize: 12.5 }}>
        비밀번호를 바꾸려면 <Link className="adm-manage" href="/admin/reset">비밀번호 재설정</Link> 으로 이동하세요.
      </p>
    </>
  )
}
