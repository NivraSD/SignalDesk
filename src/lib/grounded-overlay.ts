import sharp from 'sharp'

const OUTPUT_W = 1080
const OUTPUT_H = 1920

export async function compositeWallpaper(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  const escaped = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Dynamic sizing
  const charCount = title.length
  // Pango font_size is in 1/1024 of a point. For ~60px visible text at 72dpi: 60 * 1024 = 61440
  const pxSize = charCount <= 15 ? 72 : charCount <= 25 ? 58 : 46
  const pangoSize = pxSize * 1024

  // Create text as a separate image using Sharp's Pango text renderer
  const textImage = await sharp({
    text: {
      text: `<span foreground="white" font_size="${pangoSize}" letter_spacing="${4 * 1024}">${escaped}</span>`,
      rgba: true,
      dpi: 72,
      width: OUTPUT_W - 120,
      align: 'centre',
    },
  })
    .png()
    .toBuffer()

  const textMeta = await sharp(textImage).metadata()
  const textWidth = textMeta.width || 400
  const textHeight = textMeta.height || 80

  // Gradient scrim as SVG (no text, no font issues)
  const scrimSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${OUTPUT_H - 650}" width="${OUTPUT_W}" height="650" fill="url(#s)"/>
</svg>`)

  // Center text, position in lower third (above lock screen buttons)
  const textTop = OUTPUT_H - 300 - Math.floor(textHeight / 2)
  const textLeft = Math.max(0, Math.floor((OUTPUT_W - textWidth) / 2))

  const base = await sharp(imageBuffer)
    .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
    .toBuffer()

  return sharp(base)
    .composite([
      { input: scrimSvg, top: 0, left: 0 },
      { input: textImage, top: textTop, left: textLeft },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()
}
