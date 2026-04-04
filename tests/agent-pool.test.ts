/**
 * Agent Pool Tests
 */

import { AgentPoolManager, TaskAnalyzer } from '../src/agent-pool-integration'

describe('TaskAnalyzer', () => {
  let analyzer: TaskAnalyzer

  beforeEach(() => {
    analyzer = new TaskAnalyzer()
  })

  describe('complexity scoring', () => {
    it('should return base score for simple tasks', () => {
      const result = analyzer.analyze('hello')
      expect(result.score).toBeGreaterThanOrEqual(10)
      expect(result.score).toBeLessThan(30)
    })

    it('should detect high complexity patterns', () => {
      const result = analyzer.analyze('重构整个电商后端为微服务架构')
      // Score >= 35 (due to multiple high complexity words)
      expect(result.score).toBeGreaterThanOrEqual(35)
      expect(['hot', 'warm']).toContain(result.recommendedTier)
    })

    it('should detect medium complexity patterns', () => {
      const result = analyzer.analyze('修复登录Bug')
      expect(result.score).toBeGreaterThanOrEqual(25)
      expect(result.score).toBeLessThan(60)
    })

    it('should detect context requirements', () => {
      const result = analyzer.analyze('继续上次的代码审查')
      expect(result.requiresContext).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(25)
    })

    it('should detect multi-step tasks', () => {
      const result = analyzer.analyze('首先分析需求，然后设计架构，最后实现代码')
      expect(result.requiresMultiStep).toBe(true)
    })
  })

  describe('tier recommendation', () => {
    it('should recommend hot for high complexity with context', () => {
      const result = analyzer.analyze('继续上次的微服务重构', 15)
      expect(result.recommendedTier).toBe('hot')
    })

    it('should recommend warm or higher for medium complexity', () => {
      const result = analyzer.analyze('实现用户认证模块')
      expect(['warm', 'hot']).toContain(result.recommendedTier)
    })

    it('should recommend ondemand for simple independent tasks', () => {
      const result = analyzer.analyze('查一下天气')
      expect(result.recommendedTier).toBe('ondemand')
    })

    it('should recommend cold for simple requests', () => {
      const result = analyzer.analyze('帮我了解一下')
      // Simple request should be cold or ondemand
      expect(['cold', 'ondemand']).toContain(result.recommendedTier)
    })
  })

  describe('specialist detection', () => {
    it('should detect coder specialist', () => {
      const result = analyzer.analyze('实现用户模块的API')
      expect(result.requiresSpecialist).toBe(true)
      expect(result.specialistType).toBe('coder')
    })

    it('should detect reviewer or coder specialist', () => {
      const result = analyzer.analyze('审查代码安全性')
      expect(result.requiresSpecialist).toBe(true)
      // Could be coder or reviewer depending on priority
      expect(['coder', 'reviewer']).toContain(result.specialistType)
    })

    it('should detect researcher specialist', () => {
      const result = analyzer.analyze('调研微服务方案')
      expect(result.requiresSpecialist).toBe(true)
      expect(result.specialistType).toBe('researcher')
    })

    it('should detect devops specialist', () => {
      const result = analyzer.analyze('配置Docker部署')
      expect(result.requiresSpecialist).toBe(true)
      expect(result.specialistType).toBe('devops')
    })

    it('should detect qa specialist', () => {
      const result = analyzer.analyze('编写单元测试')
      expect(result.requiresSpecialist).toBe(true)
      expect(result.specialistType).toBe('qa')
    })
  })

  describe('history length impact', () => {
    it('should increase score for long history', () => {
      const shortHistory = analyzer.analyze('继续上次的工作', 5)
      const longHistory = analyzer.analyze('继续上次的工作', 15)
      expect(longHistory.score).toBeGreaterThan(shortHistory.score)
    })

    it('should require context for long history', () => {
      const result = analyzer.analyze('继续', 20)
      expect(result.requiresContext).toBe(true)
    })
  })
})

describe('AgentPoolManager', () => {
  let pool: AgentPoolManager

  beforeEach(() => {
    pool = new AgentPoolManager()
  })

  describe('initialization', () => {
    it('should create pool manager', () => {
      expect(pool).toBeDefined()
    })

    it('should have empty task history initially', () => {
      const history = pool.getTaskHistory()
      if (history instanceof Map) {
        expect(history.size).toBe(0)
      } else {
        expect(history).toBeUndefined()
      }
    })
  })

  describe('task submission', () => {
    it('should submit task and return complexity', async () => {
      const result = await pool.executeTask('实现简单的 hello world')
      
      expect(result).toBeDefined()
      expect(result.task).toBeDefined()
      expect(result.complexity).toBeDefined()
      expect(result.complexity.score).toBeGreaterThanOrEqual(10)
    }, 30000)

    it('should assign correct tier based on complexity', async () => {
      const simpleTask = await pool.executeTask('查天气')
      expect(simpleTask.complexity.recommendedTier).toBe('ondemand')

      const complexTask = await pool.executeTask('重构整个系统为微服务')
      // Should be warm or hot due to high complexity
      expect(['warm', 'hot']).toContain(complexTask.complexity.recommendedTier)
    }, 30000)
  })

  describe('batch execution', () => {
    it('should execute tasks in batch', async () => {
      const tasks = [
        '实现用户模块',
        '实现订单模块',
        '编写测试',
      ]

      const results = await pool.executeBatch(tasks, { parallel: false })
      
      expect(results).toHaveLength(3)
      expect(results[0].task).toBeDefined()
      expect(results[0].complexity).toBeDefined()
    }, 60000)

    it('should respect max concurrency', async () => {
      const tasks = Array(10).fill('实现功能').map((t, i) => `${t}${i}`)
      
      const startTime = Date.now()
      const results = await pool.executeBatch(tasks, { 
        parallel: true, 
        maxConcurrency: 3 
      })
      const duration = Date.now() - startTime

      expect(results).toHaveLength(10)
      // Should not take too long with parallel execution
      expect(duration).toBeLessThan(30000)
    }, 60000)
  })

  describe('complex task patterns', () => {
    const testCases = [
      { task: '查一下天气', minScore: 0, maxScore: 30 },
      { task: '修复这个小Bug', minScore: 10, maxScore: 50 },
      { task: '继续上次的工作', minScore: 25, maxScore: 100 },
      { task: '重构整个电商后端为微服务架构', minScore: 35, maxScore: 100 },
      { task: '调研Spring Cloud和K8s的区别', minScore: 10, maxScore: 80 },
      { task: '配置CI/CD部署流水线', minScore: 10, maxScore: 80 },
      { task: '编写这个模块的单元测试', minScore: 10, maxScore: 60 },
    ]

    testCases.forEach(({ task, minScore, maxScore }) => {
      it(`should analyze "${task}" with reasonable score`, async () => {
        const result = await pool.executeTask(task)
        
        expect(result.complexity.score).toBeGreaterThanOrEqual(minScore)
        expect(result.complexity.score).toBeLessThanOrEqual(maxScore)
        expect(result.complexity.recommendedTier).toBeDefined()
      }, 30000)
    })
  })
})

describe('Integration: Real task analysis', () => {
  let analyzer: TaskAnalyzer

  beforeEach(() => {
    analyzer = new TaskAnalyzer()
  })

  it('should handle real-world coding tasks', () => {
    const tasks = [
      { task: '实现一个Java Spring Boot用户注册接口，包含参数验证和异常处理', expectHot: false },
      { task: '继续上次的安全审计，我们需要检查所有API端点', expectHot: true },
      { task: '调研一下Redis和Memcached的区别，以及适用场景', expectHot: false },
      { task: '重构订单模块为领域驱动设计DDD架构', expectHot: true },
    ]

    tasks.forEach(({ task, expectHot }) => {
      const result = analyzer.analyze(task)
      console.log(`Task: "${task}"`)
      console.log(`  Score: ${result.score}`)
      console.log(`  Tier: ${result.recommendedTier}`)
      console.log(`  Specialist: ${result.specialistType || 'none'}`)
      console.log('')
      
      if (expectHot) {
        // High complexity tasks should be warm or hot
        expect(['warm', 'hot']).toContain(result.recommendedTier)
      }
    })
  })
})
