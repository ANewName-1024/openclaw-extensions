/**
 * Memory Types - 记忆系统类型定义
 * 基于 Claude Code memoryTypes.ts 重构
 */
export declare const MEMORY_TYPES: readonly ["user", "feedback", "project", "reference"];
export type MemoryType = (typeof MEMORY_TYPES)[number];
export interface Memory {
    name: string;
    description: string;
    type: MemoryType;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    scope: 'private' | 'team';
    tags?: string[];
}
export interface MemoryHeader {
    filename: string;
    filePath: string;
    mtimeMs: number;
    description: string | null;
    type: MemoryType | undefined;
    scope?: 'private' | 'team';
}
export interface MemorySearchOptions {
    type?: MemoryType;
    scope?: 'private' | 'team' | 'both';
    query?: string;
    maxResults?: number;
}
export interface MemoryConfig {
    enabled: boolean;
    directory: string;
    maxFiles: number;
    session: SessionMemoryConfig;
    search: SearchConfig;
}
export interface SessionMemoryConfig {
    enabled: boolean;
    minimumMessageTokensToInit: number;
    minimumTokensBetweenUpdate: number;
    toolCallsBetweenUpdates: number;
}
export interface SearchConfig {
    enabled: boolean;
    maxResults: number;
}
export declare const DEFAULT_MEMORY_CONFIG: MemoryConfig;
//# sourceMappingURL=types.d.ts.map