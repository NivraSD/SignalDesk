import sharp from 'sharp'

const OUTPUT_W = 1080
const OUTPUT_H = 1920

export async function compositeWallpaper(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  // Dynamic font size based on title length
  const charCount = title.length
  const fontSize = charCount <= 15 ? 80 : charCount <= 25 ? 64 : 52

  // Create text image using Sharp's built-in text rendering (Pango)
  // This works in serverless because it doesn't depend on system fonts
  const textImage = await sharp({
    text: {
      text: `<span foreground="white" font_size="${fontSize * 1024}" letter_spacing="${4 * 1024}">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`,
      font: 'sans-serif',
      rgba: true,
      dpi: 72,
      width: OUTPUT_W - 120, // Leave margins
      align: 'centre',
    },
  })
    .png()
    .toBuffer()

  // Get text image dimensions to position it
  const textMeta = await sharp(textImage).metadata()
  const textHeight = textMeta.height || 100

  // Gradient scrim — just a dark overlay at the bottom
  const scrimSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${OUTPUT_H - 650}" width="${OUTPUT_W}" height="650" fill="url(#s)"/>
</svg>`)

  // Center text horizontally, position in lower third
  const textWidth = textMeta.width || 400
  const textTop = OUTPUT_H - 300 - Math.floor(textHeight / 2)
  const textLeft = Math.floor((OUTPUT_W - textWidth) / 2)

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
