/**
 * Agent Pool 与 OpenClaw 的集成
 * 使用 sessions_spawn 实现池化 Sub-Agent
 */
class TaskAnalyzer {
    highComplexityPatterns = [
        /重构|重写|迁移|升级/,
        /微服务|分布式|集群/,
        /性能优化|调优|压测/,
        /安全审计|渗透测试/,
        /架构设计|方案设计/,
        /实现\w+模块|开发\w+系统/,
        /审查\w+代码|分析\w+代码/,
        /研究\w+方案|调研\w+技术/,
        /完整\w+|整个\w+/,
    ];
    mediumComplexityPatterns = [
        /修复\w+Bug|解决\w+问题/,
        /添加\w+功能|新增\w+功能/,
        /编写\w+测试|单元测试/,
        /配置\w+部署|安装\w+设置/,
        /优化\w+代码|改进\w+实现/,
        /文档\w+编写|说明\w+文档/,
    ];
    contextPatterns = [
        /继续|接着|上次的/,
        /之前|曾经|已经/,
        /基于\w+修改|在\w+基础上/,
        /这个项目|我们的/,
        /他和\w+的区别/,
        /参考之前的/,
    ];
    analyze(task, historyLength = 0) {
        let score = 10;
        let requiresContext = false;
        let requiresMultiStep = false;
        let requiresSpecialist = false;
        let specialistType;
        const lower = task.toLowerCase();
        // 高复杂度检测
        for (const p of this.highComplexityPatterns) {
            if (p.test(lower)) {
                score += 25;
                break;
            }
        }
        // 中等复杂度检测
        for (const p of this.mediumComplexityPatterns) {
            if (p.test(lower)) {
                score += 15;
                break;
            }
        }
        // 上下文依赖检测
        for (const p of this.contextPatterns) {
            if (p.test(lower)) {
                requiresContext = true;
                score += 15;
                break;
            }
        }
        // 多步骤检测
        if (/首先.*然后|第一.*第二|步骤/.test(lower)) {
            requiresMultiStep = true;
            score += 10;
        }
        // 专业领域检测
        const specialists = [
            [/代码|程序|后端|前端|api|数据库/, 'coder'],
            [/审查|安全|漏洞|质量/, 'reviewer'],
            [/研究|调研|分析|对比/, 'researcher'],
            [/部署|容器|ci\/cd|k8s|docker/, 'devops'],
            [/测试|单元测试|自动化/, 'qa'],
        ];
        for (const [p, type] of specialists) {
            if (p.test(lower)) {
                requiresSpecialist = true;
                specialistType = type;
                break;
            }
        }
        // 历史越长，上下文复用价值越高
        if (historyLength > 10) {
            score += 10;
            requiresContext = true;
        }
        // 推荐层级
        let recommendedTier = 'cold';
        if (requiresContext && score >= 50) {
            recommendedTier = 'hot';
        }
        else if (score >= 40 || requiresMultiStep) {
            recommendedTier = 'warm';
        }
        else if (score < 20 && !requiresContext) {
            recommendedTier = 'ondemand';
        }
        return {
            score: Math.min(100, score),
            requiresContext,
            requiresMultiStep,
            estimatedDuration: (score * 1000),
            requiresSpecialist,
            specialistType,
            recommendedTier,
        };
    }
}
class AgentPoolManager {
    analyzer = new TaskAnalyzer();
    config;
    pools = new Map();
    taskHistory = new Map();
    stats = [];
    constructor(config) {
        this.config = {
            hot: { minIdle: 1, maxSize: 3, idleTimeout: 300000 },
            warm: { minIdle: 1, maxSize: 5, idleTimeout: 600000 },
            cold: { minIdle: 0, maxSize: 3, idleTimeout: 1800000 },
            ondemand: { maxConcurrent: 10 },
            ...config,
        };
        for (const tier of ['hot', 'warm', 'cold', 'ondemand']) {
            this.pools.set(tier, []);
        }
    }
    /**
     * 分析并执行任务
     */
    async executeTask(task, options = {}) {
        const complexity = this.analyzer.analyze(task, options.historyLength || 0);
        const tier = options.preferredTier || complexity.recommendedTier;
        const pooledTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            description: task,
            complexity,
            status: 'pending',
        };
        this.taskHistory.set(pooledTask.id, pooledTask);
        this.pools.get(tier).push(pooledTask);
        // 记录开始时间
        const startTime = Date.now();
        try {
            pooledTask.status = 'running';
            // 调用 sessions_spawn 执行任务
            const result = await this.executeWithSpawn(task, {
                tier,
                agentId: options.agentId,
                complexity,
            });
            pooledTask.result = result;
            pooledTask.status = 'completed';
            return { task: pooledTask, complexity };
        }
        catch (error) {
            pooledTask.status = 'failed';
            throw error;
        }
    }
    /**
     * 使用 sessions_spawn 执行任务
     */
    async executeWithSpawn(task, options) {
        // 构建角色提示
        const rolePrompt = this.buildRolePrompt(task, options.complexity);
        // 使用 sessions_spawn
        const spawnOptions = {
            task: rolePrompt,
            mode: options.complexity.requiresContext ? 'session' : 'run',
            runtime: 'subagent',
        };
        if (options.agentId) {
            spawnOptions.agentId = options.agentId;
        }
        // 调用 sessions_spawn
        const result = await sessions_spawn(spawnOptions);
        return result;
    }
    /**
     * 构建角色提示词
     */
    buildRolePrompt(task, complexity) {
        const baseRole = complexity.specialistType
            ? this.getRoleInstructions(complexity.specialistType)
            : this.getDefaultRoleInstructions();
        return `${baseRole}

任务: ${task}

${complexity.requiresContext ? '注意: 这是一个需要上下文理解的任务，请参考之前的对话历史。' : ''}
${complexity.requiresMultiStep ? '注意: 这是一个多步骤任务，请分步执行并汇报进度。' : ''}

复杂度评估: ${complexity.score}/100
推荐策略: ${complexity.recommendedTier} 池`;
    }
    getRoleInstructions(role) {
        const roles = {
            coder: `你是一个资深后端开发工程师，专注于编写高质量代码。
专长: Java, Go, Python, Spring Boot, 数据库设计
原则: 代码简洁、遵循SOLID、注重错误处理`,
            reviewer: `你是一个代码审查专家，注重代码质量、安全性和性能。
审查重点: 代码质量、安全漏洞、性能问题
输出格式: 严重问题 / 建议改进 / 优点`,
            researcher: `你是一个研究助手，擅长信息检索、文档分析和总结。
能力: 快速理解新领域、结构化整理、对比分析
输出格式: 概述 / 核心发现 / 方案对比 / 建议`,
            devops: `你是一个DevOps工程师，精通CI/CD、容器化和自动化运维。
专长: Docker, Kubernetes, CI/CD, 监控
原则: 基础设施即代码、自动化优先`,
            qa: `你是一个QA专家，负责测试策略和自动化测试。
能力: 测试策略、单元测试、性能测试
原则: 测试覆盖率优先、自动化回归测试`,
        };
        return roles[role] || this.getDefaultRoleInstructions();
    }
    getDefaultRoleInstructions() {
        return `你是一个专业、有帮助的AI助手。专注于解决用户问题，提供清晰、可操作的建议。`;
    }
    /**
     * 批量执行任务
     */
    async executeBatch(tasks, options = {}) {
        const maxConcurrency = options.maxConcurrency || 5;
        if (options.parallel) {
            // 并行执行
            const chunks = [];
            for (let i = 0; i < tasks.length; i += maxConcurrency) {
                chunks.push(tasks.slice(i, i + maxConcurrency));
            }
            const results = [];
            for (const chunk of chunks) {
                const chunkResults = await Promise.all(chunk.map(task => this.executeTask(task)));
                results.push(...chunkResults);
            }
            return results;
        }
        else {
            // 串行执行
            return Promise.all(tasks.map(task => this.executeTask(task)));
        }
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return this.stats;
    }
    /**
     * 获取任务历史
     */
    getTaskHistory(taskId) {
        if (taskId) {
            return this.taskHistory.get(taskId);
        }
        return this.taskHistory;
    }
}
// ============================================================================
// 导出
// ============================================================================
export { AgentPoolManager, TaskAnalyzer };
//# sourceMappingURL=agent-pool-integration.js.map