# Claude Code 记忆系统分析 - OpenClaw 集成方案 (续)

> 基于 Claude Code 源码分析，提取记忆系统架构、设计原理及 OpenClaw 集成方案
>
> 续篇：团队记忆安全机制、会话记忆模板、自动保存机制

---

## 一、团队记忆 (Team Memory) 详解

### 1.1 团队记忆架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     记忆目录结构                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  memory/                          # 根目录                         │
│  ├── MEMORY.md                   # 私人记忆入口                   │
│  ├── user/                       # 私人记忆                       │
│  │   ├── MEMORY.md               # 索引文件                       │
│  │   ├── user-preference.md      # 用户偏好                       │
│  │   └── ...                                            │
│  └── team/                       # 团队共享记忆                   │
│      ├── MEMORY.md               # 团队索引                       │
│      ├── project-info.md         # 项目信息                       │
│      └── ...                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 安全机制 (Path Traversal 防护)

Claude Code 实现了多层次的路径安全验证：

```typescript
// teamMemPaths.ts - 核心安全函数

/**
 * 1. URL 编码路径穿越检测
 * 防止 %2e%2e%2f = ../ 的攻击
 */
function sanitizePathKey(key: string): string {
  // 检测 null byte
  if (key.includes('\0')) {
    throw new PathTraversalError(`Null byte in path key`)
  }
  
  // 检测 URL 编码的路径穿越
  let decoded = decodeURIComponent(key)
  if (decoded.includes('..') || decoded.includes('/')) {
    throw new PathTraversalError(`URL-encoded traversal`)
  }
  
  // 检测 Unicode 规范化攻击 (． = .)
  const normalized = key.normalize('NFKC')
  if (normalized.includes('..')) {
    throw new PathTraversalError(`Unicode-normalized traversal`)
  }
  
  // 拒绝反斜杠
  if (key.includes('\\')) {
    throw new PathTraversalError(`Backslash in path key`)
  }
  
  // 拒绝绝对路径
  if (key.startsWith('/')) {
    throw new PathTraversalError(`Absolute path key`)
  }
  
  return key
}

/**
 * 2. Symlink 逃逸检测
 * 确保通过 symlink 无法写到团队记忆目录外
 */
async function validateTeamMemWritePath(filePath: string): Promise<string> {
  // 第一遍：快速字符串级别检查
  const resolvedPath = resolve(filePath)
  if (!resolvedPath.startsWith(teamDir)) {
    throw new PathTraversalError(`Path escapes team memory`)
  }
  
  // 第二遍：解析 symlink 并验证真实路径
  const realPath = await realpathDeepestExisting(resolvedPath)
  if (!await isRealPathWithinTeamDir(realPath)) {
    throw new PathTraversalError(`Path escapes via symlink`)
  }
  
  return resolvedPath
}

/**
 * 3. 深度优先遍历直到找到真实存在的目录
 * 处理尚未创建的文件的路径验证
 */
async function realpathDeepestExisting(absolutePath: string): Promise<string> {
  // 逐层向上查找真实路径
  // 检测：
  // - 悬挂 symlink (目标不存在)
  // - Symlink 循环
  // - 路径遍历
}
```

### 1.3 团队记忆索引文件

```markdown
# MEMORY.md (团队索引示例)

<!-- 注意：这是索引文件，不是内容文件 -->

- [项目架构决策](architecture-decisions.md) — 2024年Q1关键决策
- [测试策略](testing-policy.md) — 必须使用真实数据库
- [Linear 项目 INGEST](linear-ingest.md) — pipeline bugs 追踪
- [API 延迟看板](grafana-api-latency.md) — oncall 监控面板
```

**索引格式规则**：
- 每行一个条目
- 格式：`- [标题](文件名.md) — 简短描述`
- 每行不超过 150 字符
- 超过 100 行会被截断

---

## 二、会话记忆 (Session Memory) 详解

### 2.1 会话记忆模板结构

Claude Code 的会话记忆使用结构化模板：

```markdown
---
name: current-session
description: Current conversation summary
type: session
---

# Session Title
_一个简短独特的 5-10 词描述性标题。信息密集，无填充词。_

# Current State
_当前正在积极做什么？尚未完成的待处理任务。下一步立即步骤。_

# Task specification
_用户要求构建什么？任何设计决策或其他解释性上下文。_

# Files and Functions
_重要的文件有哪些？简而言之，它们包含什么，为什么相关？_

# Workflow
_通常按什么顺序运行什么 bash 命令？如何解释它们的输出（如果不明显）？_

# Errors & Corrections
_遇到的错误以及如何修复。用户纠正了什么？哪些方法失败了，不应再试？_

# Codebase and System Documentation
_重要的系统组件有哪些？它们如何工作/组合在一起？_

# Learnings
_什么效果好？什么不好？避免什么？不要复制其他部分的项目。_

# Key results
_如果用户要求特定的输出，如问题的答案、表或其他文档，在此重复完整结果。_

# Worklog
_一步一步地，尝试了什么，做了什么？每一步简短的总结。_
```

### 2.2 提取触发条件详解

```typescript
interface SessionMemoryConfig {
  minimumMessageTokensToInit: number      // 默认: ~1000 tokens
  minimumTokensBetweenUpdate: number    // 默认: ~2000 tokens  
  toolCallsBetweenUpdates: number       // 默认: 10 次
}

// 触发逻辑
function shouldExtract(messages: Message[]): boolean {
  const tokenCount = tokenCountWithEstimation(messages)
  
  // 条件1: 达到初始化阈值
  if (!isInitialized()) {
    if (tokenCount < minimumMessageTokensToInit) {
      return false  // 太短，不提取
    }
    markInitialized()
  }
  
  // 条件2: Token 增长阈值 (必须)
  const tokenGrowth = tokenCount - lastExtractionTokens
  const hasMetTokenThreshold = tokenGrowth >= minimumTokensBetweenUpdate
  
  // 条件3: 工具调用次数阈值
  const toolCallsSinceLastUpdate = countToolCallsSince(...)
  const hasMetToolCallThreshold = toolCallsSinceLastUpdate >= toolCallsBetweenUpdates
  
  // 条件4: 最后一条消息是否包含工具调用
  const lastTurnHasToolCalls = checkLastTurnHasToolCalls(messages)
  
  // 触发时机：
  // 1. Token 阈值 + 工具调用阈值 都满足
  // 2. OR Token 阈值满足 + 最后无工具调用 (自然对话间隙)
  return (
    (hasMetTokenThreshold && hasMetToolCallThreshold) ||
    (hasMetTokenThreshold && !lastTurnHasToolCalls)
  )
}
```

### 2.3 更新提示词策略

```typescript
const UPDATE_PROMPT_TEMPLATE = `
Based on the user conversation above, update the session notes file.

CRITICAL RULES FOR EDITING:
- 保持文件结构完整，保留所有章节标题和斜体描述
- NEVER 修改、删除或添加章节标题
- NEVER 修改斜体描述行（这些是模板指令）
- 只更新斜体描述下面的实际内容
- 使用 Edit 工具并行更新多个章节
- 每个章节控制在 ~2000 tokens 以内
- 如果超过总 token 上限 (~12000)，必须压缩

SECTION STRUCTURE:
1. # Session Title - 5-10 词标题
2. # Current State - 当前工作状态
3. # Task specification - 任务规格
4. # Files and Functions - 重要文件和函数
5. # Workflow - 工作流程
6. # Errors & Corrections - 错误和纠正
7. # Codebase and System Documentation - 代码库文档
8. # Learnings - 经验教训
9. # Key results - 关键结果
10. # Worklog - 工作日志
`
```

### 2.4 记忆新鲜度管理

```typescript
// 追踪最后提取的信息
interface ExtractionState {
  lastExtractionTokens: number
  lastExtractionMessageId: string | null
  initialized: boolean
}

// 在上下文压缩后更新状态
function updateLastSummarizedMessageIdIfSafe(messages: Message[]): void {
  // 只有在最后一条消息不包含工具调用时才更新
  // 避免截断工具结果
  if (!hasToolCallsInLastAssistantTurn(messages)) {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.uuid) {
      setLastSummarizedMessageId(lastMessage.uuid)
    }
  }
}
```

---

## 三、自动记忆机制

### 3.1 何时保存记忆

```typescript
// TYPES_SECTION 中的保存时机定义

const WHEN_TO_SAVE = {
  user: `
    when_to_save: 当了解到用户的角色、偏好、职责或知识的任何细节时
    how_to_use: 当工作应该基于用户的个人资料或视角时
  `,
  
  feedback: `
    when_to_save: 
      - 用户纠正方法时 ("no not that", "don't", "stop doing X")
      - 用户确认方法有效时 ("yes exactly", "perfect, keep doing that")
    how_to_use: 让这些记忆指导行为，用户不需要重复同样的指导
    body_structure: 
      - 先写规则本身
      - 然后 **Why:** (用户给出的原因)
      - 然后 **How to apply:** (何时应用)
  `,
  
  project: `
    when_to_save: 当了解到谁在做什么、为什么、什么时候
    how_to_use: 理解用户请求的细节和背景，做出更好的建议
    注意: 将用户消息中的相对日期转换为绝对日期
  `,
  
  reference: `
    when_to_save: 当了解到外部系统的资源及其用途时
    how_to_use: 当用户引用外部系统或可能在外部系统中的信息时
  `
}
```

### 3.2 不应保存的内容

```typescript
const WHAT_NOT_TO_SAVE = `
## What NOT to save in memory

- 代码模式、架构、文件路径 — 可以从当前项目状态派生
- Git 历史、最近的更改 — git log / git blame 是权威来源
- 调试解决方案 — 修复方案在代码中
- CLAUDE.md 已记录的内容
- 临时任务细节

这些排除甚至适用于用户明确要求保存时。
如果他们要求保存 PR 列表或活动摘要，
询问什么是值得保留的"令人惊讶"或"非显而易见"的部分。
`
```

### 3.3 记忆检索策略

```typescript
// findRelevantMemories.ts

const SELECT_MEMORIES_SYSTEM_PROMPT = `
You are selecting memories that will be useful as it processes a user's query.

Return up to 5 filenames for memories that will clearly be useful.
- Only include memories you are CERTAIN will be helpful
- If unsure, do NOT include it
- If no memories would be helpful, return empty array
- Recently used tools are provided to avoid selecting tool documentation

Output format:
{ "selected_memories": ["filename1.md", "filename2.md"] }
`

async function findRelevantMemories(
  query: string,
  memoryDir: string,
  signal: AbortSignal,
  recentTools: string[] = [],
  alreadySurfaced: Set<string> = new Set()
): Promise<RelevantMemory[]> {
  // 1. 扫描记忆目录
  const memories = await scanMemoryFiles(memoryDir, signal)
  
  // 2. 过滤已显示的记忆
  const candidates = memories.filter(m => !alreadySurfaced.has(m.filePath))
  
  // 3. 使用 AI 选择最相关的记忆
  const selected = await selectRelevantMemories(query, candidates, recentTools)
  
  // 4. 返回带时间戳的结果
  return selected.map(m => ({
    path: m.filePath,
    mtimeMs: m.mtimeMs
  }))
}
```

---

## 四、OpenClaw 集成 - 安全实现

### 4.1 安全路径验证

```typescript
// openclaw-memory/src/security.ts

import * as path from 'path'
import * as fs from 'fs/promises'

export class PathTraversalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PathTraversalError'
  }
}

export async function validateMemoryPath(
  baseDir: string,
  filePath: string
): Promise<string> {
  // 1. 检查 null byte
  if (filePath.includes('\0')) {
    throw new PathTraversalError('Null byte in path')
  }
  
  // 2. 解析路径并验证前缀
  const resolved = path.resolve(baseDir, filePath)
  if (!resolved.startsWith(baseDir)) {
    throw new PathTraversalError('Path escapes memory directory')
  }
  
  // 3. 检查 symlink 逃逸
  const realPath = await resolveSymlinks(resolved)
  if (!realPath.startsWith(baseDir)) {
    throw new PathTraversalError('Path escapes via symlink')
  }
  
  return resolved
}

async function resolveSymlinks(p: string): Promise<string> {
  try {
    return await fs.realpath(p)
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      // 文件不存在，向上遍历到真实存在的父目录
      return resolveSymlinks(path.dirname(p))
    }
    throw e
  }
}
```

### 4.2 记忆选择器

```typescript
// openclaw-memory/src/MemorySelector.ts

export class MemorySelector {
  async select(
    query: string,
    memories: MemoryHeader[],
    options: { maxResults?: number; recentTools?: string[] } = {}
  ): Promise<MemoryHeader[]> {
    const { maxResults = 5, recentTools = [] } = options
    
    // 构建 manifest
    const manifest = this.formatManifest(memories)
    const toolsSection = recentTools.length > 0
      ? `\n\nRecently used tools: ${recentTools.join(', ')}`
      : ''
    
    // 调用模型选择
    const response = await this.callModel({
      prompt: `Query: ${query}\n\nAvailable memories:\n${manifest}${toolsSection}`,
      schema: {
        type: 'object',
        properties: {
          selected_memories: { type: 'array', items: { type: 'string' } }
        }
      }
    })
    
    // 过滤有效结果
    const validFilenames = new Set(memories.map(m => m.filename))
    const selected = response.selected_memories
      .filter((f: string) => validFilenames.has(f))
      .slice(0, maxResults)
    
    return selected.map((f: string) => memories.find(m => m.filename === f)!)
  }
}
```

### 4.3 会话记忆管理器

```typescript
// openclaw-memory/src/SessionMemoryManager.ts

export class SessionMemoryManager {
  private config: SessionMemoryConfig
  private state: SessionMemoryState
  private sessionFile: string
  
  constructor(
    config: Partial<SessionMemoryConfig> = {},
    sessionDir: string = './.session-memory'
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionFile = path.join(sessionDir, 'current.md')
  }
  
  shouldExtract(messages: Message[]): boolean {
    if (!this.config.enabled) return false
    
    const tokenCount = this.estimateTokens(messages)
    
    // 检查初始化
    if (!this.state.initialized) {
      if (tokenCount < this.config.minimumMessageTokensToInit) {
        return false
      }
      this.state.initialized = true
    }
    
    // Token 增长检查
    const tokenGrowth = tokenCount - this.state.lastExtractionTokens
    const hasMetTokenThreshold = tokenGrowth >= this.config.minimumTokensBetweenUpdate
    
    // 工具调用次数检查
    const toolCalls = this.countToolCallsSince(messages)
    const hasMetToolCallThreshold = toolCalls >= this.config.toolCallsBetweenUpdates
    
    // 最后回复无工具调用（自然间隙）
    const lastTurnClean = !this.hasToolCallsInLastTurn(messages)
    
    return (
      (hasMetTokenThreshold && hasMetToolCallThreshold) ||
      (hasMetTokenThreshold && lastTurnClean)
    )
  }
  
  async extract(messages: Message[]): Promise<void> {
    // 1. 读取当前记忆
    const currentMemory = await this.readCurrentMemory()
    
    // 2. 构建提取提示
    const prompt = await this.buildExtractionPrompt(currentMemory, messages)
    
    // 3. 使用子代理提取（隔离上下文）
    const summary = await this.runExtractionAgent(prompt)
    
    // 4. 更新状态
    this.state.lastExtractionTokens = this.estimateTokens(messages)
    this.state.lastExtractionMessageId = messages.at(-1)?.id ?? null
    
    // 5. 保存到文件
    await this.saveMemory(summary)
  }
  
  private async runExtractionAgent(prompt: string): Promise<string> {
    // TODO: 实现子代理调用
    throw new Error('Not implemented')
  }
}
```

### 4.4 记忆文件格式

```typescript
// frontmatter.ts

export interface MemoryFrontmatter {
  name: string
  description: string
  type: 'user' | 'feedback' | 'project' | 'reference'
  scope?: 'private' | 'team'
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export function parseFrontmatter(content: string): {
  frontmatter: MemoryFrontmatter
  body: string
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {} as MemoryFrontmatter, body: content }
  }
  
  const [, frontmatterStr, body] = match
  const frontmatter = parseYaml(frontmatterStr)
  
  return { frontmatter, body }
}

export function serializeMemory(
  memory: MemoryFrontmatter & { content: string }
): string {
  const yaml = stringifyYaml({
    name: memory.name,
    description: memory.description,
    type: memory.type,
    scope: memory.scope,
    tags: memory.tags,
    createdAt: memory.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  
  return `---\n${yaml}---\n\n${memory.content}\n`
}
```

---

## 五、配置选项

### 5.1 OpenClaw 记忆配置

```yaml
# config.yaml
memory:
  enabled: true
  directory: ./memory
  
  # 自动记忆
  autoMemory:
    enabled: true
    
  # 团队记忆
  teamMemory:
    enabled: true
    syncOnStart: true  # 会话开始时同步团队记忆
  
  # 会话记忆
  sessionMemory:
    enabled: true
    minimumMessageTokensToInit: 1000
    minimumTokensBetweenUpdate: 2000
    toolCallsBetweenUpdates: 10
  
  # AI 检索
  aiSelection:
    enabled: true
    maxResults: 5
  
  # 安全
  security:
    validatePaths: true
    maxFileSize: "1MB"
    maxFiles: 200
```

### 5.2 目录结构

```
memory/
├── .session-memory/           # 会话记忆
│   └── current.md            # 当前会话摘要
├── user/                     # 私人记忆
│   ├── MEMORY.md             # 索引
│   ├── user-role.md
│   └── preferences.md
└── team/                     # 团队记忆
    ├── MEMORY.md             # 索引
    ├── project-info.md
    └── external-refs.md
```

---

## 六、实现路线图

### Phase 1: 基础记忆存储 (1周)
- [ ] MemoryStore 实现
- [ ] Frontmatter 解析
- [ ] 基础 CRUD 操作

### Phase 2: AI 检索 (1周)
- [ ] MemorySelector 实现
- [ ] 集成到系统提示
- [ ] 相关性测试

### Phase 3: 会话记忆 (1周)
- [ ] SessionMemoryManager 实现
- [ ] 阈值触发机制
- [ ] 自动摘要模板

### Phase 4: 团队记忆 (1周)
- [ ] TeamMemory 实现
- [ ] 安全路径验证
- [ ] 同步机制

### Phase 5: 安全审计 (1周)
- [ ] Path traversal 测试
- [ ] Symlink 攻击测试
- [ ] 性能基准测试
