# Mirror Agent Launcher — 实现计划 (MVP)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 SolidJS Web 前端改造为 Electron 桌面应用，实现统一 CLI Agent 管理启动器

**Architecture:** Electron 主进程管理 ConfigAdapter 注册中心 + PTY 进程池；渲染进程通过 contextBridge IPC 与主进程通信；SolidJS 前端保留主题/布局，终端视图从简单行缓冲升级为 xterm.js

**Tech Stack:** Electron + SolidJS + xterm.js + node-pty + TypeScript strict mode + Tailwind CSS

**MVP 里程碑:**

| MVP | 内容 | 可验证产出 |
|-----|------|-----------|
| MVP1 | Electron 壳 + 现有前端跑起来 | 双击启动 Electron 窗口，看到现有 UI |
| MVP2 | ConfigAdapter 接口 + 注册中心 + IPC | `config:list` 返回已注册适配器 |
| MVP3 | ClaudeCodeAdapter + GenericAdapter | 读写 `~/.claude/settings.json` |
| MVP4 | PtyManager + 终端 IPC | 通过 xterm.js 和 Claude Code 对话 |
| MVP5 | 前端清理：去硬编码 + 动态表单 | Sidebar 从 IPC 取数据，设置页动态渲染 |
| MVP6 | 打包 + 日志 + 持久化 | 输出 EXE，重启恢复状态 |

---
