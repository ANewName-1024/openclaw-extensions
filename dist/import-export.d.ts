/**
 * Import/Export - Backup and restore functionality
 */
import type { Memory } from './types/index.js';
import { MemoryStore } from './store/MemoryStore.js';
export interface ExportMetadata {
    version: string;
    exportedAt: string;
    memoryCount: number;
    types: Record<string, number>;
    scopes: Record<string, number>;
}
export interface ExportData {
    metadata: ExportMetadata;
    memories: Array<Omit<Memory, 'createdAt' | 'updatedAt' | 'filePath'>>;
}
export interface ImportOptions {
    overwrite: boolean;
    skipOnError: boolean;
    validateOnly: boolean;
}
export interface ImportResult {
    imported: number;
    skipped: number;
    errors: Array<{
        memory: string;
        error: Error;
    }>;
    duration: number;
}
/**
 * Export memories to a JSON file
 */
export declare class MemoryExporter {
    private store;
    constructor(store: MemoryStore);
    /**
     * Export all memories to a structured JSON object
     */
    exportToJSON(): Promise<ExportData>;
    /**
     * Export memories to a JSON file
     */
    exportToFile(filePath: string): Promise<ExportMetadata>;
    /**
     * Export memories to a directory structure
     */
    exportToDirectory(dirPath: string): Promise<ExportMetadata>;
}
/**
 * Import memories from backup
 */
export declare class MemoryImporter {
    private store;
    constructor(store: MemoryStore);
    /**
     * Import memories from a JSON file
     */
    importFromFile(filePath: string, options?: Partial<ImportOptions>): Promise<ImportResult>;
    /**
     * Import memories from JSON data
     */
    importFromData(data: ExportData, options?: Partial<ImportOptions>, startTime?: number): Promise<ImportResult>;
    /**
     * Validate import data without importing
     */
    validateImport(data: ExportData): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
}
/**
 * Create a backup with timestamp
 */
export declare function createBackup(store: MemoryStore, backupDir: string): Promise<string>;
/**
 * List available backups
 */
export declare function listBackups(backupDir: string): Promise<Array<{
    name: string;
    path: string;
    date: Date;
    memoryCount?: number;
}>>;
//# sourceMappingURL=import-export.d.ts.map