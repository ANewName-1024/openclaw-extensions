/**
 * MemorySelector - AI-powered memory relevance selection
 */
import type { MemoryHeader, AISelectionConfig } from '../types/index.js';
export interface SelectionResult {
    selected: MemoryHeader[];
    scores: Map<string, number>;
    model: string;
    latencyMs: number;
}
export declare class MemorySelector {
    private config;
    private modelClient?;
    constructor(config?: Partial<AISelectionConfig>, modelClient?: ModelClient);
    /**
     * Select the most relevant memories for a query
     */
    select(query: string, memories: MemoryHeader[], options?: {
        recentTools?: string[];
        maxResults?: number;
        excludeRecentTools?: boolean;
    }): Promise<SelectionResult>;
    /**
     * AI-powered selection using model
     */
    private aiSelect;
    /**
     * Keyword-based fallback selection
     */
    private keywordSelect;
    /**
     * Count overlapping words between two arrays
     */
    private countOverlap;
    /**
     * Filter out memories that are tool documentation for recently used tools
     */
    private filterRecentToolMemories;
    /**
     * Format memories as a text manifest
     */
    private formatManifest;
}
export interface ModelClient {
    complete(options: {
        model: string;
        prompt: string;
        maxTokens: number;
        schema?: Record<string, unknown>;
    }): Promise<string>;
}
export declare function createMemorySelector(config?: Partial<AISelectionConfig>, modelClient?: ModelClient): MemorySelector;
export default MemorySelector;
//# sourceMappingURL=MemorySelector.d.ts.map