/**
 * Cache Layer - In-memory cache for frequently accessed memories
 */
/**
 * LRU Cache with TTL support
 */
export class MemoryCache {
    cache = new Map();
    config;
    totalSize = 0;
    constructor(config = {}) {
        this.config = {
            maxSize: config.maxSize ?? 100,
            defaultTtl: config.defaultTtl ?? 5 * 60 * 1000, // 5 minutes
            maxMemory: config.maxMemory ?? 10 * 1024 * 1024, // 10MB
        };
    }
    /**
     * Get item from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check TTL
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key);
            return undefined;
        }
        // Update access count (for LRU)
        entry.accessCount++;
        return entry.data;
    }
    /**
     * Set item in cache
     */
    set(key, data, ttl) {
        // Calculate size (rough estimate)
        const size = this.estimateSize(data);
        // Evict if necessary
        while ((this.cache.size >= this.config.maxSize ||
            this.totalSize + size > this.config.maxMemory) &&
            this.cache.size > 0) {
            this.evictLRU();
        }
        // Remove existing entry if present
        const existing = this.cache.get(key);
        if (existing) {
            this.totalSize -= this.estimateSize(existing.data);
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl ?? this.config.defaultTtl,
            accessCount: 0,
        });
        this.totalSize += size;
    }
    /**
     * Delete item from cache
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.totalSize -= this.estimateSize(entry.data);
            return this.cache.delete(key);
        }
        return false;
    }
    /**
     * Check if key exists in cache (without TTL check)
     */
    has(key) {
        return this.cache.has(key);
    }
    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
        this.totalSize = 0;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            itemCount: this.cache.size,
            totalSize: this.totalSize,
        };
    }
    /**
     * Invalidate entries matching a pattern
     */
    invalidatePattern(pattern) {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.delete(key);
                count++;
            }
        }
        return count;
    }
    /**
     * Evict least recently used item
     */
    evictLRU() {
        let lruKey;
        let lruCount = Infinity;
        for (const [key, entry] of this.cache) {
            if (entry.accessCount < lruCount) {
                lruCount = entry.accessCount;
                lruKey = key;
            }
        }
        if (lruKey) {
            this.delete(lruKey);
        }
    }
    /**
     * Estimate size of data in bytes
     */
    estimateSize(data) {
        try {
            return Buffer.byteLength(JSON.stringify(data), 'utf8');
        }
        catch {
            return 100; // default estimate
        }
    }
}
/**
 * Specialized cache for MemoryStore
 */
export class MemoryStoreCache {
    headersCache;
    memoryCache;
    constructor() {
        this.headersCache = new MemoryCache({ maxSize: 10, defaultTtl: 60 * 1000 });
        this.memoryCache = new MemoryCache({ maxSize: 50, defaultTtl: 5 * 60 * 1000 });
    }
    /**
     * Get cached headers for a scan result
     */
    getHeaders(key) {
        return this.headersCache.get(key);
    }
    /**
     * Cache headers from a scan
     */
    setHeaders(key, headers) {
        this.headersCache.set(key, headers);
    }
    /**
     * Get cached memory
     */
    getMemory(type, name) {
        return this.memoryCache.get(`${type}:${name}`);
    }
    /**
     * Cache a memory
     */
    setMemory(type, name, memory) {
        this.memoryCache.set(`${type}:${name}`, memory);
    }
    /**
     * Invalidate memory cache
     */
    invalidateMemory(type, name) {
        this.memoryCache.delete(`${type}:${name}`);
    }
    /**
     * Invalidate all caches for a type
     */
    invalidateType(type) {
        this.headersCache.invalidatePattern(new RegExp(`^${type}:`));
        this.memoryCache.invalidatePattern(new RegExp(`^${type}:`));
    }
    /**
     * Clear all caches
     */
    clear() {
        this.headersCache.clear();
        this.memoryCache.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            headers: this.headersCache.getStats(),
            memories: this.memoryCache.getStats(),
        };
    }
}
//# sourceMappingURL=cache.js.map