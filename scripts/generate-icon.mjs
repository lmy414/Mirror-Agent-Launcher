import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SIZES = [16, 24, 32, 48, 64, 128, 256]

async function main() {
  const pngPath = resolve(ROOT, 'public', 'icon.png')
  const icoPath = resolve(ROOT, 'public', 'icon.ico')

  console.log(`[icon] Reading ${pngPath}`)

  // 为每个尺寸生成 PNG buffer
  const buffers = await Promise.all(
    SIZES.map(size =>
      sharp(pngPath).resize(size, size).png().toBuffer()
    )
  )

  // 手动合成 ICO 文件
  // ICO header: 6 bytes
  //   - reserved (2): 0
  //   - type (2): 1 (ico)
  //   - count (2): number of images
  // ICO dir entry per image: 16 bytes
  //   - width (1): 0 = 256
  //   - height (1): 0 = 256
  //   - palette (1): 0
  //   - reserved (1): 0
  //   - planes (2): 1
  //   - bpp (2): 32
  //   - size (4): image data size
  //   - offset (4): offset to image data from BOF

  const imageCount = buffers.length
  const headerSize = 6 + imageCount * 16

  // 计算每个图像的偏移量
  let offset = headerSize
  const dirEntries = []

  for (let i = 0; i < imageCount; i++) {
    const imgBuf = buffers[i]
    const size = SIZES[i]
    // width/height: 256 用 0 表示
    const w = size === 256 ? 0 : size
    const h = size === 256 ? 0 : size

    const entry = Buffer.alloc(16)
    entry.writeUInt8(w, 0)          // width
    entry.writeUInt8(h, 1)          // height
    entry.writeUInt8(0, 2)          // palette
    entry.writeUInt8(0, 3)          // reserved
    entry.writeUInt16LE(1, 4)       // planes
    entry.writeUInt16LE(32, 6)      // bpp
    entry.writeUInt32LE(imgBuf.length, 8)  // size
    entry.writeUInt32LE(offset, 12)        // offset

    dirEntries.push(entry)
    offset += imgBuf.length
  }

  // Header
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)        // reserved
  header.writeUInt16LE(1, 2)        // type: ICO
  header.writeUInt16LE(imageCount, 4) // count

  // 合并: header + dir entries + image data
  const ico = Buffer.concat([
    header,
    ...dirEntries,
    ...buffers,
  ])

  writeFileSync(icoPath, ico)
  console.log(`[icon] Written ${icoPath} (${ico.length} bytes, ${SIZES.length} sizes)`)
}

main().catch(err => {
  console.error('[icon] Failed:', err)
  process.exit(1)
})
