/**
 * Memory Types - 记忆系统类型定义
 * 基于 Claude Code memoryTypes.ts 重构
 */
export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'];
export const DEFAULT_MEMORY_CONFIG = {
    enabled: true,
    directory: './memory',
    maxFiles: 200,
    session: {
        enabled: true,
        minimumMessageTokensToInit: 1000,
        minimumTokensBetweenUpdate: 2000,
        toolCallsBetweenUpdates: 10,
    },
    search: {
        enabled: true,
        maxResults: 5,
    },
};
//# sourceMappingURL=types.js.map