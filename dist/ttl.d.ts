/**
 * TTL Cleanup - Automatic expiration and cleanup of old memories
 */
import type { MemoryHeader } from './types/index.js';
import { MemoryStore } from './store/MemoryStore.js';
export interface TTLCleanupResult {
    scanned: number;
    deleted: number;
    errors: Error[];
    duration: number;
}
export interface TTLCleanupPolicy {
    enabled: boolean;
    defaultTtlDays: number;
    typeOverrides?: Partial<Record<string, number>>;
    checkOnStartup: boolean;
    maxAge?: number;
}
/**
 * TTL-based memory cleanup
 */
export declare class TTLCleanupManager {
    private store;
    private policies;
    private lastCleanup;
    constructor(store: MemoryStore, policies?: TTLCleanupPolicy[]);
    /**
     * Set cleanup policy for a scope
     */
    setPolicy(scope: string, policy: TTLCleanupPolicy): void;
    /**
     * Get policy for a scope
     */
    getPolicy(scope: string): TTLCleanupPolicy | undefined;
    /**
     * Check if a memory has expired based on its metadata
     */
    hasExpired(header: MemoryHeader, policy: TTLCleanupPolicy): boolean;
    /**
     * Run cleanup for a specific scope
     */
    cleanupScope(scope?: string): Promise<TTLCleanupResult>;
    /**
     * Run cleanup for all scopes
     */
    cleanupAll(): Promise<Map<string, TTLCleanupResult>>;
    /**
     * Get last cleanup time for a scope
     */
    getLastCleanup(scope: string): Date | undefined;
    /**
     * Estimate space that would be freed
     */
    estimateCleanup(scope?: string): Promise<{
        wouldDelete: number;
        wouldFreeBytes: number;
        oldestEntry: Date | null;
    }>;
}
/**
 * Scheduled cleanup runner
 */
export declare class ScheduledCleanup {
    private manager;
    private intervalMs;
    private running;
    private timer;
    private onCleanup?;
    constructor(manager: TTLCleanupManager, intervalHours?: number, onCleanup?: (results: Map<string, TTLCleanupResult>) => void | Promise<void>);
    /**
     * Start scheduled cleanup
     */
    start(): void;
    /**
     * Stop scheduled cleanup
     */
    stop(): void;
    /**
     * Run cleanup now
     */
    run(): Promise<Map<string, TTLCleanupResult>>;
    /**
     * Check if running
     */
    isRunning(): boolean;
}
//# sourceMappingURL=ttl.d.ts.map