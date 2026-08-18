-- ═══════════════════════════════════════════════════════════════════════════
-- 0009 · Insight 시연용 글 8건을 **진짜 DB 행으로** 넣는다
--
-- 배경 — 이 8건은 원래 app/insight/view.tsx 에 하드코딩된 배열이었다.
--   화면에는 보이는데 관리자에는 없어서 수정도 삭제도 할 수 없었고,
--   발행 글이 0건이 될 때마다 되살아나 관리자와 화면이 어긋났다 (백로그 §2.3).
--   0009 는 그 8건을 DB 로 옮겨 관리 대상으로 만든다.
--
-- ⚠ 본문(body_html)은 **새로 쓴 초안**이다. 원래 배열에는 본문이 없었다 —
--   8건 모두 /insight-detail 목업 한 곳으로 갔기 때문이다.
--   공개 전에 실제 원고로 교체하거나 검수해야 한다 (이관-체크리스트).
--
-- ⚠ 썸네일은 public/assets/img/ins/ 의 **시연용 이미지**다.
--   README §절대 규칙이 서면 동의를 받지 않은 샘플로 명시한 것들이다.
--
-- ⚠ 작성자는 전부 운영 관리자로 들어간다. 원래 배열의 표기는 '똑똑한개발자' 였으나
--   author_id 는 builders 를 가리키고 거기에 해당 인물이 없다.
--   화면에는 '관리자' 로 나온다.
--
-- 재실행 안전 — slug 충돌 시 갱신한다 (insights_slug_key 는 partial unique index).
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.insights
  (slug, title, excerpt, body_html, thumb_url, category_id, author_id,
   status, published_at, tags)
select
  v.slug, v.title, v.excerpt, v.body_html, v.thumb_url,
  (select id from public.categories where type = 'insight' and slug = v.cat),
  (select id from public.builders where role = 'admin' and is_active order by created_at limit 1),
  'published'::public.content_status,
  v.published_at::timestamptz,
  v.tags
from (values

  ('ai-poc-guide', 'ai-playbook',
   $t$AI PoC란? 기업 AI 도입 전 반드시 필요한 'PoC' 알아보기$t$,
   $e$기업 AI 도입, 전면 구축 전에 PoC로 먼저 검증해야 하는 이유.$e$,
   $b$<p>AI 도입을 결정하고 나면 곧바로 전면 구축으로 넘어가고 싶어집니다. 하지만 그 사이에 <strong>PoC(Proof of Concept)</strong> 한 단계를 넣는 것만으로 실패 비용이 크게 줄어듭니다.</p>
<h2>PoC 는 무엇을 확인하는 단계인가</h2>
<p>PoC 는 "이 기술이 우리 데이터와 우리 업무에서 실제로 동작하는가" 를 작은 범위에서 확인하는 단계입니다. 제품을 만드는 것이 아니라 <strong>가정을 검증하는 것</strong>이 목적입니다.</p>
<ul><li>우리가 가진 데이터로 원하는 품질이 나오는가</li><li>현업 담당자가 실제로 쓸 만한가</li><li>운영 비용이 감당할 수준인가</li></ul>
<h2>건너뛰면 생기는 일</h2>
<p>검증 없이 전면 구축에 들어가면, 문제를 발견하는 시점이 이미 예산과 일정을 대부분 쓴 뒤가 됩니다. 그때는 방향을 바꾸는 선택지가 남아 있지 않습니다.</p>
<h2>어느 정도 규모가 적당한가</h2>
<p>업무 하나, 사용자 소수, 짧은 기간으로 좁히는 것이 좋습니다. 범위가 커지면 PoC 가 아니라 그냥 작은 프로젝트가 되고, 빠르게 배운다는 목적이 사라집니다.</p>
<p>결과가 기대에 못 미쳐도 실패가 아닙니다. <strong>전면 구축 전에 알았다는 것이 성과</strong>입니다.</p>$b$,
   '/assets/img/ins/ins-poc.webp', '2026-08-03', array['AI','PoC','도입전략']),

  ('ai-agent-checklist', 'ai-playbook',
   $t$우리 회사에도 AI 에이전트가 필요할까? 5분 체크리스트$t$,
   $e$도입이 필요한 조직의 신호 — 5분 만에 자가진단해 보세요.$e$,
   $b$<p>AI 에이전트는 모든 조직에 필요하지 않습니다. 아래 항목 중 <strong>세 개 이상</strong>에 해당한다면 검토할 가치가 있습니다.</p>
<h2>자가진단 항목</h2>
<ul>
<li>같은 형식의 문의·요청을 사람이 반복해서 처리하고 있다</li>
<li>여러 시스템을 오가며 정보를 옮겨 적는 일이 하루에 여러 번 있다</li>
<li>담당자가 자리를 비우면 그 업무가 멈춘다</li>
<li>규칙은 명확한데 처리량이 많아 병목이 생긴다</li>
<li>업무 기록이 문서·메신저에 흩어져 찾는 데 시간이 걸린다</li>
</ul>
<h2>해당하지 않는다면</h2>
<p>업무량 자체가 적거나, 판단 기준이 매번 달라지는 일이라면 에이전트보다 <strong>절차를 먼저 정리</strong>하는 편이 낫습니다. 정리되지 않은 업무를 자동화하면 혼란도 함께 빨라집니다.</p>
<h2>다음 단계</h2>
<p>해당 항목이 많다면 그중 <strong>가장 반복적이고 규칙이 분명한 업무 하나</strong>를 골라 작게 시작하세요. 전사 도입은 그다음 문제입니다.</p>$b$,
   '/assets/img/ins/ins-agent.webp', '2026-07-22', array['AI','에이전트','체크리스트']),

  ('outsourcing-quote-compare', 'client-guide',
   $t$500만 원 vs 2,000만 원, 개발 외주 견적 비교 제대로 하는 법$t$,
   $e$같은 앱인데 견적이 4배 차이 나는 이유를 뜯어봅니다.$e$,
   $b$<p>같은 요구사항을 보냈는데 견적이 네 배 차이로 돌아옵니다. 어느 쪽이 바가지인지 판단하기 전에, <strong>두 견적이 같은 것을 말하고 있는지</strong>부터 확인해야 합니다.</p>
<h2>차이가 생기는 지점</h2>
<ul>
<li><strong>범위</strong> — 기획·디자인이 포함인가, 받은 화면대로 구현만 하는가</li>
<li><strong>완성도 기준</strong> — 어떤 상태를 "완료" 로 보는가. 테스트와 수정은 몇 회까지인가</li>
<li><strong>인수인계</strong> — 소스 코드·계정·문서를 넘겨받는가</li>
<li><strong>이후 대응</strong> — 오픈 후 장애 대응 기간이 있는가</li>
</ul>
<h2>금액보다 먼저 물어볼 것</h2>
<p>"이 금액에 포함되지 않은 것은 무엇인가요?" 이 질문 하나로 대부분의 차이가 드러납니다. 낮은 견적은 대개 <strong>범위가 좁은 것</strong>이지 싼 것이 아닙니다.</p>
<h2>비교표를 직접 만들 것</h2>
<p>업체가 준 형식 그대로 비교하면 항목이 서로 달라 비교가 되지 않습니다. 같은 항목을 세로로 놓고 각 업체의 답을 채워 넣으세요. 빈칸이 많은 쪽이 위험합니다.</p>$b$,
   '/assets/img/ins/ins-quote.webp', '2026-07-03', array['발주','견적','외주']),

  ('turnkey-team', 'client-guide',
   $t$외주개발, 왜 올인원 턴키 팀과 함께 해야 할까?$t$,
   $e$기획·디자인·개발을 따로 맡기면 실패하는 구조적 이유.$e$,
   $b$<p>비용을 아끼려고 기획은 A 에게, 디자인은 B 에게, 개발은 C 에게 맡기는 경우가 있습니다. 각 단계의 단가는 분명히 낮아집니다. 문제는 <strong>사이에서 생깁니다</strong>.</p>
<h2>손실은 경계에서 발생한다</h2>
<p>기획서가 디자인으로 넘어갈 때, 디자인이 개발로 넘어갈 때 의도가 조금씩 빠집니다. 받는 쪽은 "적힌 대로" 만들고, 적히지 않은 판단은 사라집니다.</p>
<h2>문제가 생겼을 때</h2>
<p>가장 큰 비용은 책임 소재가 불분명할 때 발생합니다. 기획 탓인지 구현 탓인지 가리는 동안 일정은 그대로 흘러가고, 발주처가 중간에서 통역사 역할을 하게 됩니다.</p>
<h2>턴키가 유리한 이유</h2>
<ul><li>단계 사이에 인수인계 문서가 필요 없다</li><li>구현 난이도를 아는 사람이 기획 단계에서 말한다</li><li>문제가 생겼을 때 물어볼 곳이 한 곳이다</li></ul>
<p>단가만 보면 비싸 보이지만, <strong>조율에 드는 시간까지 계산</strong>하면 결과가 달라집니다.</p>$b$,
   '/assets/img/ins/ins-turnkey.webp', '2026-07-03', array['발주','턴키','협업']),

  ('ai-adoption-vs-ax', 'ai-playbook',
   $t$AI 도입과 AX는 다르다 — 성과를 만드는 업무 설계 3가지$t$,
   $e$도입했는데 성과가 없다면, AX와의 결정적 차이를 봐야 합니다.$e$,
   $b$<p>도구를 붙이는 것이 <strong>AI 도입</strong>이고, 그 도구에 맞게 일하는 방식을 바꾸는 것이 <strong>AX(AI Transformation)</strong> 입니다. 성과가 나지 않는 대부분의 경우는 앞만 하고 뒤를 하지 않았을 때입니다.</p>
<h2>1. 업무를 쪼개서 다시 배치한다</h2>
<p>기존 업무에 AI 를 얹으면 단계 하나가 빨라질 뿐입니다. 어느 부분을 기계가 맡고 어느 부분에서 사람이 판단할지 <strong>경계를 다시 그어야</strong> 전체 시간이 줄어듭니다.</p>
<h2>2. 검토 지점을 명시한다</h2>
<p>결과를 누가 언제 확인하는지 정하지 않으면, 아무도 확인하지 않거나 모두가 다시 확인합니다. 둘 다 도입 효과를 없앱니다.</p>
<h2>3. 측정할 숫자를 미리 정한다</h2>
<p>"편해졌다" 는 근거가 되지 않습니다. 처리 건수, 소요 시간, 재작업 비율처럼 <strong>도입 전에 잴 수 있는 숫자</strong>를 먼저 정해 두어야 이후 판단이 가능합니다.</p>
<p>도구는 하루면 붙습니다. 업무 설계가 실제 작업입니다.</p>$b$,
   '/assets/img/ins/ins-ax.webp', '2026-07-16', array['AI','AX','업무설계']),

  ('toss-minigame-behind', 'builder-note',
   $t$토스 안에서 미니게임을? 똑똑한개발자 × 앱인토스$t$,
   $e$토스와 함께 미니게임을 만든 프로젝트 비하인드.$e$,
   $b$<p>플랫폼 안에서 동작하는 미니게임을 만드는 일은 일반 웹 프로젝트와 제약이 다릅니다. 이 글은 그 과정에서 다룬 주제들을 정리한 프로젝트 노트입니다.</p>
<h2>다룬 주제</h2>
<ul>
<li>플랫폼이 정한 규격 안에서 화면과 조작을 설계하는 방법</li>
<li>짧은 이용 시간에 맞춘 진입 흐름</li>
<li>많은 사용자가 동시에 들어올 때를 가정한 준비</li>
<li>플랫폼 심사 기준에 맞춘 점검</li>
</ul>
<p><strong>⚠ 이 글은 본문이 정리되지 않은 초안입니다.</strong> 실제 프로젝트 내용으로 교체해 주세요.</p>$b$,
   '/assets/img/ins/ins-toss.webp', '2026-07-03', array['프로젝트','비하인드']),

  ('ai-native-agency', 'how-we-work',
   $t$기획·디자인·개발을 하나로 — AI 네이티브 에이전시 운영법$t$,
   $e$'프로덕트 빌더'로 팀을 운영하는 방식, 빌더 조쉬와의 대화.$e$,
   $b$<p>기획자·디자이너·개발자를 각각 두는 대신, 한 사람이 요구사항 정리부터 배포까지 책임지는 <strong>프로덕트 빌더</strong> 구조로 팀을 운영합니다. 그 방식을 정리했습니다.</p>
<h2>왜 역할을 합쳤나</h2>
<p>역할을 나누면 각 단계는 전문화되지만, 넘길 때마다 의도가 빠집니다. 한 사람이 끝까지 들고 가면 그 손실이 없습니다.</p>
<h2>한 사람이 다 할 수 있나</h2>
<p>도구가 바뀌었기 때문에 가능해졌습니다. 반복 작업은 에이전트에 맡기고, <strong>사람의 시간은 판단에 씁니다</strong>. 무엇을 만들지 정하는 일은 여전히 사람의 몫입니다.</p>
<h2>품질은 어떻게 지키나</h2>
<ul><li>혼자 만들되 검수는 반드시 다른 사람이 한다</li><li>배포 전 점검 항목을 문서로 고정해 둔다</li><li>판단 근거를 기록으로 남겨 다음 사람이 읽을 수 있게 한다</li></ul>
<p>속도를 위해 절차를 없앤 것이 아니라, <strong>전달 과정을 없앤 것</strong>입니다.</p>$b$,
   '/assets/img/ins/ins-native.webp', '2026-04-22', array['일하는방식','프로덕트빌더']),

  ('ai-governance', 'ai-playbook',
   $t$기업용 AI 도입, 왜 거버넌스가 먼저 필요할까?$t$,
   $e$데이터 유출·통제 불능을 막는 AI 거버넌스 설계법.$e$,
   $b$<p>AI 도구를 먼저 열고 규칙은 나중에 만들면, 그사이에 생긴 데이터가 어디로 갔는지 확인할 방법이 없습니다. 거버넌스는 <strong>도입과 동시에</strong> 있어야 합니다.</p>
<h2>먼저 정해야 할 세 가지</h2>
<ul>
<li><strong>무엇을 넣을 수 없는가</strong> — 고객 개인정보, 계약 조건, 미공개 정보의 범위를 명시한다</li>
<li><strong>누가 쓸 수 있는가</strong> — 계정을 조직이 관리한다. 개인 계정 사용은 기록이 남지 않는다</li>
<li><strong>결과를 누가 책임지는가</strong> — 외부에 나가는 산출물은 사람이 확인한 뒤 나간다</li>
</ul>
<h2>기록이 핵심이다</h2>
<p>문제가 생겼을 때 필요한 것은 금지 규칙이 아니라 <strong>무슨 일이 있었는지 확인할 수 있는 기록</strong>입니다. 어떤 도구를 누가 어떤 목적으로 썼는지 남지 않으면 원인을 찾을 수 없습니다.</p>
<h2>과하게 잠그지 않기</h2>
<p>규칙이 너무 빡빡하면 사람들은 개인 계정으로 옮겨 갑니다. 그 순간 조직은 통제력을 완전히 잃습니다. <strong>쓸 수 있는 길을 열어 두는 것</strong>이 규칙의 일부입니다.</p>$b$,
   '/assets/img/ins/ins-gov.webp', '2026-07-14', array['AI','거버넌스','보안'])

) as v(slug, cat, title, excerpt, body_html, thumb_url, published_at, tags)

on conflict (slug) where slug is not null do update set
  title           = excluded.title,
  excerpt         = excluded.excerpt,
  body_html       = excluded.body_html,
  thumb_url       = excluded.thumb_url,
  category_id     = excluded.category_id,
  status          = excluded.status,
  published_at    = excluded.published_at,
  tags            = excluded.tags,
  updated_at      = now();


-- 확인용 —
--   select i.slug, i.title, c.name as category, i.status
--     from public.insights i left join public.categories c on c.id = i.category_id
--    order by i.published_at desc;
