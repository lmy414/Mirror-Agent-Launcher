/**
 * 输入校验工具 — 防止路径遍历与命令注入
 */

const TOOL_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/

/** 校验 toolId：仅允许字母、数字、下划线、连字符，长度 1-64 */
export function validateToolId(toolId: string): boolean {
  return typeof toolId === 'string' && TOOL_ID_RE.test(toolId)
}

/** shell 元字符黑名单 */
const SHELL_METACHAR_RE = /[;|&$()`]/

/** 校验启动命令安全性 */
export function validateCommand(command: string): { valid: boolean; error?: string } {
  if (typeof command !== 'string' || command.length === 0) {
    return { valid: false, error: '启动命令不能为空' }
  }
  if (command.length > 4096) {
    return { valid: false, error: '启动命令过长' }
  }
  if (SHELL_METACHAR_RE.test(command)) {
    return { valid: false, error: '启动命令包含非法 shell 元字符' }
  }
  // 禁止路径遍历片段（绝对路径中 .. 本身合法，但相对路径中的 .. 需要谨慎）
  if (command.includes('..')) {
    return { valid: false, error: '启动命令不能包含路径遍历' }
  }
  return { valid: true }
}

/** 校验参数字符串安全性 */
export function validateArgsString(argsStr: string): { valid: boolean; error?: string } {
  if (typeof argsStr !== 'string') {
    return { valid: false, error: '参数必须是字符串' }
  }
  if (argsStr.length > 8192) {
    return { valid: false, error: '参数过长' }
  }
  if (SHELL_METACHAR_RE.test(argsStr)) {
    return { valid: false, error: '参数包含非法 shell 元字符' }
  }
  return { valid: true }
}

/** 校验工作目录安全性 */
export function validateCwd(cwd: string): { valid: boolean; error?: string } {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    return { valid: false, error: '工作目录不能为空' }
  }
  if (cwd.length > 4096) {
    return { valid: false, error: '工作目录路径过长' }
  }
  // Windows  UNC 路径或绝对路径中的 .. 本身合法；这里仅禁止明显的相对路径遍历前缀
  const normalized = cwd.replace(/\\/g, '/')
  if (normalized.split('/').some((seg) => seg === '..')) {
    return { valid: false, error: '工作目录包含非法路径遍历' }
  }
  return { valid: true }
}
