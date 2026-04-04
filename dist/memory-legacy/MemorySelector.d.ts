/**
 * MemorySelector - AI 驱动的记忆相关性选择
 * 基于 Claude Code findRelevantMemories.ts 重构
 */
import type { MemoryHeader } from './types';
export interface MemorySelectorOptions {
    model?: string;
    maxResults?: number;
}
export declare class MemorySelector {
    private model;
    private maxResults;
    constructor(options?: MemorySelectorOptions);
    /**
     * 选择与查询最相关的记忆
     */
    select(query: string, memories: MemoryHeader[], recentTools?: string[]): Promise<MemoryHeader[]>;
    /**
     * 格式化记忆清单
     */
    private formatManifest;
    /**
     * 调用模型
     */
    private callModel;
    /**
     * 解析响应
     */
    private parseResponse;
}
export default MemorySelector;
//# sourceMappingURL=MemorySelector.d.ts.map