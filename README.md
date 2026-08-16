# AI 빌더 그룹 — 랜딩 · 관리자 플랫폼

수주용 랜딩 페이지와 관리자 플랫폼. 현재 **공개 웹 11페이지가 Next.js로 구현되어 배포 중**입니다.

- 배포 사이트: https://ai-builder-group-kohl.vercel.app
- 기술 스택: Next.js 16 (App Router) · TypeScript · React 19 · Vercel

---

## 빠른 시작

```bash
git clone https://github.com/honghong-art/ai-builder-group.git
cd ai-builder-group/05-서비스-nextjs
npm install
npm run dev          # http://localhost:3000
```

> Node.js 20 이상이 필요합니다. 앱은 저장소 루트가 아니라 **`05-서비스-nextjs/` 폴더 안에 있습니다.**

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (변경 즉시 반영) |
| `npm run build` | 프로덕션 빌드 — **PR 올리기 전에 통과 확인** |
| `npm start` | 빌드 결과 실행 |

---

## 폴더 구조

```
ai-builder-group/
│
├── 05-서비스-nextjs/          ★ 실서비스 코드 — 여기서 작업합니다
│   ├── app/                   페이지 (App Router)
│   │   ├── layout.tsx         공통 레이아웃 (헤더·푸터·전역 스크립트)
│   │   ├── style.css          전역 스타일 — 디자인 토큰·공용 컴포넌트 (수정 시 전 페이지 영향)
│   │   ├── page.tsx           홈  ·  home-view.tsx · home.css
│   │   ├── work/              Work 목록      work-detail/   Work 상세
│   │   ├── builder/           빌더 프로필 (?b=슬러그)
│   │   ├── insight/           Insight 목록   insight-detail/  Insight 상세
│   │   ├── content/           콘텐츠(유튜브) — 다크 지면
│   │   ├── contact/           문의        submit/   접수 완료 (★ 전환 측정 지점)
│   │   ├── privacy/           개인정보처리방침
│   │   └── image-guide/       이미지 에셋 명세 (내부용)
│   ├── components/            Gnb · Footer · SiteFx · fx.ts (공용 훅)
│   └── public/assets/img/     이미지 에셋
│
├── 01-기획/                   기획서 · IA/화면목록/유저플로우 · PRD
├── 02-화면설계/               화면별 와이어프레임 11종 (00-공통 + P-01~P-10)
├── 03-백로그/                 추후작업 — 관리자 화면설계 등
├── 04-목업-old/04-목업-v22/    HTML 목업 (과거 버전 · 변환 원본, 참고용)
└── 99-참고자료/               디자인 레퍼런스 리서치 · 디자인가이드
```

### 페이지 구성 패턴

각 라우트는 세 파일로 나뉩니다. 새 페이지를 만들 때도 이 구조를 따라주세요.

| 파일 | 역할 |
|---|---|
| `page.tsx` | 서버 컴포넌트. `metadata`(title·OG) 정의 + CSS import + View 렌더 |
| `view.tsx` | `'use client'`. 마크업과 인터랙션(useEffect) — 상태·이벤트가 필요한 페이지만 |
| `<route>.css` | 그 페이지 전용 스타일 |

공용 인터랙션은 이미 만들어져 있으니 **페이지마다 다시 구현하지 마세요**:
`components/SiteFx.tsx`(스크롤 리빌 `.rv`/`.mask`, GA4 이벤트 `[data-track]`, 커서 추종 `[data-cursor]`), `components/fx.ts`(리본 흐름 `useRibbonFlow`, 플로팅 CTA 독 `useDock`).

---

## 작업 흐름

```
브랜치 생성 → 작업 → 푸시 → PR → 리뷰 → main 머지 → 자동 배포
```

```bash
git checkout -b feature/작업이름
# ... 작업 ...
npm run build                      # 빌드 통과 확인
git commit -m "무엇을 왜 바꿨는지"
git push -u origin feature/작업이름
```

- PR을 올리면 **Vercel이 미리보기 URL을 자동 생성**해 댓글로 답니다. 실제 화면을 보고 리뷰하세요.
- **main에 머지되면 실서비스에 자동 배포**됩니다. 별도 배포 명령은 없습니다.
- main에 직접 푸시하는 것도 동작하지만, 실수가 바로 실서비스로 나가니 PR을 권장합니다.

---

## 문서 읽는 순서

1. **처음 온 사람** — 기획서 §1(성공 조건) → IA 문서 §1~2 → 화면설계
2. **화면 만드는 사람** — `02-화면설계/P-01-홈.md`의 인터랙션 배정표 + 기획서 §6(디자인 원칙)
3. **기능 개발하는 사람** — PRD §4~§11(요구사항) → §15(ID 색인). **여기 없는 기능은 만들지 않습니다**
4. **검수하는 사람** — PRD §1.2(성공 판정) + §3.2(릴리스 게이트)

---

## 절대 규칙

- **딸깍 금지** — 섹션마다 다른 인터랙션. 전부 같은 방식으로 움직이면 AI로 한 번에 뽑은 티가 납니다
- **가격·저렴함 소구 금지** / 근거 없는 수치 금지
- **CTA는 지정된 위치에만** — 버튼 하나가 전환을 죽인 실측 사례가 있습니다
- **리드는 pluug로** — 문의 데이터를 우리 DB에 저장하지 않습니다
- **범위는 17화면** — 여기 없는 화면은 만들지 말고 백로그에 먼저 적습니다
- **고객사 로고·인물 사진은 서면 동의 후 게재** — 현재 목업의 이미지는 시연용 샘플입니다

## 진행 상태

| 단계 | 상태 |
|---|---|
| 기획서 · IA · PRD | ✅ 완료 |
| 화면설계 — 공개 웹 10화면 | ✅ 완료 |
| 화면설계 — 관리자 7화면 | ✅ 완료 (`02-화면설계/A-00`~`A-07`) |
| 디자인 목업 | ✅ v22 확정 |
| **공개 웹 개발 (Next.js)** | ✅ 11페이지 구현 · 배포 완료 → 실에셋 교체 남음 |
| 관리자 플랫폼 개발 | 🔶 진행 중 — A-01 로그인 · A-02 목록 · A-03 편집 · A-08 설정 완료 / A-04~A-07 남음 |
