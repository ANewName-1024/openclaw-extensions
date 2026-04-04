/**
 * Agent Pool 与 OpenClaw 的集成
 * 使用 sessions_spawn 实现池化 Sub-Agent
 */
interface TaskComplexity {
    score: number;
    requiresContext: boolean;
    requiresMultiStep: boolean;
    estimatedDuration: number;
    requiresSpecialist: boolean;
    specialistType?: string;
    recommendedTier: 'hot' | 'warm' | 'cold' | 'ondemand';
}
interface PooledTask {
    id: string;
    description: string;
    complexity: TaskComplexity;
    assignedAgent?: string;
    result?: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
}
declare class TaskAnalyzer {
    private highComplexityPatterns;
    private mediumComplexityPatterns;
    private contextPatterns;
    analyze(task: string, historyLength?: number): TaskComplexity;
}
interface PoolStats {
    tier: string;
    size: number;
    active: number;
    idle: number;
    totalTasks: number;
    avgResponseTime: number;
}
interface PoolConfig {
    hot: {
        minIdle: number;
        maxSize: number;
        idleTimeout: number;
    };
    warm: {
        minIdle: number;
        maxSize: number;
        idleTimeout: number;
    };
    cold: {
        minIdle: number;
        maxSize: number;
        idleTimeout: number;
    };
    ondemand: {
        maxConcurrent: number;
    };
}
declare class AgentPoolManager {
    private analyzer;
    private config;
    private pools;
    private taskHistory;
    private stats;
    constructor(config?: Partial<PoolConfig>);
    /**
     * 分析并执行任务
     */
    executeTask(task: string, options?: {
        historyLength?: number;
        preferredTier?: 'hot' | 'warm' | 'cold' | 'ondemand';
        agentId?: string;
    }): Promise<{
        task: PooledTask;
        complexity: TaskComplexity;
    }>;
    /**
     * 使用 sessions_spawn 执行任务
     */
    private executeWithSpawn;
    /**
     * 构建角色提示词
     */
    private buildRolePrompt;
    private getRoleInstructions;
    private getDefaultRoleInstructions;
    /**
     * 批量执行任务
     */
    executeBatch(tasks: string[], options?: {
        parallel?: boolean;
        maxConcurrency?: number;
    }): Promise<Array<{
        task: PooledTask;
        complexity: TaskComplexity;
    }>>;
    /**
     * 获取统计信息
     */
    getStats(): PoolStats[];
    /**
     * 获取任务历史
     */
    getTaskHistory(taskId?: string): Map<string, PooledTask> | PooledTask | undefined;
}
export { AgentPoolManager, TaskAnalyzer };
export type { TaskComplexity, PooledTask, PoolStats, PoolConfig };
//# sourceMappingURL=agent-pool-integration.d.ts.map