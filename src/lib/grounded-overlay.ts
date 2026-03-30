import sharp from 'sharp'

const OUTPUT_W = 1080
const OUTPUT_H = 1920

/**
 * Composites title text onto an art image for phone wallpaper.
 * Dynamically sizes text based on title length.
 * Gradient scrim ensures readability over any image.
 * Positioned for iPhone lock screen — visible above bottom buttons,
 * below the clock.
 */
export async function compositeWallpaper(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  const escaped = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  // Dynamic font size: shorter titles get bigger text
  const charCount = title.length
  const fontSize = charCount <= 15 ? 80 : charCount <= 25 ? 64 : 52

  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${OUTPUT_H - 650}" width="${OUTPUT_W}" height="650" fill="url(#s)"/>
  <text x="${OUTPUT_W / 2}" y="1620" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="300" fill="white" fill-opacity="0.9" letter-spacing="4">${escaped}</text>
</svg>`)

  const base = await sharp(imageBuffer)
    .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
    .toBuffer()

  return sharp(base)
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer()
}
