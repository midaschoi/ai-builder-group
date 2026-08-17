# 초대 · 비밀번호 재설정 링크

## 결론 — **Supabase 쪽에 할 일은 URL 설정 하나뿐입니다**

메일 템플릿은 손대지 않습니다. **손댈 수 없기 때문입니다.** 대시보드가 이렇게 막아 둡니다:

> **Set up custom SMTP to edit templates**
> Emails will be sent using the default templates.

기본 SMTP 로는 제목·본문을 고칠 수 없고, 기본 템플릿이 보내는 링크는
**토큰을 주소의 `#` 뒤에 붙입니다. `#` 뒤는 서버로 전송되지 않습니다.**
이 프로젝트는 브라우저에서 Supabase 를 직접 호출하지 않으므로(PRD DR-02),
서버가 읽을 수 없는 토큰은 쓸 수 없습니다.

그래서 **메일을 보내는 대신 링크를 만들어 화면에 보여줍니다.**
관리자가 슬랙·문자 등 편한 경로로 전달하면 됩니다.

---

## 필요한 설정 — URL Configuration

**Authentication → URL Configuration**

| 항목 | 값 |
|---|---|
| Site URL | `https://ai-builder-group-midas.vercel.app` |
| Redirect URLs | `https://ai-builder-group-midas.vercel.app/**` |
| 〃 | `http://localhost:3000/**` |
| 〃 | `https://ai-builder-group-midas-*-ai-builder-school.vercel.app/**` (프리뷰 배포) |

---

## 어떤 경로가 메일을 쓰고, 어떤 경로가 안 쓰나

| 경로 | 메일 | 지금 동작하나 |
|---|---|---|
| 계정 발급 → **임시 비밀번호** | ❌ 안 씀 | ✅ |
| 계정 발급 → **초대 링크 생성** | ❌ 안 씀 | ✅ |
| 프로필 → **재설정 링크 만들기** | ❌ 안 씀 | ✅ |
| 로그인 화면 → **비밀번호를 잊으셨나요?** | ⭕ 씀 | ✅ |

> 마지막 항목만 메일을 씁니다. **본인이 직접 요청**하는 경우라 요청한 브라우저에 검증자가 남고,
> 그래서 기본 템플릿으로도 성립합니다(PKCE).
> 관리자가 **대신** 보내는 경우에는 그 검증자가 받는 사람 브라우저에 없어 성립하지 않습니다 —
> 그래서 대신 보내는 경로는 전부 링크 생성으로 바꿨습니다.

⚠ 기본 SMTP 는 시간당 발송 수가 매우 적습니다(2~4통). 마지막 항목도 연달아 쓰면 막힙니다.

---

## 나중에 — 진짜 메일을 보내고 싶다면

커스텀 SMTP(Resend · SendGrid 등)를 붙이면 템플릿을 고칠 수 있게 됩니다.
그때 **Authentication → Emails → Templates** 에서 링크를 아래로 바꾸면
메일 발송 경로도 그대로 동작합니다.

```
Invite user
{{ .SiteURL }}/admin/auth/callback?token_hash={{ .TokenHash }}&type=invite&next=/admin/reset

Reset password
{{ .SiteURL }}/admin/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset
```

콜백은 `?code=`(PKCE)와 `?token_hash=` 를 **둘 다 받도록 이미 만들어 두었습니다**
(`app/admin/auth/callback/route.ts`). 설정만 바꾸면 코드 수정 없이 켜집니다.
