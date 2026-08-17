import './skeleton.css'

/* FR-C-10 — 로딩 스켈레톤. 판정 기준은 "목록·상세 진입 시 CLS ≤ 0.1" 이므로
   예쁜 것보다 **최종 레이아웃과 같은 자리를 미리 차지하는 것**이 목적이다.

   ⚠ 애니메이션은 prefers-reduced-motion 에서 꺼진다 (FR-C-11). skeleton.css 참조. */

export function SkList({ rows = 6 }: { rows?: number }) {
  return (
    <main id="main">
      <div className="wrap sk-wrap">
        <div className="sk sk-h1" />
        <div className="sk sk-lead" />
        <div className="sk-grid">
          {Array.from({ length: rows }, (_, i) => (
            <div className="sk-card" key={i}>
              <div className="sk sk-thumb" />
              <div className="sk sk-line" />
              <div className="sk sk-line sk-line--short" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export function SkArticle() {
  return (
    <main id="main">
      <div className="wrap sk-wrap">
        <div className="sk sk-back" />
        <div className="sk sk-h1" />
        <div className="sk sk-lead" />
        <div className="sk sk-cover" />
        <div className="sk-body">
          <div>
            {Array.from({ length: 7 }, (_, i) => (
              <div className={`sk sk-line${i % 4 === 3 ? ' sk-line--short' : ''}`} key={i} />
            ))}
          </div>
          <div className="sk sk-aside" />
        </div>
      </div>
    </main>
  )
}
