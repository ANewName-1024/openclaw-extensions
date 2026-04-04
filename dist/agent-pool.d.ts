/**
 * OpenClaw Agent Pool Manager
 * 分级池化 + 自动化生命周期管理 + 复杂任务识别
 */
import { EventEmitter } from 'events';
import type { Message } from './types/index.js';
export interface AgentConfig {
    id: string;
    name: string;
    role: AgentRole;
    instructions: string;
    model: string;
    tools: string[];
    capabilities: string[];
}
export type AgentRole = 'coordinator' | 'coder' | 'reviewer' | 'researcher' | 'devops' | 'qa';
export type PoolTier = 'hot' | 'warm' | 'cold' | 'ondemand';
export interface PoolTierConfig {
    name: PoolTier;
    size: number;
    warmup: boolean;
    idleTimeout: number;
    maxIdleTime: number;
    reusePolicy: 'session' | 'stateless' | 'adaptive';
}
export interface PooledAgent {
    id: string;
    tier: PoolTier;
    role: AgentRole;
    status: AgentStatus;
    sessionKey?: string;
    createdAt: number;
    lastUsedAt: number;
    useCount: number;
    currentTask?: string;
    context?: {
        conversationHistory: Message[];
        memory: Map<string, any>;
    };
}
export type AgentStatus = 'initializing' | 'idle' | 'busy' | 'cooling' | 'disposing' | 'dead';
export interface TaskComplexity {
    score: number;
    requiresContext: boolean;
    requiresMultiStep: boolean;
    estimatedDuration: number;
    requiresSpecialist: boolean;
    specialistType?: AgentRole;
}
export interface Task {
    id: string;
    description: string;
    complexity: TaskComplexity;
    preferredTier: PoolTier;
    assignedAgent?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    result?: any;
    error?: Error;
}
export interface PoolStats {
    tier: PoolTier;
    total: number;
    idle: number;
    busy: number;
    initializing: number;
    dead: number;
    avgWaitTime: number;
    avgUseCount: number;
}
export declare class TaskComplexityAnalyzer {
    private complexityPatterns;
    /**
     * 分析任务复杂度
     */
    analyze(task: string, history?: Message[]): TaskComplexity;
    /**
     * 估算任务时长
     */
    private estimateDuration;
    /**
     * 推荐池层级
     */
    recommendTier(complexity: TaskComplexity): PoolTier;
}
export declare class AgentPool extends EventEmitter {
    private pools;
    private tierConfigs;
    private taskQueue;
    private activeTasks;
    private agentFactory;
    private lifecycleManager;
    private statsCollector;
    constructor(agentFactory: AgentFactory, tierConfigs: PoolTierConfig[]);
    /**
     * 获取或创建 Agent
     */
    acquireAgent(tier: PoolTier, role?: AgentRole): Promise<PooledAgent>;
    /**
     * 分配任务给 Agent
     */
    private assignAgent;
    /**
     * 创建新 Agent
     */
    private createAgent;
    /**
     * 初始化 Agent
     */
    private initializeAgent;
    /**
     * 等待空闲 Agent
     */
    private waitForAgent;
    /**
     * 归还 Agent 到池
     */
    releaseAgent(agent: PooledAgent, taskResult?: any): Promise<void>;
    /**
     * 销毁 Agent
     */
    disposeAgent(agent: PooledAgent): Promise<void>;
    /**
     * 补充池
     */
    private replenishPool;
    /**
     * 提交任务
     */
    submitTask(description: string): Promise<Task>;
    /**
     * 获取统计信息
     */
    getStats(): Map<PoolTier, PoolStats>;
    /**
     * 优雅关闭
     */
    shutdown(): Promise<void>;
}
export declare class LifecycleManager {
    private pool;
    private intervals;
    private running;
    constructor(pool: AgentPool);
    start(): void;
    stop(): void;
    private healthCheck;
    private replenish;
    private collectStats;
}
export declare class StatsCollector {
    private pools;
    constructor(pools: Map<PoolTier, PooledAgent[]>);
    collect(): Map<PoolTier, PoolStats>;
}
export interface AgentFactory {
    createSession(config: {
        role: AgentRole;
        warmup: boolean;
    }): Promise<string>;
    destroySession(sessionKey: string): Promise<void>;
    executeTask(sessionKey: string, task: string): Promise<any>;
}
export declare class DefaultAgentFactory implements AgentFactory {
    createSession(config: {
        role: AgentRole;
        warmup: boolean;
    }): Promise<string>;
    destroySession(sessionKey: string): Promise<void>;
    executeTask(sessionKey: string, task: string): Promise<any>;
}
export declare const DEFAULT_TIER_CONFIGS: PoolTierConfig[];
//# sourceMappingURL=agent-pool.d.ts.map