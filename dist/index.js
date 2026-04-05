/**
 * OpenClaw Memory System - Main Entry Point
 */
// Types
export * from './types/index.js';
// Core Store
export { MemoryStore } from './store/MemoryStore.js';
// AI Selector
export { MemorySelector, createMemorySelector } from './selector/MemorySelector.js';
// Session Memory
export { SessionMemoryManager, createSessionMemoryManager } from './session/SessionMemory.js';
// Team Memory
export { TeamMemoryManager } from './team/TeamMemory.js';
// Security
export { validatePath, validatePathWithSymlinks, sanitizePathKey, PathTraversalError, SymlinkEscapeError, } from './security/pathValidator.js';
// Utilities
export { parseFrontmatter, serializeFrontmatter } from './utils/frontmatter.js';
// Errors
export { MemoryError, MemoryNotFoundError, MemoryValidationError, MemoryExistsError, MemoryQuotaError, MemoryExportError, MemoryImportError, } from './errors.js';
// Events
export { MemoryEventEmitter, globalEventEmitter, } from './events.js';
// Cache
export { MemoryCache, MemoryStoreCache } from './cache.js';
// Batch Operations
export { MemoryBatchProcessor, MemoryTransaction } from './batch.js';
// TTL Cleanup
export { TTLCleanupManager, ScheduledCleanup } from './ttl.js';
// Import/Export
export { MemoryExporter, MemoryImporter, createBackup, listBackups, } from './import-export.js';
// =============================================================================
// Default Instance Factory
// =============================================================================
import { MemoryStore } from './store/MemoryStore.js';
import { MemorySelector } from './selector/MemorySelector.js';
import { SessionMemoryManager } from './session/SessionMemory.js';
import { TeamMemoryManager } from './team/TeamMemory.js';
import { DEFAULT_MEMORY_CONFIG } from './types/index.js';
/**
 * Create a complete memory system with all components
 */
export function createMemorySystem(config) {
    const fullConfig = { ...DEFAULT_MEMORY_CONFIG, ...config };
    const store = new MemoryStore(fullConfig);
    const selector = new MemorySelector(fullConfig.aiSelection);
    const session = new SessionMemoryManager(fullConfig.sessionMemory);
    const team = new TeamMemoryManager(fullConfig.teamMemory, fullConfig.directory);
    return {
        store,
        selector,
        session,
        team,
    };
}
/**
 * Default memory system instance
 */
export const defaultMemorySystem = createMemorySystem();

// =============================================================================
// OpenClaw Plugin Entry (v2 compatible)
// =============================================================================
import { t as definePluginEntry } from '../../../../npm/node_modules/openclaw/dist/plugin-entry-DA7dUJNL.js';

const plugin = definePluginEntry({
  id: 'memory-system',
  name: 'Memory System',
  description: 'Persistent, session, and team memory for AI assistants',
  kind: 'memory',
  register(api) {
    // Register memory runtime
    api.registerMemoryRuntime({
      async getMemorySearchManager(params) {
        const system = createMemorySystem();
        const manager = await system.store.getManager(params);
        return { manager, error: manager ? null : 'failed to create manager' };
      },
      resolveMemoryBackendConfig(params) {
        return { backend: 'custom', custom: { searchMode: 'selector' } };
      },
      async closeAllMemorySearchManagers() {
        // No-op for basic implementation
      },
    });

    // Register prompt section
    api.registerMemoryPromptSection(({ availableTools }) => {
      if (!availableTools.has('memory_search') && !availableTools.has('memory_get')) return [];
      return [
        '## Memory Recall',
        'Before answering questions about prior work, decisions, dates, people, preferences, or todos: run memory_search on MEMORY.md + memory/*.md; then use memory_get to pull only the needed lines.',
        'Citations: include Source: <path#line> when it helps the user verify memory snippets.',
        '',
      ];
    });

    // Register flush plan
    api.registerMemoryFlushPlan((params = {}) => {
      const nowMs = params.nowMs ?? Date.now();
      const date = new Date(nowMs).toISOString().slice(0, 10);
      return {
        softThresholdTokens: 4000,
        forceFlushTranscriptBytes: 2 * 1024 * 1024,
        reserveTokensFloor: 20000,
        prompt: `Pre-compaction memory flush. Store durable memories to memory/${date}.md only. Treat MEMORY.md, SOUL.md, TOOLS.md, AGENTS.md as read-only. Append to existing file if present.`,
        systemPrompt: `Pre-compaction memory flush turn. Store durable memories to disk.`,
        relativePath: `memory/${date}.md`,
      };
    });
  },
});

export { plugin as default };
//# sourceMappingURL=index.js.map