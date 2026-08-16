'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/** 로그아웃 (FR-A00-04). 별도 화면 없이 셸 헤더 메뉴에서 부른다 (PRD D2). */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
