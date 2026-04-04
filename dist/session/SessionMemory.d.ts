/**
 * SessionMemory - Automatic conversation summarization
 */
import type { Message, SessionMemoryConfig, SessionMemoryState } from '../types/index.js';
export declare class SessionMemoryManager {
    private config;
    private state;
    private sessionDir;
    private sessionFile;
    private extractionAgent?;
    constructor(config?: Partial<SessionMemoryConfig>, sessionDir?: string, extractionAgent?: ExtractionAgent);
    getConfig(): Readonly<Required<SessionMemoryConfig>>;
    getState(): Readonly<SessionMemoryState>;
    reset(): void;
    /**
     * Check if memory extraction should be triggered
     */
    shouldExtract(messages: Message[]): boolean;
    /**
     * Extract and save session memory
     */
    extract(messages: Message[]): Promise<string>;
    /**
     * Manually trigger extraction (for /summary command)
     */
    extractManual(messages: Message[]): Promise<{
        success: boolean;
        path?: string;
        error?: string;
    }>;
    private ensureSessionFile;
    private loadTemplate;
    private serializeTemplate;
    private readCurrentMemory;
    private saveSummary;
    private buildExtractionPrompt;
    private markExtractionStarted;
    private estimateTokens;
    private countToolCallsSince;
    private lastTurnHasToolCalls;
}
export interface ExtractionAgent {
    extract(prompt: string, targetFile: string): Promise<string>;
}
export declare function createSessionMemoryManager(config?: Partial<SessionMemoryConfig>, sessionDir?: string, extractionAgent?: ExtractionAgent): SessionMemoryManager;
export default SessionMemoryManager;
//# sourceMappingURL=SessionMemory.d.ts.map