/**
 * OpenClaw Agent Pool Manager
 * 分级池化 + 自动化生命周期管理 + 复杂任务识别
 */

import { EventEmitter } from 'events'
// Types imported from ./types.js or defined inline

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tool_calls?: ToolCall[]
  createdAt?: Date
}

interface ToolCall {
  id: string
  name: string
  arguments: Record<string, any>
}

// ============================================================================
// 类型定义
// ============================================================================

export interface AgentConfig {
  id: string
  name: string
  role: AgentRole
  instructions: string
  model: string
  tools: string[]
  capabilities: string[]
}

export type AgentRole = 'coordinator' | 'coder' | 'reviewer' | 'researcher' | 'devops' | 'qa'

export type PoolTier = 'hot' | 'warm' | 'cold' | 'ondemand'

export interface PoolTierConfig {
  name: PoolTier
  size: number
  warmup: boolean
  idleTimeout: number // ms
  maxIdleTime: number // 最大空闲时间
  reusePolicy: 'session' | 'stateless' | 'adaptive'
}

export interface PooledAgent {
  id: string
  tier: PoolTier
  role: AgentRole
  status: AgentStatus
  sessionKey?: string
  createdAt: number
  lastUsedAt: number
  useCount: number
  currentTask?: string
  context?: {
    conversationHistory: Message[]
    memory: Map<string, any>
  }
}

export type AgentStatus = 'initializing' | 'idle' | 'busy' | 'cooling' | 'disposing' | 'dead'

export interface TaskComplexity {
  score: number // 0-100
  requiresContext: boolean
  requiresMultiStep: boolean
  estimatedDuration: number // ms
  requiresSpecialist: boolean
  specialistType?: AgentRole
}

export interface Task {
  id: string
  description: string
  complexity: TaskComplexity
  preferredTier: PoolTier
  assignedAgent?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  result?: any
  error?: Error
}

export interface PoolStats {
  tier: PoolTier
  total: number
  idle: number
  busy: number
  initializing: number
  dead: number
  avgWaitTime: number
  avgUseCount: number
}

// ============================================================================
// 任务复杂度分析器
// ============================================================================

export class TaskComplexityAnalyzer {
  private complexityPatterns = {
    // 高复杂度模式 (分数 +20~30)
    highComplexity: [
      /重构|重写|迁移|升级/,
      /微服务|分布式|集群/,
      /性能优化|调优|压测/,
      /安全审计|渗透测试/,
      /架构设计|方案设计/,
      /实现\w+模块|开发\w+系统/,
      /审查\w+代码|分析\w+代码/,
      /研究\w+方案|调研\w+技术/,
    ],
    // 中等复杂度模式 (分数 +10~20)
    mediumComplexity: [
      /修复\w+Bug|解决\w+问题/,
      /添加\w+功能|新增\w+功能/,
      /编写\w+测试|单元测试/,
      /配置\w+部署|安装\w+设置/,
      /优化\w+代码|改进\w+实现/,
      /文档\w+编写|说明\w+文档/,
    ],
    // 上下文相关 (需要复用)
    contextPatterns: [
      /继续|接着|上次的/,
      /之前|曾经|已经/,
      /基于\w+修改|在\w+基础上/,
      /这个项目|我们的/,
      /他和\w+的区别/,
    ],
    // 多步骤模式
    multiStepPatterns: [
      /首先.*然后.*最后/,
      /第一步.*第二步/,
      /需求.*设计.*实现/,
      /分析.*设计.*开发/,
    ],
  }

  /**
   * 分析任务复杂度
   */
  analyze(task: string, history?: Message[]): TaskComplexity {
    let score = 10 // 基础分数
    let requiresContext = false
    let requiresMultiStep = false
    let requiresSpecialist = false
    let specialistType: AgentRole | undefined

    const taskLower = task.toLowerCase()

    // 1. 分析复杂度
    for (const pattern of this.complexityPatterns.highComplexity) {
      if (pattern.test(taskLower)) {
        score += 25
        break
      }
    }

    for (const pattern of this.complexityPatterns.mediumComplexity) {
      if (pattern.test(taskLower)) {
        score += 15
        break
      }
    }

    // 2. 分析上下文依赖
    for (const pattern of this.complexityPatterns.contextPatterns) {
      if (pattern.test(taskLower)) {
        requiresContext = true
        score += 15
        break
      }
    }

    // 3. 分析多步骤
    if (this.complexityPatterns.multiStepPatterns.some(p => p.test(taskLower))) {
      requiresMultiStep = true
      score += 10
    }

    // 4. 检测专业领域
    const specialistPatterns: [RegExp, AgentRole][] = [
      [/代码|程序|后端|前端|api|数据库/, 'coder'],
      [/审查|安全|漏洞|质量/, 'reviewer'],
      [/研究|调研|分析|对比/, 'researcher'],
      [/部署|容器|ci\/cd|k8s|docker/, 'devops'],
      [/测试|单元测试|集成测试|自动化/, 'qa'],
    ]

    for (const [pattern, role] of specialistPatterns) {
      if (pattern.test(taskLower)) {
        requiresSpecialist = true
        specialistType = role
        break
      }
    }

    // 5. 基于历史调整
    if (history && history.length > 10) {
      score += 10
      requiresContext = true
    }

    // 6. 估算时长
    const estimatedDuration = this.estimateDuration(score)

    return {
      score: Math.min(100, score),
      requiresContext,
      requiresMultiStep,
      estimatedDuration,
      requiresSpecialist,
      specialistType,
    }
  }

  /**
   * 估算任务时长
   */
  private estimateDuration(score: number): number {
    // 基于复杂度分数估算
    const baseTime = 30000 // 30秒基础
    const multiplier = score / 10
    return baseTime * multiplier * 1000 // 转换为ms
  }

  /**
   * 推荐池层级
   */
  recommendTier(complexity: TaskComplexity): PoolTier {
    if (complexity.requiresContext && complexity.score >= 50) {
      return 'hot' // 需要上下文的高复杂度任务 -> 热池
    }
    if (complexity.score >= 40 || complexity.requiresMultiStep) {
      return 'warm' // 中等复杂度 -> 温池
    }
    if (complexity.score < 20 && !complexity.requiresContext) {
      return 'ondemand' // 简单独立任务 -> 按需
    }
    return 'cold' // 其他 -> 冷池备用
  }
}

// ============================================================================
// Agent 池
// ============================================================================

export class AgentPool extends EventEmitter {
  private pools: Map<PoolTier, PooledAgent[]> = new Map()
  private tierConfigs: Map<PoolTier, PoolTierConfig>
  private taskQueue: Task[] = []
  private activeTasks: Map<string, Task> = new Map()
  private agentFactory: AgentFactory
  private lifecycleManager: LifecycleManager
  private statsCollector: StatsCollector

  constructor(
    agentFactory: AgentFactory,
    tierConfigs: PoolTierConfig[]
  ) {
    super()
    this.agentFactory = agentFactory
    this.tierConfigs = new Map(tierConfigs.map(c => [c.name, c]))
    this.lifecycleManager = new LifecycleManager(this)
    this.statsCollector = new StatsCollector(this.pools)

    // 初始化各层级池
    for (const config of tierConfigs) {
      this.pools.set(config.name, [])
    }

    // 启动生命周期管理
    this.lifecycleManager.start()
  }

  /**
   * 获取或创建 Agent
   */
  async acquireAgent(tier: PoolTier, role?: AgentRole): Promise<PooledAgent> {
    const pool = this.pools.get(tier)!
    const config = this.tierConfigs.get(tier)!

    // 1. 尝试从池中获取空闲 Agent
    const idleAgent = pool.find(a => a.status === 'idle')
    if (idleAgent) {
      return this.assignAgent(idleAgent)
    }

    // 2. 池未满，创建新 Agent
    if (pool.length < config.size) {
      const agent = await this.createAgent(tier, role || 'coder')
      pool.push(agent)
      return this.assignAgent(agent)
    }

    // 3. 池已满，等待空闲
    return this.waitForAgent(tier, role)
  }

  /**
   * 分配任务给 Agent
   */
  private async assignAgent(agent: PooledAgent): Promise<PooledAgent> {
    agent.status = 'busy'
    agent.lastUsedAt = Date.now()
    agent.useCount++
    this.emit('agent:assigned', agent)
    return agent
  }

  /**
   * 创建新 Agent
   */
  private async createAgent(tier: PoolTier, role: AgentRole): Promise<PooledAgent> {
    const config = this.tierConfigs.get(tier)!
    const agent: PooledAgent = {
      id: `agent-${tier}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tier,
      role,
      status: 'initializing',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
    }

    this.emit('agent:creating', agent)

    // 模拟初始化
    await this.initializeAgent(agent, config)

    return agent
  }

  /**
   * 初始化 Agent
   */
  private async initializeAgent(agent: PooledAgent, config: PoolTierConfig): Promise<void> {
    try {
      // 创建会话
      const sessionKey = await this.agentFactory.createSession({
        role: agent.role,
        warmup: config.warmup,
      })

      agent.sessionKey = sessionKey
      agent.status = 'idle'
      agent.context = {
        conversationHistory: [],
        memory: new Map(),
      }

      this.emit('agent:ready', agent)
    } catch (error) {
      agent.status = 'dead'
      this.emit('agent:error', { agent, error })
      throw error
    }
  }

  /**
   * 等待空闲 Agent
   */
  private async waitForAgent(tier: PoolTier, role?: AgentRole): Promise<PooledAgent> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('agent:returned', handler)
        reject(new Error('Timeout waiting for agent'))
      }, 30000)

      const handler = (agent: PooledAgent) => {
        if (agent.tier === tier && agent.status === 'idle') {
          clearTimeout(timeout)
          this.off('agent:returned', handler)
          resolve(this.assignAgent(agent))
        }
      }

      this.on('agent:returned', handler)
    })
  }

  /**
   * 归还 Agent 到池
   */
  async releaseAgent(agent: PooledAgent, taskResult?: any): Promise<void> {
    const pool = this.pools.get(agent.tier)!
    const config = this.tierConfigs.get(agent.tier)!

    agent.status = 'cooling'
    agent.currentTask = undefined
    agent.lastUsedAt = Date.now()

    // 检查是否超过最大空闲时间
    const idleTime = Date.now() - agent.lastUsedAt
    if (idleTime > config.maxIdleTime) {
      await this.disposeAgent(agent)
      return
    }

    // 检查使用次数
    if (agent.useCount > 100) {
      await this.disposeAgent(agent)
      return
    }

    // 返回池中
    agent.status = 'idle'
    this.emit('agent:returned', agent)
  }

  /**
   * 销毁 Agent
   */
  async disposeAgent(agent: PooledAgent): Promise<void> {
    const pool = this.pools.get(agent.tier)!
    const index = pool.indexOf(agent)

    if (index !== -1) {
      pool.splice(index, 1)
    }

    agent.status = 'disposing'

    try {
      if (agent.sessionKey) {
        await this.agentFactory.destroySession(agent.sessionKey)
      }
    } catch (error) {
      // 忽略销毁错误
    }

    agent.status = 'dead'
    this.emit('agent:disposed', agent)

    // 尝试补充池
    this.replenishPool(agent.tier)
  }

  /**
   * 补充池
   */
  private replenishPool(tier: PoolTier): void {
    const pool = this.pools.get(tier)!
    const config = this.tierConfigs.get(tier)!

    if (pool.length < config.size) {
      // 异步创建新 Agent
      this.createAgent(tier, 'coder').then(agent => {
        pool.push(agent)
      }).catch(() => {
        // 创建失败，下次再试
      })
    }
  }

  /**
   * 提交任务
   */
  async submitTask(description: string): Promise<Task> {
    const analyzer = new TaskComplexityAnalyzer()
    const complexity = analyzer.analyze(description)
    const preferredTier = analyzer.recommendTier(complexity)

    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description,
      complexity,
      preferredTier,
      createdAt: Date.now(),
    }

    this.activeTasks.set(task.id, task)
    this.emit('task:submitted', task)

    // 分配 Agent
    const agent = await this.acquireAgent(task.preferredTier)
    task.assignedAgent = agent.id
    task.startedAt = Date.now()

    try {
      // 执行任务
      const result = await this.agentFactory.executeTask(agent.sessionKey!, description)
      task.result = result
      task.completedAt = Date.now()
      this.emit('task:completed', task)
    } catch (error) {
      task.error = error as Error
      this.emit('task:failed', task)
    } finally {
      // 归还 Agent
      await this.releaseAgent(agent, task.result)
      this.activeTasks.delete(task.id)
    }

    return task
  }

  /**
   * 获取统计信息
   */
  getStats(): Map<PoolTier, PoolStats> {
    return this.statsCollector.collect()
  }

  /**
   * 优雅关闭
   */
  async shutdown(): Promise<void> {
    this.lifecycleManager.stop()

    for (const [, pool] of Array.from(this.pools.entries())) {
      for (const agent of pool) {
        await this.disposeAgent(agent)
      }
    }

    this.emit('pool:shutdown')
  }
}

// ============================================================================
// 生命周期管理器
// ============================================================================

export class LifecycleManager {
  private pool: AgentPool
  private intervals: ReturnType<typeof setInterval>[] = []
  private running = false

  constructor(pool: AgentPool) {
    this.pool = pool
  }

  start(): void {
    if (this.running) return
    this.running = true

    // 健康检查 (每 30 秒)
    this.intervals.push(
      setInterval(() => this.healthCheck(), 30000)
    )

    // 池补充 (每 60 秒)
    this.intervals.push(
      setInterval(() => this.replenish(), 60000)
    )

    // 统计收集 (每 5 分钟)
    this.intervals.push(
      setInterval(() => this.collectStats(), 300000)
    )
  }

  stop(): void {
    this.running = false
    for (const interval of this.intervals) {
      clearInterval(interval)
    }
    this.intervals = []
  }

  private healthCheck(): void {
    // 检查无响应 Agent 并尝试恢复
    const stats = this.pool.getStats()

    Array.from(stats.entries()).forEach(([tier, stat]) => {
      if (stat.dead > 0) {
        console.log(`[Lifecycle] Tier ${tier}: ${stat.dead} dead agents`)
      }
      if (stat.avgWaitTime > 10000) {
        console.warn(`[Lifecycle] Tier ${tier}: High wait time ${stat.avgWaitTime}ms`)
      }
    })
  }

  private replenish(): void {
    // 根据负载自动补充池
  }

  private collectStats(): void {
    const stats = this.pool.getStats()
    Array.from(stats.entries()).forEach(([tier, stat]) => {
      console.log(`[Stats] ${tier}: idle=${stat.idle}, busy=${stat.busy}, avgUse=${stat.avgUseCount}`)
    })
  }
}

// ============================================================================
// 统计收集器
// ============================================================================

export class StatsCollector {
  private pools: Map<PoolTier, PooledAgent[]>

  constructor(pools: Map<PoolTier, PooledAgent[]>) {
    this.pools = pools
  }

  collect(): Map<PoolTier, PoolStats> {
    const stats = new Map<PoolTier, PoolStats>()

    Array.from(this.pools.entries()).forEach(([tier, agents]) => {
      const idle = agents.filter(a => a.status === 'idle').length
      const busy = agents.filter(a => a.status === 'busy').length
      const initializing = agents.filter(a => a.status === 'initializing').length
      const dead = agents.filter(a => a.status === 'dead').length
      const avgUseCount = agents.length > 0
        ? agents.reduce((sum, a) => sum + a.useCount, 0) / agents.length
        : 0
      const avgWaitTime = 0 // 简化，实际需要跟踪等待时间

      stats.set(tier, {
        tier,
        total: agents.length,
        idle,
        busy,
        initializing,
        dead,
        avgWaitTime,
        avgUseCount,
      })
    })

    return stats
  }
}

// ============================================================================
// Agent 工厂 (接口)
// ============================================================================

export interface AgentFactory {
  createSession(config: { role: AgentRole; warmup: boolean }): Promise<string>
  destroySession(sessionKey: string): Promise<void>
  executeTask(sessionKey: string, task: string): Promise<any>
}

export class DefaultAgentFactory implements AgentFactory {
  async createSession(config: { role: AgentRole; warmup: boolean }): Promise<string> {
    // TODO: 调用 sessions_spawn 创建会话
    return `session-${Date.now()}`
  }

  async destroySession(sessionKey: string): Promise<void> {
    // TODO: 销毁会话
  }

  async executeTask(sessionKey: string, task: string): Promise<any> {
    // TODO: 执行任务
    return { result: 'task completed' }
  }
}

// ============================================================================
// 默认配置
// ============================================================================

export const DEFAULT_TIER_CONFIGS: PoolTierConfig[] = [
  {
    name: 'hot',
    size: 2,
    warmup: true,
    idleTimeout: 300000, // 5 分钟
    maxIdleTime: 1800000, // 30 分钟
    reusePolicy: 'session',
  },
  {
    name: 'warm',
    size: 3,
    warmup: false,
    idleTimeout: 600000, // 10 分钟
    maxIdleTime: 3600000, // 1 小时
    reusePolicy: 'adaptive',
  },
  {
    name: 'cold',
    size: 2,
    warmup: false,
    idleTimeout: 1800000, // 30 分钟
    maxIdleTime: 7200000, // 2 小时
    reusePolicy: 'stateless',
  },
  {
    name: 'ondemand',
    size: 0, // 按需创建
    warmup: false,
    idleTimeout: 0,
    maxIdleTime: 300000, // 5 分钟
    reusePolicy: 'stateless',
  },
]

// ============================================================================
// 使用示例
// ============================================================================

/*
import { AgentPool, TaskComplexityAnalyzer, DEFAULT_TIER_CONFIGS, DefaultAgentFactory } from './agent-pool'

// 1. 初始化池
const factory = new DefaultAgentFactory()
const pool = new AgentPool(factory, DEFAULT_TIER_CONFIGS)

// 2. 提交任务 (自动判断复杂度)
const task1 = await pool.submitTask('帮我写一个用户注册接口')
const task2 = await pool.submitTask('重构整个用户模块为微服务架构，并进行安全审查')
const task3 = await pool.submitTask('调研一下 Spring Cloud 和 Kubernetes 的区别')

// 3. 查看统计
const stats = pool.getStats()
console.log(stats)

// 4. 关闭
await pool.shutdown()
*/
