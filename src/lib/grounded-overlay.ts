import sharp from 'sharp'
import { createCanvas } from '@napi-rs/canvas'

const OUTPUT_W = 1080
const OUTPUT_H = 1920

export async function compositeWallpaper(
  imageBuffer: Buffer,
  title: string
): Promise<Buffer> {
  // Dynamic font size
  const charCount = title.length
  const fontSize = charCount <= 15 ? 72 : charCount <= 25 ? 58 : 46

  // Render text using Canvas API
  // Use 2x scale to ensure text is large enough on all environments
  const scale = 2
  const canvas = createCanvas(OUTPUT_W * scale, OUTPUT_H * scale)
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  // Transparent background
  ctx.clearRect(0, 0, OUTPUT_W, OUTPUT_H)

  // Gradient scrim in the bottom portion
  const gradient = ctx.createLinearGradient(0, OUTPUT_H - 650, 0, OUTPUT_H)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, OUTPUT_H - 650, OUTPUT_W, 650)

  // Draw title text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = `300 ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '4px'

  // Position: lower third, above lock screen buttons
  const textY = OUTPUT_H - 300
  ctx.fillText(title, OUTPUT_W / 2, textY)

  // Convert canvas to PNG buffer, resize back to output dimensions
  const rawOverlay = Buffer.from(canvas.toBuffer('image/png'))
  const overlayBuffer = await sharp(rawOverlay)
    .resize(OUTPUT_W, OUTPUT_H)
    .png()
    .toBuffer()

  // Resize source image and composite
  const base = await sharp(imageBuffer)
    .resize(OUTPUT_W, OUTPUT_H, { fit: 'cover' })
    .toBuffer()

  return sharp(base)
    .composite([{ input: overlayBuffer, top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer()
}
