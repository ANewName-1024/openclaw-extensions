/**
 * OpenClaw Memory System - Main Entry Point
 */
export * from './types/index.js';
export { MemoryStore } from './store/MemoryStore.js';
export { MemorySelector, createMemorySelector } from './selector/MemorySelector.js';
export type { SelectionResult, ModelClient } from './selector/MemorySelector.js';
export { SessionMemoryManager, createSessionMemoryManager } from './session/SessionMemory.js';
export type { ExtractionAgent } from './session/SessionMemory.js';
export { TeamMemoryManager } from './team/TeamMemory.js';
export { validatePath, validatePathWithSymlinks, sanitizePathKey, PathTraversalError, SymlinkEscapeError, } from './security/pathValidator.js';
export { parseFrontmatter, serializeFrontmatter } from './utils/frontmatter.js';
export { MemoryError, MemoryNotFoundError, MemoryValidationError, MemoryExistsError, MemoryQuotaError, MemoryExportError, MemoryImportError, } from './errors.js';
export { MemoryEventEmitter, globalEventEmitter, } from './events.js';
export type { MemoryEvent, MemoryEventType, EventHandler } from './events.js';
export { MemoryCache, MemoryStoreCache } from './cache.js';
export { MemoryBatchProcessor, MemoryTransaction } from './batch.js';
export type { BatchOperation, BatchResult } from './batch.js';
export { TTLCleanupManager, ScheduledCleanup } from './ttl.js';
export type { TTLCleanupResult, TTLCleanupPolicy } from './ttl.js';
export { MemoryExporter, MemoryImporter, createBackup, listBackups, } from './import-export.js';
export type { ExportMetadata, ExportData, ImportOptions, ImportResult } from './import-export.js';
import { MemoryStore } from './store/MemoryStore.js';
import { MemorySelector } from './selector/MemorySelector.js';
import { SessionMemoryManager } from './session/SessionMemory.js';
import { TeamMemoryManager } from './team/TeamMemory.js';
import type { MemoryConfig } from './types/index.js';
export interface MemorySystem {
    store: MemoryStore;
    selector: MemorySelector;
    session: SessionMemoryManager;
    team: TeamMemoryManager;
}
/**
 * Create a complete memory system with all components
 */
export declare function createMemorySystem(config?: Partial<MemoryConfig>): MemorySystem;
/**
 * Default memory system instance
 */
export declare const defaultMemorySystem: MemorySystem;
//# sourceMappingURL=index.d.ts.map