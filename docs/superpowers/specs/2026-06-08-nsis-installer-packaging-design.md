# NSIS 安装程序打包设计

> 日期: 2026-06-08 | 状态: 待实现

---

## 目标

将 Mirror Agent Launcher 打包为单文件 NSIS 安装程序（`Setup.exe`），用户双击即可一键安装并自动启动。

## 用户需求概要

| 需求 | 决策 |
|------|------|
| 打包形式 | NSIS 安装程序（单 setup.exe） |
| 安装范围 | 单用户（`%LOCALAPPDATA%`），无需管理员权限 |
| 安装体验 | 一键安装（oneClick），安装完自动启动 |
| 原生模块处理 | 正确重编译 node-pty 并解包 |

---

## 1. 变更清单

### 1.1 `package.json` — electron-builder 配置

```diff
  "build": {
    "appId": "com.mirror.agent-launcher",
    "productName": "Mirror Agent Launcher",
    "directories": { "output": "release" },
    "files": ["dist/**/*", "dist-electron/**/*", "public/**/*"],
-   "npmRebuild": false,
-   "nodeGypRebuild": false,
-   "buildDependenciesFromSource": false,
+   "npmRebuild": true,
    "win": {
-     "target": ["portable"],
+     "target": [{ "target": "nsis", "arch": ["x64"] }],
      "icon": "public/icon.png"
    },
+   "nsis": {
+     "oneClick": true,
+     "perMachine": false,
+     "allowToChangeInstallationDirectory": false,
+     "createDesktopShortcut": true,
+     "shortcutName": "澪号 Agent"
+   }
  }
```

### 1.2 新增 `scripts/generate-icon.mjs`

用 sharp 将 `public/icon.png` 转换为 Windows 需要的 `.ico` 格式（含多尺寸 16/32/48/64/128/256）。

### 1.3 构建脚本

`npm run build:electron` 已存在且链路完整：
```
vite build → tsc -p main/tsconfig.json → electron-builder
```

---

## 2. 关键风险点 & 解决方案

### 2.1 node-pty 原生模块

**问题**: `node-pty` 包含 C++ 代码（`deps/winpty`），编译时需匹配 Electron 内置的 Node.js ABI。

**解决**:
- 设置 `npmRebuild: true` — electron-builder 会在打包前用 `@electron/rebuild` 自动重编译
- electron-builder 会自动检测原生 `.node` 文件并将其放入 `app.asar.unpacked`
- 无需手动配置 `asarUnpack`

### 2.2 图标格式

**问题**: Windows `.exe` 和 NSIS 安装程序需要 `.ico` 格式，当前只有 `public/icon.png`。

**解决**: 新建 `scripts/generate-icon.mjs`，用 `sharp` 将 PNG 转为多尺寸 ICO。构建前运行 `npm run icon`。

### 2.3 ASAR 完整性

**问题**: 如果 `dist/` 或 `dist-electron/` 构建不完整，打包出的 EXE 会运行失败。

**解决**: 在 `build:electron` 中添加前置检查 — 确认 `dist/index.html` 和 `dist-electron/index.js` 存在后再调用 electron-builder。

---

## 3. 最终产物

```
release/
├── Mirror Agent Launcher Setup 0.0.1.exe   ← 分发给用户的安装程序
├── builder-debug.yml                        ← 调试信息
└── win-unpacked/                            ← electron-builder 中间产物（可 .gitignore）
```

用户安装后:
```
%LOCALAPPDATA%\Mirror Agent Launcher\
├── Mirror Agent Launcher.exe
├── resources/
│   ├── app.asar
│   └── app.asar.unpacked/        ← node-pty 原生模块
├── [Electron runtime DLLs...]
└── Uninstall Mirror Agent Launcher.exe      ← 卸载入口
```

---

## 4. 不做什么

- **不**改 Vite 配置 — 当前配置正常工作
- **不**改主进程入口 — 已正确处理 dev/prod 路径
- **不**修改代码逻辑 — 本次只涉及打包配置
- **不**添加自动更新 — 留到后续版本
- **不**做代码签名 — 个人工具，暂不需要 Authenticode 证书
