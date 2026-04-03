/**
 * Memory Module - OpenClaw Memory System
 *
 * 基于 Claude Code 记忆系统重构的 OpenClaw 扩展模块
 *
 * @example
 * import { MemoryStore, MemorySelector, SessionMemoryManager } from '@openclaw/memory'
 *
 * // 创建记忆存储
 * const store = new MemoryStore('./memory')
 *
 * // 保存记忆
 * await store.save({
 *   name: 'user-preference',
 *   description: 'User prefers detailed output',
 *   type: 'user',
 *   content: '...',
 *   scope: 'private'
 * })
 *
 * // 扫描记忆
 * const memories = await store.scan()
 *
 * // AI 选择相关记忆
 * const selector = new MemorySelector()
 * const relevant = await selector.select('query', memories)
 */

export * from './types'
export { MemoryStore } from './MemoryStore'
export { MemorySelector } from './MemorySelector'
export { SessionMemoryManager, DEFAULT_SESSION_MEMORY_CONFIG } from './SessionMemory'
