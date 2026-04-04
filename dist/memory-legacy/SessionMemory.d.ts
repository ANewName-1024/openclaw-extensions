/**
 * SessionMemory - 会话记忆自动摘要
 * 基于 Claude Code sessionMemory.ts 重构
 */
import type { Message } from '../types';
import type { SessionMemoryConfig } from './types';
export declare const DEFAULT_SESSION_MEMORY_CONFIG: SessionMemoryConfig;
export interface SessionMemoryState {
    initialized: boolean;
    lastExtractionTokens: number;
    lastExtractionMessageId: string | null;
}
export declare class SessionMemoryManager {
    private config;
    private state;
    private sessionDir;
    constructor(config?: Partial<SessionMemoryConfig>, sessionDir?: string);
    /**
     * 检查是否应该触发记忆提取
     */
    shouldExtract(messages: Message[]): boolean;
    /**
     * 提取会话摘要
     */
    extract(messages: Message[]): Promise<string>;
    /**
     * 确保会话记忆文件存在
     */
    private ensureSessionFile;
    /**
     * 加载会话记忆模板
     */
    private loadSessionTemplate;
    /**
     * 构建提取提示
     */
    private buildExtractionPrompt;
    /**
     * 运行提取子代理
     */
    private runExtractionAgent;
    /**
     * 估算 token 数量
     */
    private estimateTokenCount;
    /**
     * 计算自上次提取以来的工具调用次数
     */
    private countToolCallsSince;
    /**
     * 检查最后一条 assistant 消息是否包含工具调用
     */
    private checkLastTurnHasToolCalls;
    /**
     * 重置状态
     */
    reset(): void;
}
export default SessionMemoryManager;
//# sourceMappingURL=SessionMemory.d.ts.map