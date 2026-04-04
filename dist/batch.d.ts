/**
 * Batch Operations - Bulk memory operations with transaction support
 */
import type { Memory, MemoryType } from './types/index.js';
import { MemoryStore } from './store/MemoryStore.js';
export interface BatchOperation {
    type: 'save' | 'update' | 'delete';
    memory?: Omit<Memory, 'createdAt' | 'updatedAt'>;
    typeParam?: MemoryType;
    name?: string;
    updates?: Partial<Omit<Memory, 'type' | 'createdAt'>>;
}
export interface BatchResult {
    successful: number;
    failed: number;
    errors: Array<{
        operation: BatchOperation;
        error: Error;
    }>;
    results: Array<{
        operation: BatchOperation;
        result?: Memory | boolean;
    }>;
}
/**
 * Batch processor for memory operations
 */
export declare class MemoryBatchProcessor {
    private store;
    private concurrency;
    constructor(store: MemoryStore, concurrency?: number);
    /**
     * Execute a batch of operations
     */
    execute(operations: BatchOperation[]): Promise<BatchResult>;
    /**
     * Execute a single operation
     */
    private executeOperation;
    /**
     * Create batch save operations from memory array
     */
    static createSaveBatch(memories: Array<Omit<Memory, 'createdAt' | 'updatedAt'>>): BatchOperation[];
    /**
     * Create batch delete operations from type/name pairs
     */
    static createDeleteBatch(items: Array<{
        type: MemoryType;
        name: string;
    }>): BatchOperation[];
}
/**
 * Transaction support for atomic batch operations
 */
export declare class MemoryTransaction {
    private operations;
    private store;
    private committed;
    private rolledBack;
    constructor(store: MemoryStore);
    /**
     * Queue a save operation
     */
    save(memory: Omit<Memory, 'createdAt' | 'updatedAt'>): this;
    /**
     * Queue an update operation
     */
    update(type: MemoryType, name: string, updates: Partial<Omit<Memory, 'type' | 'createdAt'>>): this;
    /**
     * Queue a delete operation
     */
    delete(type: MemoryType, name: string): this;
    /**
     * Commit all operations atomically
     */
    commit(): Promise<BatchResult>;
    /**
     * Rollback all operations
     */
    rollback(partialResult?: BatchResult): Promise<void>;
    /**
     * Get number of queued operations
     */
    get size(): number;
}
//# sourceMappingURL=batch.d.ts.map