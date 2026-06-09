# 技术债登记表

> 全项目唯一技术债文件。每次迭代 Cool-down 时回顾。

| ID | 来源 | 描述 | 状态 |
|----|------|------|------|
| D1 | v0.1.1 适配器重构 | Launcher 配置字段（provider/deepseek*）写入到 `~/.claude/settings.json`，污染 Claude Code 原生配置。应迁移到 Launcher 自有 store | ⏳ |
| D2 | v0.1.2 KimiCode 适配 | Kimi Code 终端启动后 exitCode=1：SAFE_ENV_KEYS 白名单过窄导致 `kimi.cmd` 栈溢出(0xC0000409)，扩白名单后变为正常退出但 API 连接失败。迁移到自有store后 KIMI_API_KEY 已注入但仍连不上。可能原因：Kimi Code 的 OAuth 全局配置(`managed:kimi-code`) 与 Launcher 注入的 API Key env 存在冲突。Electron 直连 node-pty 测试通过，需对比 Electron spawn vs 独立 spawn 的完整环境差异 | ⏳ |
| D3 | v0.1.2 配置管理 | 适配器配置存储不统一：ClaudeCodeAdapter 写入原生JSON，KimiCodeAdapter 写入自有store，GenericAdapter 写入自有store。需要统一为 Launcher store 模式，永不污染原生配置文件 | ⏳ |
