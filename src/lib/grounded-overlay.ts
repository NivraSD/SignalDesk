import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const OUTPUT_W = 1080
const OUTPUT_H = 1920

// Load font file at module level — bundled with the deployment
let fontBuffer: Buffer | null = null
function getFont(): Buffer {
  if (fontBuffer) return fontBuffer
  // Try multiple paths — Vercel bundles from different locations
  const candidates = [
    path.join(process.cwd(), 'public', 'fonts', 'Inter-Light.otf'),
    path.join(__dirname, '..', '..', 'public', 'fonts', 'Inter-Light.otf'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      fontBuffer = fs.readFileSync(p)
      return fontBuffer
    }
  }
  throw new Error('Font file not found')
}

export async function compositeWallpaper(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  const escaped = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  // Dynamic font size based on title length
  const charCount = title.length
  const fontSize = charCount <= 15 ? 80 : charCount <= 25 ? 64 : 52

  // Convert font to base64 for embedding in SVG
  const font = getFont()
  const fontBase64 = font.toString('base64')

  // SVG with embedded font — renders identically everywhere
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">
  <defs>
    <style>
      @font-face {
        font-family: 'Inter';
        src: url('data:font/otf;base64,${fontBase64}');
        font-weight: 300;
      }
    </style>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${OUTPUT_H - 650}" width="${OUTPUT_W}" height="650" fill="url(#s)"/>
  <text x="${OUTPUT_W / 2}" y="1620" text-anchor="middle" font-family="Inter" font-size="${fontSize}" font-weight="300" fill="white" fill-opacity="0.9" letter-spacing="4">${escaped}</text>
</svg>`)

  const base = await sharp(imageBuffer)
    .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
    .toBuffer()

  return sharp(base)
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer()
}
