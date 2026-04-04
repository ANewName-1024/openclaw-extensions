/**
 * Batch Operations - Bulk memory operations with transaction support
 */
/**
 * Batch processor for memory operations
 */
export class MemoryBatchProcessor {
    store;
    concurrency;
    constructor(store, concurrency = 5) {
        this.store = store;
        this.concurrency = Math.max(1, Math.min(concurrency, 20)); // 1-20 range
    }
    /**
     * Execute a batch of operations
     */
    async execute(operations) {
        const result = {
            successful: 0,
            failed: 0,
            errors: [],
            results: [],
        };
        // Process in batches to limit concurrency
        for (let i = 0; i < operations.length; i += this.concurrency) {
            const batch = operations.slice(i, i + this.concurrency);
            const batchResults = await Promise.allSettled(batch.map(op => this.executeOperation(op)));
            for (let j = 0; j < batchResults.length; j++) {
                const settled = batchResults[j];
                const op = batch[j];
                if (settled.status === 'fulfilled') {
                    result.successful++;
                    result.results.push({ operation: op, result: settled.value });
                }
                else {
                    result.failed++;
                    result.errors.push({ operation: op, error: settled.reason });
                    result.results.push({ operation: op, result: undefined });
                }
            }
        }
        return result;
    }
    /**
     * Execute a single operation
     */
    async executeOperation(op) {
        switch (op.type) {
            case 'save':
                if (!op.memory) {
                    throw new Error('Memory required for save operation');
                }
                return this.store.save(op.memory);
            case 'update':
                if (!op.typeParam || !op.name || !op.updates) {
                    throw new Error('Type, name, and updates required for update operation');
                }
                return this.store.update(op.typeParam, op.name, op.updates);
            case 'delete':
                if (!op.typeParam || !op.name) {
                    throw new Error('Type and name required for delete operation');
                }
                return this.store.delete(op.typeParam, op.name);
            default:
                throw new Error(`Unknown operation type`);
        }
    }
    /**
     * Create batch save operations from memory array
     */
    static createSaveBatch(memories) {
        return memories.map(memory => ({
            type: 'save',
            memory,
        }));
    }
    /**
     * Create batch delete operations from type/name pairs
     */
    static createDeleteBatch(items) {
        return items.map(({ type, name }) => ({
            type: 'delete',
            typeParam: type,
            name,
        }));
    }
}
/**
 * Transaction support for atomic batch operations
 */
export class MemoryTransaction {
    operations = [];
    store;
    committed = false;
    rolledBack = false;
    constructor(store) {
        this.store = store;
    }
    /**
     * Queue a save operation
     */
    save(memory) {
        this.operations.push({ type: 'save', memory });
        return this;
    }
    /**
     * Queue an update operation
     */
    update(type, name, updates) {
        this.operations.push({ type: 'update', typeParam: type, name, updates });
        return this;
    }
    /**
     * Queue a delete operation
     */
    delete(type, name) {
        this.operations.push({ type: 'delete', typeParam: type, name });
        return this;
    }
    /**
     * Commit all operations atomically
     */
    async commit() {
        if (this.committed) {
            throw new Error('Transaction already committed');
        }
        if (this.rolledBack) {
            throw new Error('Transaction was rolled back');
        }
        const processor = new MemoryBatchProcessor(this.store);
        const result = await processor.execute(this.operations);
        if (result.failed > 0) {
            // Rollback on failure - try to undo what was done
            await this.rollback(result);
            throw new Error(`Transaction failed: ${result.failed} operations failed`);
        }
        this.committed = true;
        return result;
    }
    /**
     * Rollback all operations
     */
    async rollback(partialResult) {
        if (this.rolledBack || this.committed) {
            return;
        }
        this.rolledBack = true;
        // If we have partial results, try to undo successful operations
        if (partialResult) {
            const undoOps = [];
            for (const { operation, result } of partialResult.results) {
                if (result && operation.type === 'save' && operation.memory) {
                    // Undo save by deleting
                    undoOps.push({
                        type: 'delete',
                        typeParam: operation.memory.type,
                        name: operation.memory.name,
                    });
                }
            }
            if (undoOps.length > 0) {
                const processor = new MemoryBatchProcessor(this.store);
                await processor.execute(undoOps);
            }
        }
    }
    /**
     * Get number of queued operations
     */
    get size() {
        return this.operations.length;
    }
}
//# sourceMappingURL=batch.js.map