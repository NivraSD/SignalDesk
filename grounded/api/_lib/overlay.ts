import sharp from 'sharp'
import opentype from 'opentype.js'

// Grounded wallpaper caption (moved from nivria.ai): the title as white text on solid black highlight bars, one bar per
// line, at one fixed size — readable on any background. Letters are converted to vector paths
// with opentype.js, so rendering needs no system fonts (Vercel's runtime has none, which is what
// broke the earlier text overlay).

const OUTPUT_W = 1080
const OUTPUT_H = 1920
const FONT_SIZE = 44
const PAD_X = 20 // bar padding left/right of the text
const BAR_H = Math.round(FONT_SIZE * 1.5)
const LINE_GAP = 8
const MAX_TEXT_W = OUTPUT_W - 2 * 110 - 2 * PAD_X
const CENTER_Y = Math.round(OUTPUT_H * 0.79) // low on the lock screen, clear of the flashlight/camera buttons

let fontPromise: Promise<opentype.Font> | null = null

// Inter SemiBold (OFL) from a pinned public CDN, once per warm instance. Our own /fonts path sits
// behind the site's login middleware, so a server-side fetch of it gets the login page instead.
const CAPTION_FONT_URL = 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.2.3/Inter_600SemiBold.ttf'

export function loadCaptionFont(_origin?: string): Promise<opentype.Font> {
  if (!fontPromise) {
    fontPromise = fetch(CAPTION_FONT_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`font fetch ${r.status}`)
        return r.arrayBuffer()
      })
      .then((buf) => opentype.parse(buf))
      .catch((e) => {
        fontPromise = null
        throw e
      })
  }
  return fontPromise
}

function wrapAt(font: opentype.Font, text: string, maxW: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (line && font.getAdvanceWidth(next, FONT_SIZE) > maxW) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

// Fewest lines that fit, then the narrowest width that keeps that line count — so lines come out
// even instead of leaving one orphaned word at the end.
function wrap(font: opentype.Font, text: string): string[] {
  const count = wrapAt(font, text, MAX_TEXT_W).length
  let lo = 0
  let hi = MAX_TEXT_W
  while (hi - lo > 4) {
    const mid = (lo + hi) / 2
    if (wrapAt(font, text, mid).length <= count) hi = mid
    else lo = mid
  }
  return wrapAt(font, text, hi)
}

function captionSvg(font: opentype.Font, title: string): string {
  const lines = wrap(font, title)
  const blockH = lines.length * BAR_H + (lines.length - 1) * LINE_GAP
  let top = CENTER_Y - blockH / 2
  // Baseline that visually centers lowercase text in the bar.
  const ascent = (font.ascender / font.unitsPerEm) * FONT_SIZE
  const descent = (-font.descender / font.unitsPerEm) * FONT_SIZE
  const baselineOffset = (BAR_H + ascent - descent) / 2

  const parts: string[] = []
  for (const line of lines) {
    const w = font.getAdvanceWidth(line, FONT_SIZE)
    const x = (OUTPUT_W - w) / 2
    parts.push(`<rect x="${(x - PAD_X).toFixed(1)}" y="${top.toFixed(1)}" width="${(w + 2 * PAD_X).toFixed(1)}" height="${BAR_H}" fill="#000"/>`)
    parts.push(`<path d="${font.getPath(line, x, top + baselineOffset, FONT_SIZE).toPathData(2)}" fill="#fff"/>`)
    top += BAR_H + LINE_GAP
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">${parts.join('')}</svg>`
}

export async function compositeWallpaper(imageBuffer: Buffer, title: string, font: opentype.Font): Promise<Buffer> {
  const base = await sharp(imageBuffer).resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' }).toBuffer()
  return sharp(base)
    .composite([{ input: Buffer.from(captionSvg(font, title)), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer()
}
