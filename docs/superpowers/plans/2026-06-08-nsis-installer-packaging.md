# NSIS 安装程序打包 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Mirror Agent Launcher 从 directory-based portable 构建切换为 NSIS 一键安装程序（单 setup.exe）

**Architecture:** 三步变更 — (1) 创建图标生成脚本将 PNG 转为多尺寸 ICO，(2) 修改 package.json 的 electron-builder 配置从 portable→nsis 并启用 npmRebuild，(3) 全量构建验证

**Tech Stack:** Electron 42, electron-builder 26, Sharp (已有依赖), node-pty 1.1

---

### Task 1: 创建 `scripts/generate-icon.mjs`

**Files:**
- Create: `scripts/generate-icon.mjs`

- [ ] **Step 1: Write the icon generation script**

```javascript
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

  // Calculate offsets for each image
  let offset = headerSize
  const dirEntries: Buffer[] = []

  for (let i = 0; i < imageCount; i++) {
    const imgBuf = buffers[i]
    const size = SIZES[i]
    // width/height: 0 for 256, otherwise the actual size
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

  // Combine: header + dir entries + image data
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
```

- [ ] **Step 2: Verify the script runs without error**

Run: `node scripts/generate-icon.mjs`
Expected: `[icon] Reading .../public/icon.png` → `[icon] Written .../public/icon.ico (... bytes, 7 sizes)`

- [ ] **Step 3: Verify the ICO file is valid**

Run: `node -e "const fs=require('fs'); const buf=fs.readFileSync('public/icon.ico'); console.log('type:', buf.readUInt16LE(2), '(1=ICO)'); console.log('sizes:', buf.readUInt16LE(4)); console.log('total bytes:', buf.length)"`
Expected: type=1, sizes=7, total bytes > 50000

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-icon.mjs public/icon.ico
git commit -m "feat: add icon generation script and multi-size ICO"
```

---

### Task 2: 修改 `package.json` — electron-builder NSIS 配置

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update the electron-builder config block**

Replace the entire `"build"` block (lines 41-59) with:

```json
  "build": {
    "appId": "com.mirror.agent-launcher",
    "productName": "Mirror Agent Launcher",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "public/**/*"
    ],
    "extraResources": [
      {
        "from": "public/live2d",
        "to": "live2d"
      }
    ],
    "npmRebuild": true,
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "public/icon.ico"
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false,
      "allowToChangeInstallationDirectory": false,
      "createDesktopShortcut": true,
      "shortcutName": "澪号 Agent",
      "installerIcon": "public/icon.ico",
      "uninstallerIcon": "public/icon.ico"
    }
  },
```

- [ ] **Step 2: Update the `icon` script to also generate ICO**

Change `"icon": "node scripts/generate-icon.mjs"` (was already referencing the file, but ensure it matches)

- [ ] **Step 3: Add `release/` to `.gitignore` if not present**

Check: `grep -n "release" .gitignore` — if no match, append `release/` on a new line.

- [ ] **Step 4: Commit**

```bash
git add package.json .gitignore
git commit -m "feat: switch from portable to NSIS one-click installer"
```

---

### Task 3: 全量构建 & 验证

**Files:**
- None (verification only)

- [ ] **Step 1: Generate icon and run full build**

```bash
node scripts/generate-icon.mjs
npm run build
```

Expected: `vite build` + `tsc -p main/tsconfig.json` both succeed.

- [ ] **Step 2: Run electron-builder to produce NSIS installer**

```bash
npx electron-builder --win --x64
```

Expected: Output ends with `target=nsis file=release/Mirror Agent Launcher Setup 0.0.1.exe` (or similar filename).

- [ ] **Step 3: Verify output files exist**

```bash
ls -lh release/"Mirror Agent Launcher Setup"*.exe
```

Expected: Single `.exe` file > 80MB (Electron runtime + app code + native modules).

- [ ] **Step 4: Quick smoke test (manual)**

Run `release/Mirror Agent Launcher Setup *.exe` — verify:
- One-click install to `%LOCALAPPDATA%\Mirror Agent Launcher`
- App auto-launches after install
- Terminal works (node-pty loaded correctly)
- Uninstall entry exists in Start Menu

- [ ] **Step 5: Commit final changes (if any)**

```bash
git add -A
git commit -m "chore: finalize NSIS installer packaging"
```
