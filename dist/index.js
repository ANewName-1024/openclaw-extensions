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
//# sourceMappingURL=index.js.map