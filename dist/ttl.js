/**
 * TTL Cleanup - Automatic expiration and cleanup of old memories
 */
/**
 * TTL-based memory cleanup
 */
export class TTLCleanupManager {
    store;
    policies = new Map();
    lastCleanup = new Map();
    constructor(store, policies) {
        this.store = store;
        this.policies.set('default', {
            enabled: true,
            defaultTtlDays: 30,
            checkOnStartup: false,
        });
        if (policies) {
            for (const policy of policies) {
                this.policies.set(policy.enabled ? 'default' : 'disabled', policy);
            }
        }
    }
    /**
     * Set cleanup policy for a scope
     */
    setPolicy(scope, policy) {
        this.policies.set(scope, policy);
    }
    /**
     * Get policy for a scope
     */
    getPolicy(scope) {
        return this.policies.get(scope);
    }
    /**
     * Check if a memory has expired based on its metadata
     */
    hasExpired(header, policy) {
        const ageMs = Date.now() - header.mtimeMs;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        // Check absolute max age
        if (policy.maxAge && ageDays > policy.maxAge) {
            return true;
        }
        // Check type-specific TTL
        const ttlDays = policy.typeOverrides?.[header.type ?? ''] ?? policy.defaultTtlDays;
        return ageDays > ttlDays;
    }
    /**
     * Run cleanup for a specific scope
     */
    async cleanupScope(scope = 'private') {
        const startTime = Date.now();
        const result = {
            scanned: 0,
            deleted: 0,
            errors: [],
            duration: 0,
        };
        const policy = this.policies.get(scope);
        if (!policy || !policy.enabled) {
            result.duration = Date.now() - startTime;
            return result;
        }
        try {
            // Scan all memories
            const headers = await this.store.scan();
            for (const header of headers) {
                result.scanned++;
                try {
                    if (this.hasExpired(header, policy)) {
                        if (header.name && header.type) {
                            await this.store.delete(header.type, header.name);
                            result.deleted++;
                        }
                    }
                }
                catch (error) {
                    result.errors.push(error);
                }
            }
            this.lastCleanup.set(scope, new Date());
        }
        catch (error) {
            result.errors.push(error);
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Run cleanup for all scopes
     */
    async cleanupAll() {
        const results = new Map();
        for (const scope of ['private', 'team', 'both']) {
            results.set(scope, await this.cleanupScope(scope));
        }
        return results;
    }
    /**
     * Get last cleanup time for a scope
     */
    getLastCleanup(scope) {
        return this.lastCleanup.get(scope);
    }
    /**
     * Estimate space that would be freed
     */
    async estimateCleanup(scope = 'private') {
        const policy = this.policies.get(scope);
        if (!policy) {
            return { wouldDelete: 0, wouldFreeBytes: 0, oldestEntry: null };
        }
        const headers = await this.store.scan();
        let wouldDelete = 0;
        let wouldFreeBytes = 0;
        let oldestEntry = null;
        for (const header of headers) {
            if (this.hasExpired(header, policy)) {
                wouldDelete++;
                // Estimate ~500 bytes per memory file
                wouldFreeBytes += 500;
                if (!oldestEntry || header.mtimeMs < oldestEntry.getTime()) {
                    oldestEntry = new Date(header.mtimeMs);
                }
            }
        }
        return { wouldDelete, wouldFreeBytes, oldestEntry };
    }
}
/**
 * Scheduled cleanup runner
 */
export class ScheduledCleanup {
    manager;
    intervalMs;
    running = false;
    timer = null;
    onCleanup;
    constructor(manager, intervalHours = 24, onCleanup) {
        this.manager = manager;
        this.intervalMs = intervalHours * 60 * 60 * 1000;
        this.onCleanup = onCleanup;
    }
    /**
     * Start scheduled cleanup
     */
    start() {
        if (this.running)
            return;
        this.running = true;
        // Run immediately
        this.run();
        // Schedule recurring runs
        this.timer = setInterval(() => {
            this.run();
        }, this.intervalMs);
    }
    /**
     * Stop scheduled cleanup
     */
    stop() {
        this.running = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * Run cleanup now
     */
    async run() {
        const results = await this.manager.cleanupAll();
        if (this.onCleanup) {
            try {
                await this.onCleanup(results);
            }
            catch (error) {
                console.error('Cleanup callback error:', error);
            }
        }
        return results;
    }
    /**
     * Check if running
     */
    isRunning() {
        return this.running;
    }
}
//# sourceMappingURL=ttl.js.map