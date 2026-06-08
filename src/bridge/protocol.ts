// Stub protocol types — to be replaced by IPC types in MVP5
// Keeping old code compilable during migration

export interface ServerMessage {
  type: string
  id?: string
  sessionId?: string
  ts?: number
  payload: any
}

export interface StatusPayload {
  tokens?: number
  cost?: number
  contextUsed: number
  contextMax: number
  roundCount?: number
  model?: string
  thinkingLevel?: string
  availableModels?: { id: string; name: string; provider: string }[]
}

export interface SessionInfo {
  id: string
  title: string
  lastActive: number
  roundCount?: number
}

export interface AgentInfo {
  id: string
  name: string
  provider: string
  modelId: string
  avatarColor?: string
  roleDescription?: string
  isDefault?: boolean
}

export interface SkillSummary {
  name: string
  description: string
  source: 'user' | 'project'
  enabled: boolean
  dirName: string
}

export interface MCPServerConfig {
  id: string
  name: string
  command: string
  args: string[]
  tools: { name: string; description: string; params: Record<string, { type: string; required: boolean; description?: string }> }[]
  enabled: boolean
}
