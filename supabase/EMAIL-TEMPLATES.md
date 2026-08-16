# 초대 · 비밀번호 재설정 메일 설정

계정 발급(A-06)의 **초대 메일** 방식과 관리자가 대신 보내는 **비밀번호 재설정 메일**을
쓰려면 Supabase 쪽에서 한 번만 해두어야 하는 설정이 있습니다.

**하지 않아도 됩니다.** 안 하면 초대 메일만 동작하지 않고,
**임시 비밀번호 방식은 설정 없이 그대로 동작합니다.**

---

## 왜 필요한가

Supabase 의 기본 메일 템플릿은 `{{ .ConfirmationURL }}` 을 씁니다.
이 링크는 인증을 마친 뒤 **토큰을 주소의 `#` 뒤에 붙여서** 우리 사이트로 돌려보냅니다.

```
https://우리사이트/admin/auth/callback#access_token=...&refresh_token=...
                                       ↑ 여기부터는 서버로 전송되지 않는다
```

`#` 뒤는 브라우저에만 남고 **서버로 가지 않습니다.** 이 프로젝트는 PRD DR-02 에 따라
브라우저에서 Supabase 를 직접 호출하지 않으므로, 서버가 읽을 수 없는 토큰은 쓸 수 없습니다.

`{{ .TokenHash }}` 를 쓰면 토큰이 **주소의 `?` 뒤**로 와서 서버가 읽을 수 있습니다.

> 본인이 로그인 화면에서 직접 "비밀번호를 잊으셨나요?" 를 눌러 요청한 경우는
> 설정 없이도 동작합니다. 요청한 브라우저와 링크를 누르는 브라우저가 같아서
> 다른 방식(PKCE)이 성립하기 때문입니다.
> **관리자가 대신 보내는 초대·재설정만 이 설정이 필요합니다.**

---

## 설정 방법

Supabase 대시보드 → **Authentication → Emails → Templates**

### 1. Invite user

`{{ .ConfirmationURL }}` 이 들어 있는 부분을 아래로 바꿉니다.

```
{{ .SiteURL }}/admin/auth/callback?token_hash={{ .TokenHash }}&type=invite&next=/admin/reset
```

### 2. Reset password

```
{{ .SiteURL }}/admin/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/admin/reset
```

### 3. Authentication → URL Configuration

| 항목 | 값 |
|---|---|
| Site URL | 배포 주소 (예: `https://ai-builder-group-kohl.vercel.app`) |
| Redirect URLs | `http://localhost:3000/**` 와 배포 주소 `/**` 를 모두 추가 |

---

## ⚠ 발송 한도

기본 SMTP 는 **시간당 발송 수가 매우 적습니다** (무료 티어 기준 2~4통).
기수 전체에 계정을 뿌리는 날에는 금방 막힙니다.

| 상황 | 대응 |
|---|---|
| 몇 명 발급 | 초대 메일 그대로 |
| 한 번에 여러 명 | **임시 비밀번호 방식**을 쓰고 안전한 경로로 전달 |
| 운영 단계 | 커스텀 SMTP(Resend · SendGrid 등) 연결 — Authentication → Emails → SMTP Settings |

---

## 확인

1. `/admin/builders` → `+ 계정 발급` → 초대 메일 방식으로 본인이 받을 수 있는 주소에 발급
2. 메일의 링크를 누르면 `/admin/reset` 에서 **비밀번호 설정 폼**이 떠야 합니다
3. `링크가 만료되었거나 이미 사용되었습니다` 가 뜨면 위 템플릿이 반영되지 않은 것입니다
4. `링크 정보가 없습니다` 가 뜨면 아직 `{{ .ConfirmationURL }}` 기본 템플릿입니다
