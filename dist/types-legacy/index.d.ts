/**
 * Memory Types - Core type definitions for OpenClaw Memory System
 */
export declare const MEMORY_TYPES: readonly ["user", "feedback", "project", "reference"];
export type MemoryType = (typeof MEMORY_TYPES)[number];
export type MemoryScope = 'private' | 'team' | 'both';
export interface Memory {
    name: string;
    description: string;
    type: MemoryType;
    content: string;
    scope: MemoryScope;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    filePath?: string;
}
export interface MemoryHeader {
    filename: string;
    filePath: string;
    mtimeMs: number;
    description: string | null;
    type: MemoryType | undefined;
    scope: MemoryScope;
    name?: string;
}
export interface MemoryFrontmatter {
    name: string;
    description: string;
    type: MemoryType;
    scope?: MemoryScope;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}
export interface ParsedMemory {
    frontmatter: MemoryFrontmatter;
    body: string;
}
export interface MemoryConfig {
    enabled: boolean;
    directory: string;
    maxFiles: number;
    maxFileSize: number;
    autoMemory: AutoMemoryConfig;
    teamMemory: TeamMemoryConfig;
    sessionMemory: SessionMemoryConfig;
    aiSelection: AISelectionConfig;
    security: SecurityConfig;
}
export interface AutoMemoryConfig {
    enabled: boolean;
    autoSave: boolean;
    types: {
        user: {
            scope: MemoryScope;
        };
        feedback: {
            scope: MemoryScope;
        };
        project: {
            scope: MemoryScope;
        };
        reference: {
            scope: MemoryScope;
        };
    };
}
export interface TeamMemoryConfig {
    enabled: boolean;
    syncOnStart: boolean;
    path: string;
}
export interface SessionMemoryConfig {
    enabled: boolean;
    minimumMessageTokensToInit: number;
    minimumTokensBetweenUpdate: number;
    toolCallsBetweenUpdates: number;
    template: SessionTemplate;
}
export interface SessionTemplate {
    title: string;
    currentState: string;
    taskSpecification: string;
    filesAndFunctions: string;
    workflow: string;
    errorsAndCorrections: string;
    codebaseDocumentation: string;
    learnings: string;
    keyResults: string;
    worklog: string;
}
export interface AISelectionConfig {
    enabled: boolean;
    model: string;
    maxResults: number;
    excludeRecentTools: boolean;
}
export interface SecurityConfig {
    validatePaths: boolean;
    checkSymlinks: boolean;
    maxPathDepth: number;
}
export interface SessionMemoryState {
    initialized: boolean;
    lastExtractionTokens: number;
    lastExtractionMessageId: string | null;
    extractionCount: number;
}
export interface MemorySearchOptions {
    type?: MemoryType;
    scope?: MemoryScope | 'both';
    query?: string;
    maxResults?: number;
    recentTools?: string[];
}
export interface MemorySearchResult {
    memories: Memory[];
    scores: Map<string, number>;
    totalScanned: number;
}
export interface PaginationOptions {
    page?: number;
    pageSize?: number;
    offset?: number;
    limit?: number;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
/**
 * Normalize pagination options to offset/limit
 */
export declare function normalizePagination(opts: PaginationOptions): {
    offset: number;
    limit: number;
};
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tool_calls?: ToolCall[];
    createdAt?: Date;
}
export declare const DEFAULT_MEMORY_CONFIG: MemoryConfig;
export declare const MEMORY_TYPE_DESCRIPTIONS: Record<MemoryType, string>;
export declare const DEFAULT_SESSION_MEMORY_TEMPLATE: string;
//# sourceMappingURL=index.d.ts.map