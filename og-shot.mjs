/**
 * OG image generator — screenshots the rendered close-section nivria
 * logo lockup and saves it as src/app/opengraph-image.png (Next.js
 * file convention auto-generates the og:image / twitter:image meta).
 *
 * Two important details:
 *   1. The homepage CSS scopes everything under `.nv .*` selectors, so
 *      the cloned logo must be appended INSIDE the .nv root — not
 *      document.body — or it loses all styling.
 *   2. Use top:0; left:0; explicit width/height (not `inset:0`) so the
 *      stage's box model isn't over-constrained.
 */
import puppeteer from 'puppeteer-core'

const OUT = '/Users/jhl/code/signaldesk-v3/src/app/opengraph-image.png'
const W = 1200, H = 630

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  defaultViewport: { width: W, height: H, deviceScaleFactor: 2 },
})

try {
  const page = await browser.newPage()
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)

  // Build the stage INSIDE .nv so the cloned logo keeps its CSS scope.
  await page.evaluate(({ W, H }) => {
    // Hide Next.js dev-mode indicator overlay (visible in dev mode) so
    // it doesn't show through in the screenshot.
    document.querySelectorAll(
      'nextjs-portal, [data-next-mark-loading], #__next-build-watcher, [data-nextjs-toast]'
    ).forEach(el => { el.style.display = 'none' })

    const source = document.querySelector('.nv-close-logo .nv-logo')
    if (!source) throw new Error('close-section logo not found in DOM')
    const root = document.querySelector('.nv')
    if (!root) throw new Error('.nv root not found in DOM')

    const stage = document.createElement('div')
    stage.id = 'og-stage'
    stage.style.cssText = [
      'position:fixed',
      'top:0', 'left:0',
      `width:${W}px`, `height:${H}px`,
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:#0D0B08',
      'z-index:99999',
    ].join(';')

    const clone = source.cloneNode(true)
    // scale the lockup up to fill the OG card with comfortable margins
    clone.style.transform = 'scale(1.65)'
    clone.style.transformOrigin = 'center center'
    stage.appendChild(clone)
    root.appendChild(stage)
  }, { W, H })

  // Give the layout + any font fallbacks a tick to settle.
  await new Promise(r => setTimeout(r, 500))

  await page.screenshot({
    path: OUT,
    clip: { x: 0, y: 0, width: W, height: H },
    omitBackground: false,
  })

  console.log(`wrote ${OUT}`)
} finally {
  await browser.close()
}
