/**
 * TeamMemory - Team-scoped memory management
 */
import type { Memory, MemoryHeader, MemoryType, TeamMemoryConfig } from '../types/index.js';
export declare class TeamMemoryManager {
    private config;
    private baseDir;
    constructor(config?: Partial<TeamMemoryConfig>, baseDir?: string);
    getDirectory(): string;
    isEnabled(): boolean;
    /**
     * Save a team memory
     */
    save(memory: Omit<Memory, 'createdAt' | 'updatedAt' | 'scope'>): Promise<Memory>;
    /**
     * Load a team memory
     */
    load(type: MemoryType, name: string): Promise<Memory | null>;
    /**
     * Delete a team memory
     */
    delete(type: MemoryType, name: string): Promise<boolean>;
    /**
     * Scan all team memories
     */
    scan(): Promise<MemoryHeader[]>;
    /**
     * Get team memory index
     */
    getTeamIndex(): Promise<string>;
    /**
     * Update team memory index
     */
    updateTeamIndex(memory: Memory): Promise<void>;
    /**
     * Remove entry from team index
     */
    removeFromTeamIndex(type: MemoryType, name: string): Promise<void>;
    /**
     * Sync team memories (for startup)
     */
    sync(): Promise<{
        loaded: number;
        errors: string[];
    }>;
    private validateTeamPath;
    private generateFilename;
    private readHeader;
    private parseFrontmatter;
    private serializeMemory;
    private deserializeMemory;
}
export default TeamMemoryManager;
//# sourceMappingURL=TeamMemory.d.ts.map