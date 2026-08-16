'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase'
import { getCurrentBuilder, requireAdmin } from '@/lib/session'
import { checkSlug } from '@/lib/slug'

/* A-06 빌더 관리 서버 액션.

   ⛔ 이 파일 어디에도 role 을 바꾸는 경로가 없다. 일부러다 (PRD §2.2 · A-06 §못 하는 것).
      관리자 승격은 DB 직접 변경으로만 한다. 실수로 관리자를 만드는 통로 자체를 없앤다.
      0004_builders_column_guard.sql 이 DB 에서도 같은 것을 막는다.

   ⚠ is_active · must_change_password 는 createAdminClient() 로 쓴다.
      0004 마이그레이션이 authenticated 롤에서 이 컬럼들의 UPDATE 를 회수했기 때문이다.
      그래서 이 파일의 모든 진입점은 requireAdmin() 을 맨 앞에서 통과해야 한다. */

export type IssueState = {
  error?: string
  ok?: boolean
  /** 임시 비밀번호 방식일 때만. 모달에 한 번만 보여주고 다시 조회할 수 없다 (A-06 §계정 발급) */
  tempPassword?: string
  invitedEmail?: string
  name?: string
}
export type RowState = { error?: string; ok?: boolean; notice?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 임시 비밀번호. 사람이 한 번 옮겨 적을 것이므로 헷갈리는 글자(0·O·1·l·I)는 뺀다. */
function tempPassword(): string {
  const CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint32Array(16)
  crypto.getRandomValues(bytes)
  /* 16자 · 56종 → 약 93비트. 한 번 쓰고 버릴 값이지만 무차별 대입을 견뎌야 한다. */
  return Array.from(bytes, b => CHARS[b % CHARS.length]).join('')
}

/** 메일 링크가 돌아올 주소. 배포 도메인이 바뀌어도 요청 헤더를 따라간다. */
async function siteOrigin(): Promise<string> {
  const head = await headers()
  const host = head.get('x-forwarded-host') ?? head.get('host') ?? 'localhost:3000'
  const proto = head.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}


/* ── 계정 발급 (FR-A06-02 · P0) ──────────────────────────────────── */

export async function issueBuilder(_prev: IssueState, form: FormData): Promise<IssueState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 계정을 발급할 수 있습니다.' }

  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const rawSlug = String(form.get('slug') ?? '').trim()
  const roleLabel = String(form.get('role_label') ?? '').trim()
  const method = String(form.get('method') ?? 'invite')

  if (!name) return { error: '이름을 입력해 주세요.' }
  if (!EMAIL.test(email)) return { error: '이메일 형식이 올바르지 않습니다.' }

  const checked = checkSlug(rawSlug)
  if (!checked.ok) return { error: checked.message }
  const slug = checked.value

  const admin = createAdminClient()

  /* 중복은 DB 유니크 제약도 막지만, 먼저 확인해 어느 쪽이 겹쳤는지 알려준다 */
  const { data: dup } = await admin
    .from('builders').select('email, slug')
    .or(`email.eq.${email},slug.eq.${slug}`).limit(2)

  if (dup?.some(d => (d as { email: string }).email === email)) {
    return { error: '이미 등록된 이메일입니다.' }
  }
  if (dup?.some(d => (d as { slug: string }).slug === slug)) {
    return { error: '이미 사용 중인 슬러그입니다.' }
  }

  /* ── auth 사용자 생성 ─────────────────────────────────────────── */
  const origin = await siteOrigin()
  let authUserId: string
  let password: string | undefined

  if (method === 'temp') {
    password = tempPassword()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      /* 초대 메일을 쓰지 않는 경로이므로 메일 확인을 기다릴 대상이 없다 */
      email_confirm: true,
    })
    if (error || !data.user) return { error: `계정을 만들지 못했습니다. ${error?.message ?? ''}` }
    authUserId = data.user.id
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/admin/auth/callback?next=/admin/reset`,
    })
    if (error || !data.user) {
      /* 무료 티어 기본 SMTP 는 시간당 발송 수가 매우 적다. 원인을 감추면 운영자가 못 찾는다. */
      return {
        error: `초대 메일을 보내지 못했습니다. ${error?.message ?? ''}` +
          ' — Supabase 발송 한도에 걸렸을 수 있습니다. 임시 비밀번호 방식을 쓰거나 잠시 후 다시 시도하세요.',
      }
    }
    authUserId = data.user.id
  }

  /* ── builders 행 ──────────────────────────────────────────────── */
  const { error: rowErr } = await admin.from('builders').insert({
    auth_user_id: authUserId,
    slug,
    name,
    email,
    /* ⛔ role 을 폼에서 받지 않는다. 항상 builder 다 (A-06 §계정 발급) */
    role: 'builder',
    role_label: roleLabel || null,
    is_active: true,
    must_change_password: method === 'temp',
  })

  if (rowErr) {
    /* auth 사용자만 남으면 같은 이메일로 다시 발급할 수 없는 고아 계정이 된다.
       되돌려 놓고 실패로 알린다. */
    await admin.auth.admin.deleteUser(authUserId)
    return { error: `계정 정보를 저장하지 못했습니다. ${rowErr.message}` }
  }

  revalidatePath('/admin/builders')

  return method === 'temp'
    ? { ok: true, name, tempPassword: password }
    : { ok: true, name, invitedEmail: email }
}


/* ── 계정 회수 · 활성화 (FR-A06-03 · P0) ─────────────────────────── */

export async function setActive(_prev: RowState, form: FormData): Promise<RowState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 계정을 회수할 수 있습니다.' }

  const id = String(form.get('id') ?? '')
  const next = String(form.get('active') ?? '') === 'true'

  /* 마지막 관리자가 스스로를 잠그는 사고를 막는다 (A-06 §계정 회수) */
  if (id === me.id) return { error: '자기 계정은 회수할 수 없습니다.' }

  const admin = createAdminClient()

  const { data: target } = await admin
    .from('builders').select('id, name, auth_user_id')
    .eq('id', id).maybeSingle<{ id: string; name: string; auth_user_id: string | null }>()

  if (!target) return { error: '계정을 찾을 수 없습니다.' }

  const { error } = await admin.from('builders').update({ is_active: next }).eq('id', id)
  if (error) return { error: `상태를 바꾸지 못했습니다. ${error.message}` }

  /* ⚠ is_active 만 내리면 이미 로그인한 창은 Auth 토큰이 살아 있다.
     getCurrentBuilder() 가 다음 요청에서 걸러내므로 관리자 화면은 바로 막히지만,
     Auth 계층에서도 끊어야 토큰 갱신까지 멈춘다 (A-06 §계정 회수 — 세션 즉시 만료). */
  if (target.auth_user_id) {
    await admin.auth.admin.updateUserById(target.auth_user_id, {
      ban_duration: next ? 'none' : '876000h',
    })
  }

  revalidatePath('/admin/builders')
  return {
    ok: true,
    notice: next
      ? `${target.name} 님의 계정을 다시 활성화했습니다. 비밀번호 재설정 메일을 보내주세요.`
      : `${target.name} 님의 계정을 회수했습니다. 작성한 콘텐츠는 그대로 남아 있습니다.`,
  }
}


/* ── 초대 메일 다시 보내기 · 비밀번호 재설정 메일 ────────────────── */

export async function resendInvite(_prev: RowState, form: FormData): Promise<RowState> {
  const me = await requireAdmin()
  if (!me) return { error: '운영 관리자만 보낼 수 있습니다.' }

  const email = String(form.get('email') ?? '').trim().toLowerCase()
  if (!EMAIL.test(email)) return { error: '이메일이 올바르지 않습니다.' }

  const origin = await siteOrigin()
  const admin = createAdminClient()

  /* 이미 만들어진 계정이라 inviteUserByEmail 은 거부된다.
     같은 목적(본인이 비밀번호를 직접 정하게 하기)은 복구 메일로 달성한다. */
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/admin/auth/callback?next=/admin/reset`,
  })
  if (error) return { error: `보내지 못했습니다. ${error.message}` }

  return { ok: true, notice: `${email} 로 비밀번호 설정 메일을 보냈습니다. 링크는 1시간 뒤 만료됩니다.` }
}


/* ── 프로필 편집 (FR-A06-04) ─────────────────────────────────────── */

export type ProfileState = { error?: string; ok?: boolean }

export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const me = await getCurrentBuilder()
  if (!me) return { error: '로그인이 필요합니다.' }

  const id = String(form.get('id') ?? '')
  const isAdmin = me.role === 'admin'

  /* 빌더는 본인 프로필만 고칠 수 있다 (FR-A06-05).
     화면에서 남의 패널을 열 수 없게 해두었지만, 요청을 직접 만들면 우회된다. */
  if (!isAdmin && id !== me.id) return { error: '다른 사람의 프로필은 수정할 수 없습니다.' }

  const name = String(form.get('name') ?? '').trim()
  const rawSlug = String(form.get('slug') ?? '').trim()
  const roleLabel = String(form.get('role_label') ?? '').trim()
  const oneLiner = String(form.get('one_liner') ?? '').trim()
  const avatarUrl = String(form.get('avatar_url') ?? '').trim()

  if (!name) return { error: '이름을 입력해 주세요.' }

  const checked = checkSlug(rawSlug)
  if (!checked.ok) return { error: checked.message }
  const slug = checked.value

  const supabase = await createClient()

  const { data: dup } = await supabase
    .from('builders').select('id').eq('slug', slug).neq('id', id).limit(1)
  if (dup && dup.length > 0) return { error: '이미 사용 중인 슬러그입니다.' }

  /* 여기서는 일부러 일반 클라이언트를 쓴다 — RLS 와 0004 의 컬럼 권한이 그대로 적용된다.
     ⛔ email · role · is_active 는 payload 에 없다 (A-06 §프로필 편집 표). */
  const { error } = await supabase.from('builders').update({
    name,
    slug,
    role_label: roleLabel || null,
    one_liner: oneLiner || null,
    avatar_url: avatarUrl || null,
  }).eq('id', id)

  if (error) return { error: `저장하지 못했습니다. ${error.message}` }

  revalidatePath('/admin/builders')
  return { ok: true }
}

const AVATAR_MAX = 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadAvatar(form: FormData): Promise<{ url?: string; error?: string }> {
  const me = await getCurrentBuilder()
  if (!me) return { error: '로그인이 필요합니다.' }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: '파일을 선택해 주세요.' }
  if (!ALLOWED.includes(file.type)) return { error: 'jpg · png · webp 만 올릴 수 있습니다.' }
  if (file.size > AVATAR_MAX) {
    return { error: `아바타는 1MB 이하로 올려주세요. (지금 ${(file.size / 1024 / 1024).toFixed(1)}MB)` }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `avatars/${me.id}/${crypto.randomUUID()}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type, upsert: false,
  })
  if (error) return { error: `업로드하지 못했습니다. ${error.message}` }

  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return { url: data.publicUrl }
}
