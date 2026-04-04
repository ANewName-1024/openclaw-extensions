/**
 * MemoryStore - Core memory storage management
 */
import type { Memory, MemoryHeader, MemoryType, MemoryScope, MemoryConfig, MemorySearchOptions, PaginationOptions, PaginatedResult } from '../types/index.js';
export declare class MemoryStore {
    private config;
    private baseDir;
    constructor(config?: Partial<MemoryConfig>);
    getDirectory(): string;
    setDirectory(dir: string): void;
    getConfig(): Readonly<Required<MemoryConfig>>;
    /**
     * Save a memory to the store
     */
    save(memory: Omit<Memory, 'createdAt' | 'updatedAt'>): Promise<Memory>;
    /**
     * Load a single memory by type and name
     */
    load(type: MemoryType, name: string): Promise<Memory | null>;
    /**
     * Load a memory by its file path
     */
    loadByPath(filePath: string): Promise<Memory | null>;
    /**
     * Update an existing memory
     */
    update(type: MemoryType, name: string, updates: Partial<Omit<Memory, 'type' | 'createdAt'>>): Promise<Memory | null>;
    /**
     * Delete a memory
     */
    delete(type: MemoryType, name: string): Promise<boolean>;
    /**
     * Scan all memories in the store
     */
    scan(signal?: AbortSignal): Promise<MemoryHeader[]>;
    /**
     * Scan all memories with pagination
     */
    scanPaginated(signal?: AbortSignal, pagination?: PaginationOptions): Promise<PaginatedResult<MemoryHeader>>;
    /**
     * Scan memories of a specific type
     */
    scanType(type: MemoryType, signal?: AbortSignal): Promise<MemoryHeader[]>;
    /**
     * Scan memories of a specific type with pagination
     */
    scanTypePaginated(type: MemoryType, signal?: AbortSignal, pagination?: PaginationOptions): Promise<PaginatedResult<MemoryHeader>>;
    /**
     * Search memories with optional filters
     */
    search(options: MemorySearchOptions): Promise<Memory[]>;
    /**
     * Search memories with optional filters and pagination
     */
    searchPaginated(options: MemorySearchOptions, pagination?: PaginationOptions): Promise<PaginatedResult<Memory>>;
    /**
     * Get MEMORY.md index content
     */
    getIndex(scope?: MemoryScope): Promise<string>;
    /**
     * Update MEMORY.md index
     */
    updateIndex(memory: Omit<Memory, 'createdAt' | 'updatedAt'>): Promise<void>;
    /**
     * Remove entry from index
     */
    removeFromIndex(type: MemoryType, name: string): Promise<void>;
    private getMemoryDir;
    private getTypeDirs;
    private guessScope;
    private readHeader;
    private deserializeMemory;
}
export default MemoryStore;
//# sourceMappingURL=MemoryStore.d.ts.map