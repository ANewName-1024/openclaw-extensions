/**
 * MemoryStore - 记忆存储管理
 * 基于 Claude Code memoryScan.ts 重构
 */
import type { Memory, MemoryHeader, MemoryType } from './types';
export declare class MemoryStore {
    private memoryDir;
    constructor(memoryDir?: string);
    /**
     * 保存记忆到文件
     */
    save(memory: Memory): Promise<void>;
    /**
     * 加载单个记忆
     */
    load(type: MemoryType, name: string): Promise<Memory | null>;
    /**
     * 删除记忆
     */
    delete(type: MemoryType, name: string): Promise<boolean>;
    /**
     * 扫描目录，返回所有记忆头信息
     */
    scan(signal?: AbortSignal): Promise<MemoryHeader[]>;
    /**
     * 按类型扫描记忆
     */
    scanByType(type: MemoryType, signal?: AbortSignal): Promise<MemoryHeader[]>;
    /**
     * 读取记忆文件头信息
     */
    private readHeader;
    /**
     * 生成安全文件名
     */
    private generateFilename;
    /**
     * 序列化记忆为 Markdown
     */
    private serialize;
    /**
     * 反序列化记忆
     */
    private deserialize;
}
export declare const MEMORY_TYPES: readonly ["user", "feedback", "project", "reference"];
//# sourceMappingURL=MemoryStore.d.ts.map