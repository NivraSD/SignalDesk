import sharp from 'sharp'

const OUTPUT_W = 1080
const OUTPUT_H = 1920

/**
 * Composites title text onto an image for phone wallpaper use.
 * Uses Sharp's built-in SVG rendering with explicit font metrics.
 *
 * The gradient scrim ensures readability over any image.
 * Text is positioned in the lower third — visible on iPhone lock screen
 * above the flashlight/camera buttons, below the clock.
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

  // Create the gradient scrim as a separate image
  const scrimSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="${OUTPUT_H}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${OUTPUT_H - 700}" width="${OUTPUT_W}" height="700" fill="url(#s)"/>
</svg>`)

  // Create the text as a separate Sharp text image
  // sharp.create with text input uses Pango which has proper font rendering
  const textSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OUTPUT_W}" height="200">
  <text
    x="${OUTPUT_W / 2}"
    y="120"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif"
    font-size="72"
    font-weight="200"
    fill="white"
    opacity="0.88"
    letter-spacing="8"
  >${escaped}</text>
</svg>`
  )

  // Resize the source image to wallpaper dimensions
  const base = await sharp(imageBuffer)
    .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
    .toBuffer()

  // Composite: base image → gradient scrim → text
  const result = await sharp(base)
    .composite([
      {
        input: scrimSvg,
        top: 0,
        left: 0,
      },
      {
        input: textSvg,
        top: OUTPUT_H - 420, // Position text in lower third
        left: 0,
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()

  return result
}
