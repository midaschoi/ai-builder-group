# DB 스키마

| | |
|---|---|
| 대상 | Supabase PostgreSQL — 스키마 `public` + `storage` |
| 원본 | `supabase/migrations/0001` ~ `0006` (합본: `supabase/setup-all.sql`) |
| 마지막 갱신 | 2026-08-17 |

> 이 문서는 마이그레이션을 **사람이 읽는 형태**로 옮긴 것이다.
> 진실은 항상 SQL 파일이다. 스키마를 바꿨으면 **새 마이그레이션을 추가**하고 이 문서도 갱신한다.
> (기존 파일을 고치면 이미 실행한 환경과 어긋난다.)

---

## 한눈에

```
auth.users ─1:1─ builders ──┬─< works ──< work_builders >── builders
                            └─< insights
                                works/insights ─> categories
                                faq_topics ──< faqs
                                video_channels        videos
                                redirects             site_settings (1행)
```

| 테이블 | 무엇을 담나 | 쓰는 화면 |
|---|---|---|
| `builders` | 계정 + 공개 프로필 | A-06 · `/builder` |
| `categories` | Work·Insight 분류 | A-03 · A-05 · `/work` · `/insight` |
| `works` | 프로젝트 (3막 구조) | A-04 · A-05 · `/work/[slug]` |
| `insights` | 아티클 (HTML 본문) | A-02 · A-03 · `/insight/[slug]` |
| `work_builders` | 프로젝트 ↔ 참여 빌더 (N:M) | A-05 · `/work/[slug]` |
| `redirects` | 슬러그 변경·보관 시 301 | 자동 · `proxy.ts` |
| `site_settings` | 외부 연동 값 + 홈 카피 (**항상 1행**) | A-08 |
| `faq_topics` · `faqs` | FAQ | A-09 · `/faq/[topic]` |
| `video_channels` · `videos` | 유튜브 | A-10 · `/content` |

---

## 열거형 · 공통

```sql
content_status = draft | pending | published | rejected | archived
builder_role   = admin | builder
```

`touch_updated_at()` 트리거가 `works` · `insights` · `site_settings` · `faqs` · `videos` 의
`updated_at` 을 자동으로 갱신한다. 코드에서 손으로 넣지 않는다.

---

## builders

계정과 공개 프로필이 **한 테이블**이다. `auth.users` 와 `auth_user_id` 로 1:1 연결된다.

| 컬럼 | 형 | 비고 |
|---|---|---|
| `id` | uuid PK | |
| `auth_user_id` | uuid unique → `auth.users` | `on delete set null` — 인증 계정을 지워도 프로필과 참여 이력은 남는다 |
| `slug` `name` `email` | text | 셋 다 unique(`slug`,`email`) / not null |
| `role` | builder_role | 🔴 **승격은 화면에서 불가.** DB 직접 수정만 (PRD §2.2) |
| `is_active` | bool | false = 회수. 로그인 차단 |
| `must_change_password` | bool | 임시 비밀번호 발급 계정의 강제 변경 플래그 |
| `one_liner` `role_label` `avatar_url` | text | 공개 프로필 기본 |
| `bio` `focus` `badge` `link_label` `link_url` `sort` | text/int | 0006 추가 |
| `stack` | text[] | |
| `principles` | jsonb | `[{ "title": …, "body": … }]` |

**저장하지 않는 것** — 수행 건수와 대표 프로젝트. `work_builders` 를 세면 되고,
저장해 두면 발행할 때마다 손으로 맞춰야 한다.

> ⚠ `email` 은 공개 페이지 쿼리에서 select 하지 않는다 (DR-03).

---

## works

3막 본문을 **자유 에디터가 아니라 컬럼으로** 나눠 두었다. 자유 에디터로 두면 프로젝트마다
구성이 달라져 공개 P-03 렌더 구조가 어긋난다 (DR §7.2).

| 컬럼 | 비고 |
|---|---|
| `slug` | **nullable.** 초안은 슬러그 없이 저장할 수 있다. 채워지면 유일 (부분 unique 인덱스) |
| `title` `summary` `category_id` | |
| `hero_url` `thumb_url` `og_image_url` | |
| `body_problem` `body_solution` `body_result` | ← 3막 |
| `tech_tags` | text[] |
| `period_label` `scope_label` `result_url` | 사이드 정보 |
| `status` `published_at` `created_by` `reject_reason` | |
| `seo_title` `seo_description` | |

**제약 두 개가 규칙을 강제한다** — 애플리케이션 검증만 믿지 않는다:

- `works_publishable_fields` — `draft` 가 아니면 slug·title·hero·3막이 **전부** 있어야 한다
- `works_reject_reason_required` — `rejected` 면 사유가 **공백 제외 10자 이상** (FR-A07-04)

---

## insights

| 컬럼 | 비고 |
|---|---|
| `slug` | works 와 동일하게 nullable + 부분 unique |
| `title` `excerpt` `thumb_url` `category_id` `author_id` | |
| `body_html` | 🔴 **반드시 서버에서 sanitize 후 저장** (FR-A03-03) |
| `tags` | text[] (0005 추가) |
| `status` `published_at` `reject_reason` `seo_*` | |

> `body_html` 은 공개 페이지가 `dangerouslySetInnerHTML` 로 그린다.
> **저장 시점이 유일한 방어선이다.** 우회 경로를 만들지 않는다 (`lib/sanitize.ts`).

제약은 works 와 같은 구조 (`draft` 가 아니면 slug·title·excerpt·body_html 필수).

---

## categories

`(type, slug)` 가 unique. `type` 은 `work` 또는 `insight`.

**Insight 4종** (0005 에서 PRD FR-P04-01 과 일치시킴):
`how-we-work` · `ai-playbook` · `client-guide` · `builder-note`

---

## work_builders

`(work_id, builder_id)` 복합 PK. `role_label`, `sort`.

> `sort` 가 공개 P-03 사이드 노출 순서다.
> **계정을 회수(`is_active=false`)해도 이 연결은 끊지 않는다** (PRD D4) — 참여 이력이기 때문이다.

---

## redirects · site_settings

`redirects(from_path PK, to_path, created_at)` — 슬러그 변경·보관 시 자동 생성.
`proxy.ts` 가 읽어 리다이렉트한다. 스펙은 301 이지만 Next 는 **308**(영구·메소드 보존)로 낸다.

`site_settings` 는 **항상 1행**이다. `id smallint PK check (id = 1)` 로 두 번째 행을 막고,
빈 행을 미리 넣어 두어 화면이 insert/update 를 분기하지 않아도 된다.

담는 값: `pluug_form_url` · `ga4_measurement_id` · `google_site_verification` ·
`naver_site_verification` · `channel_plugin_key` · `hero_title` · `hero_sub` · `stat_rating`

> `google_site_verification` 은 **`content` 속성 값만** 넣는다. `<meta …>` 를 통째로 넣으면 태그가 이중으로 나간다.
> `stat_rating` 은 비우면 화면에서 그 지표를 **아예 뺀다** (기획서 C2 근거 없는 수치 금지).

---

## faq_topics · faqs · video_channels · videos

| | |
|---|---|
| `faqs` | `topic_id` · `question` · `answer` · `show_on_home` · `is_active` · `sort` |
| `videos` | `youtube_id` · `title` · `subtitle` · `channel_name` · `duration` · `is_active` · `sort` |

- `show_on_home` — 홈 프리뷰(S9)에 올릴 것만 표시한다. 전부 올리면 홈이 FAQ 페이지가 된다
- 영상 **썸네일은 저장하지 않는다** — `img.youtube.com/vi/<id>/hqdefault.jpg` 로 만들 수 있다

> ⚠ 이 네 테이블은 **PRD 범위 밖이다** (FR-P06-04 · FR-P07-04 는 정적 데이터를 지시).
> 사용자 요청으로 추가했다. 백로그 §1.8 · 검수 체크리스트 §스펙 초과 참조.

---

## 보안 — 이 부분을 함부로 고치지 않는다

### 헬퍼 함수 (`security definer`)

```
current_builder_id()  현재 로그인 사용자의 builders.id (is_active 인 것만)
is_admin()            role = 'admin' 인가
owns_work(w_id)       내가 만든 work 인가
```

> `security definer` 인 이유 — `builders` 의 RLS 정책 안에서 `builders` 를 다시 조회하면
> 정책이 **재귀한다.** definer 함수로 한 겹 끊는다.

### RLS 요약

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| `categories` `builders` `work_builders` `redirects` | 전체 공개 | 관리자만 (+ 빌더는 자기 프로필·자기 work 연결) |
| `works` `insights` | `published` 는 공개, 나머지는 **본인 것만** | 본인 것 + `draft`/`pending` 일 때만. 관리자는 전부 |
| `site_settings` `faq*` `video*` | 전체 공개 | 관리자만 |
| `storage.objects` (`media`) | 공개 읽기 | 로그인 빌더 업로드·수정, **삭제는 관리자만** |

`works_write_own` 의 `with check (… status in ('draft','pending'))` 가
**작성자가 스스로 발행하는 것을 DB 레벨에서 막는다.** 승인은 관리자만이다.

### 🔴 0004 — 권한 상승 구멍 차단

RLS 는 **행 단위**다. `builders_update_self` 는 "내 행이면 수정 가능"이라
빌더가 PostgREST 를 직접 호출해 자기 행의 `role` 을 `admin` 으로 바꿀 수 있었다.
행은 자기 것이므로 정책을 통과한다.

컬럼 단위 GRANT 로 막았다:

```sql
revoke update on public.builders from anon, authenticated;
grant  update (name, slug, one_liner, role_label, avatar_url)
  on public.builders to authenticated;
```

> `role` · `is_active` · `email` · `auth_user_id` 는 **목록에 없다** → 어떤 경로로도 못 바꾼다.
> `service_role` 은 revoke 대상이 아니라 계정 발급·회수 액션은 그대로 동작한다.

### 🔴 0007 — 0004 의 목록을 0006 컬럼까지 넓힌다

앞서 이 문서에 *"0006 이 컬럼을 더했지만 GRANT 목록은 그대로다"* 라고만 적어 두었는데,
**실제로는 프로필 저장이 아예 되지 않고 있었다.**

```
저장하지 못했습니다. permission denied for table builders
```

`saveProfile()` 은 (의도적으로) `service_role` 이 아니라 일반 클라이언트를 쓴다.
그래서 payload 에 `bio` 하나만 끼어도 **업데이트 전체가 거부된다.**
앞 문단의 *"지금은 서버 액션(service_role)으로만 저장된다"* 는 틀린 서술이었다 — 바로잡는다.

```sql
grant update (bio, focus, stack, principles, link_label, link_url)
  on public.builders to authenticated;
```

> ⛔ `badge` 는 **주지 않는다.** `✳ 이달의 빌더` 같은 편집자 표식이라 빌더가 스스로 달면
> 공개 사이트에서 자기를 승격시키는 것과 같다 — 0004 가 `role` 을 막은 것과 같은 이유다.
> 관리자 화면에서만 칸이 보이고, 서버 액션도 관리자일 때만 payload 에 넣는다.
>
> ⛔ `sort` 도 주지 않는다. 공개 목록의 노출 순서라 자기를 맨 앞으로 올릴 수 있다.

**함께 막은 것** — `link_url` 은 공개 프로필의 `<a href>` 에 그대로 들어간다.
권한을 여는 순간 빌더 계정 하나로 `javascript:` 주소를 심을 수 있게 되므로,
저장 시(`builders/actions.ts`)와 렌더 시(`app/builder/view.tsx`) 양쪽에서 `http`·`https` 만 통과시킨다.

> 포스트그레스는 **컬럼** 권한이 없을 때도 `permission denied for table` 이라고 말한다.
> 테이블 권한 문제로 읽고 엉뚱한 데를 뒤지기 쉬워, 화면 오류 문구에 마이그레이션 번호를 넣어 두었다.

---

## 새 환경에 설치

```
Supabase SQL Editor → supabase/setup-all.sql 전체 붙여넣기 → Run
```

0001~0006 이 순서대로 들어 있고 전부 멱등(`if not exists` / `drop policy if exists`)이라
여러 번 실행해도 안전하다. 이후 절차는 `06-검수/이관-체크리스트.md`.
