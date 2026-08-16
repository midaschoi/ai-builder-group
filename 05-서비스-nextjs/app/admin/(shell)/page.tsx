import { redirect } from 'next/navigation'

/* 로그인 후 첫 화면은 A-02 다 (FR-A00-03). /admin 으로 들어와도 거기로 보낸다. */
export default function AdminIndex() {
  redirect('/admin/insight')
}
