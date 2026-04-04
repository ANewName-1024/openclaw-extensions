/**
 * Cache Layer - In-memory cache for frequently accessed memories
 */
import type { Memory, MemoryHeader } from './types/index.js';
interface CacheConfig {
    maxSize: number;
    defaultTtl: number;
    maxMemory: number;
}
/**
 * LRU Cache with TTL support
 */
export declare class MemoryCache<T> {
    private cache;
    private config;
    private totalSize;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get item from cache
     */
    get(key: string): T | undefined;
    /**
     * Set item in cache
     */
    set(key: string, data: T, ttl?: number): void;
    /**
     * Delete item from cache
     */
    delete(key: string): boolean;
    /**
     * Check if key exists in cache (without TTL check)
     */
    has(key: string): boolean;
    /**
     * Clear entire cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        itemCount: number;
        totalSize: number;
    };
    /**
     * Invalidate entries matching a pattern
     */
    invalidatePattern(pattern: RegExp): number;
    /**
     * Evict least recently used item
     */
    private evictLRU;
    /**
     * Estimate size of data in bytes
     */
    private estimateSize;
}
/**
 * Specialized cache for MemoryStore
 */
export declare class MemoryStoreCache {
    private headersCache;
    private memoryCache;
    constructor();
    /**
     * Get cached headers for a scan result
     */
    getHeaders(key: string): MemoryHeader[] | undefined;
    /**
     * Cache headers from a scan
     */
    setHeaders(key: string, headers: MemoryHeader[]): void;
    /**
     * Get cached memory
     */
    getMemory(type: string, name: string): Memory | undefined;
    /**
     * Cache a memory
     */
    setMemory(type: string, name: string, memory: Memory): void;
    /**
     * Invalidate memory cache
     */
    invalidateMemory(type: string, name: string): void;
    /**
     * Invalidate all caches for a type
     */
    invalidateType(type: string): void;
    /**
     * Clear all caches
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        headers: {
            size: number;
            itemCount: number;
            totalSize: number;
        };
        memories: {
            size: number;
            itemCount: number;
            totalSize: number;
        };
    };
}
export {};
//# sourceMappingURL=cache.d.ts.map