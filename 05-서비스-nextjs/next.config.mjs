/** @type {import('next').NextConfig} */

/* 관리자에서 올린 이미지는 Supabase Storage 에 있다. next/image 로 그리려면
   호스트를 허용해 줘야 한다 — 안 하면 런타임에 "hostname is not configured" 로 죽는다.

   호스트를 코드에 박지 않고 SUPABASE_URL 에서 끌어낸다. 프로젝트를 옮기거나
   새로 만들어도 환경변수 한 곳만 바꾸면 따라온다. 값이 없으면 아무것도 허용하지 않는다 —
   공개 웹은 로컬 에셋만 쓰므로 그래도 정상 동작한다. */
const supabaseHost = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null
  } catch {
    return null
  }
})()

const nextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
}

export default nextConfig
