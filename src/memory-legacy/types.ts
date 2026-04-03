/**
 * Memory Types - 记忆系统类型定义
 * 基于 Claude Code memoryTypes.ts 重构
 */

export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'] as const

export type MemoryType = (typeof MEMORY_TYPES)[number]

export interface Memory {
  name: string
  description: string
  type: MemoryType
  content: string
  createdAt: Date
  updatedAt: Date
  scope: 'private' | 'team'
  tags?: string[]
}

export interface MemoryHeader {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  type: MemoryType | undefined
  scope?: 'private' | 'team'
}

export interface MemorySearchOptions {
  type?: MemoryType
  scope?: 'private' | 'team' | 'both'
  query?: string
  maxResults?: number
}

export interface MemoryConfig {
  enabled: boolean
  directory: string
  maxFiles: number
  session: SessionMemoryConfig
  search: SearchConfig
}

export interface SessionMemoryConfig {
  enabled: boolean
  minimumMessageTokensToInit: number
  minimumTokensBetweenUpdate: number
  toolCallsBetweenUpdates: number
}

export interface SearchConfig {
  enabled: boolean
  maxResults: number
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  enabled: true,
  directory: './memory',
  maxFiles: 200,
  session: {
    enabled: true,
    minimumMessageTokensToInit: 1000,
    minimumTokensBetweenUpdate: 2000,
    toolCallsBetweenUpdates: 10,
  },
  search: {
    enabled: true,
    maxResults: 5,
  },
}
