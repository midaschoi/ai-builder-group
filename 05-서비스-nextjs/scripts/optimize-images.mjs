/* 공개 웹 이미지 최적화.

   Lighthouse 실측에서 이미지가 성능 감점의 가장 큰 몫이었다 —
   차세대 포맷 1,220KB · 적정 크기 364KB · 인코딩 140KB.

   ⚠ 원본을 지우지 않는다. .webp 를 옆에 만들고 코드가 그쪽을 가리키게 한다.
     원본이 남아 있어야 나중에 다시 뽑거나 되돌릴 수 있다.

   ⚠ 이 이미지들은 서면 동의를 받지 않은 시연용이다 (README §절대 규칙).
     교체될 자산이지만, 교체 전까지의 심사·검수도 이 화면으로 받으므로 최적화해 둔다.
     새 이미지를 넣을 때도 이 스크립트를 다시 돌리면 된다.

   실행:  node scripts/optimize-images.mjs
*/
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/* ⚠ URL.pathname 을 그대로 쓰면 안 된다 — 폴더 이름에 한글이 있어
   05-%EC%84%9C… 로 퍼센트 인코딩된 채 넘어가 경로를 못 찾는다. */
const DIR = fileURLToPath(new URL('../public/assets/img/', import.meta.url))

/* 화면에서 실제로 쓰이는 최대 폭. 레티나를 감안해 2배까지만 남긴다 —
   히어로 스트림 카드는 300px 안쪽, 브랜드 로고는 더 작다. */
const MAX_W = 800
const QUALITY = 78

const targets = []
function walk(dir, depth = 0) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (depth < 1) walk(p, depth + 1); continue }
    if (/\.(jpe?g|png)$/i.test(name)) targets.push(p)
  }
}
walk(DIR)

let before = 0, after = 0, made = 0
for (const src of targets) {
  const out = src.replace(/\.(jpe?g|png)$/i, '.webp')
  const img = sharp(src)
  const meta = await img.metadata()

  const pipeline = (meta.width && meta.width > MAX_W)
    ? img.resize({ width: MAX_W, withoutEnlargement: true })
    : img

  await pipeline.webp({ quality: QUALITY }).toFile(out)

  const b = statSync(src).size
  const a = statSync(out).size
  before += b; after += a; made++
  if (b - a > 30_000) {
    console.log(`  ${src.split(/[\\/]/).pop().padEnd(28)} ${Math.round(b / 1024)}KB → ${Math.round(a / 1024)}KB`)
  }
}

console.log(`\n${made}개 변환 · ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB` +
  ` (${Math.round((1 - after / before) * 100)}% 감소)`)
