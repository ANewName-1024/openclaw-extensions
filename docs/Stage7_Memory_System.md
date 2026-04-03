# Claude Code 记忆系统分析 - OpenClaw 集成方案

> 基于 Claude Code 源码分析，提取记忆系统架构、设计原理及 OpenClaw 集成方案

---

## 一、记忆系统概述

Claude Code 的记忆系统是其核心能力之一，能够跨会话保持上下文连贯性。系统设计精巧，分为多种记忆类型，支持智能检索和自动更新。

### 1.1 核心特性

| 特性 | 说明 |
|------|------|
| **持久化记忆** | 存储在 Markdown 文件中，支持版本控制 |
| **类型分类** | 四种记忆类型：user, feedback, project, reference |
| **智能检索** | 基于 AI 的相关性选择，只加载相关的记忆 |
| **会话记忆** | 自动总结当前对话的关键信息 |
| **团队共享** | 支持 private 和 team 两种作用域 |

---

## 二、记忆类型详解

### 2.1 四种记忆类型

```
┌─────────────────────────────────────────────────────────────┐
│                    记忆类型架构                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  user (用户)         ── 用户角色、偏好、知识背景              │
│       │                                                        │
│       │  scope: always private                                │
│       │  用途: 定制化回复，适应用户风格                         │
│                                                             │
│  feedback (反馈)     ── 用户指导、纠正、确认                   │
│       │                                                        │
│       │  scope: private/team                                  │
│       │  用途: 记住用户偏好，避免重复纠正                        │
│                                                             │
│  project (项目)      ── 项目状态、目标、截止日期                │
│       │                                                        │
│       │  scope: private/team (倾向 team)                       │
│       │  用途: 了解项目背景上下文                               │
│                                                             │
│  reference (参考)   ── 外部系统指针、文档位置                   │
│       │                                                        │
│       │  scope: usually team                                   │
│       │  用途: 记住去哪里找信息                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 记忆文件格式

```markdown
---
name: user-preference-verbose-output
description: User prefers detailed explanations with examples
type: user
---

## 用户偏好

用户是一位高级后端工程师，喜欢了解技术细节。

**Why:** 用户多次要求展示具体实现代码
**How to apply:** 回复中包含代码示例和详细解释
```

### 2.3 不应保存的内容

Claude Code 明确指出以下内容**不应**存入记忆：

- ❌ 代码模式、架构、文件路径（可从代码派生）
- ❌ Git 历史（`git log` 是权威来源）
- ❌ 调试方案（修复方案在代码中）
- ❌ CLAUDE.md 已记录的内容
- ❌ 临时任务细节

---

## 三、核心技术实现

### 3.1 记忆目录结构

```
memory/
├── MEMORY.md              # 主记忆文件（自动加载到系统提示）
├── user/                  # 用户类型记忆
│   ├── user-role.md
│   └── user-preferences.md
├── feedback/              # 反馈类型记忆
│   ├── coding-style.md
│   └── communication.md
├── project/               # 项目类型记忆
│   └── current-sprint.md
└── reference/             # 参考类型记忆
    └── linear-bugs.md
```

### 3.2 记忆扫描 (Memory Scan)

```typescript
// src/memdir/memoryScan.ts

interface MemoryHeader {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  type: MemoryType | undefined
}

// 扫描记忆目录，读取 frontmatter 头信息
async function scanMemoryFiles(
  memoryDir: string,
  signal: AbortSignal,
): Promise<MemoryHeader[]>
```

**关键特性**：
- 单次遍历：stat → read → sort（减少系统调用）
- 最多 200 个记忆文件
- 按修改时间排序（最新优先）

### 3.3 智能检索 (Relevance Selection)

```typescript
// src/memdir/findRelevantMemories.ts

// 使用 Sonnet 模型选择最相关的记忆
async function selectRelevantMemories(
  query: string,
  memories: MemoryHeader[],
): Promise<string[]>
```

**选择提示词**：
```
You are selecting memories that will be useful to Claude Code as it processes a user's query.
Return a list of filenames for the memories that will clearly be useful (up to 5).
Only include memories that you are certain will be helpful.
```

### 3.4 会话记忆 (Session Memory)

会话记忆是 Claude Code 自动总结当前对话的机制：

```typescript
// src/services/SessionMemory/sessionMemory.ts

interface SessionMemoryConfig {
  minimumMessageTokensToInit: number      // 初始化阈值
  minimumTokensBetweenUpdate: number      // 更新间隔
  toolCallsBetweenUpdates: number         // 工具调用次数间隔
}
```

**触发条件**：
1. Token 阈值满足 AND 工具调用次数满足
2. OR Token 阈值满足 AND 最后一次回复无工具调用（自然对话间隙）

**工作流程**：
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   对话      │ ──→ │  检查阈值   │ ──→ │  触发提取   │
│  (Messages) │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  更新成功   │ ←── │  写入文件   │ ←── │  提取摘要   │
│             │     │             │     │ (forked)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 四、OpenClaw 集成方案

### 4.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Memory System                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐ │
│  │   Memory    │ ←── │   Memory    │ ←── │   Session   │ │
│  │   Types     │     │   Store     │     │   Manager   │ │
│  └─────────────┘     └─────────────┘     └─────────────┘ │
│         │                   │                   │         │
│         ▼                   ▼                   ▼         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              File System (Markdown)                   │  │
│  │   memory/user/  memory/feedback/  memory/project/    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Vector Search (Optional)                  │  │
│  │              Semantic Relevance Matching              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 模块结构

```
src/
├── memory/
│   ├── index.ts                 # 导出入口
│   ├── types.ts                 # 类型定义
│   ├── MemoryStore.ts           # 记忆存储管理
│   ├── MemoryScanner.ts         # 记忆扫描
│   ├── MemorySelector.ts        # 记忆选择器
│   ├── SessionMemory.ts         # 会话记忆
│   ├── TeamMemory.ts            # 团队记忆
│   ├── prompts.ts               # 提示词模板
│   └── utils.ts                 # 工具函数
└── commands/
    └── memory/
        ├── memory.tsx           # /memory 命令
        └── memorylist.tsx       # /memory-list 命令
```

### 4.3 核心类型定义

```typescript
// src/memory/types.ts

export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'] as const

export type MemoryType = (typeof MEMORY_TYPES)[number]

export interface Memory {
  name: string
  description: string
  type: MemoryType
  content: string
  createdAt: Date
  updatedAt: Date
  scope: 'private' | 'team'
  tags?: string[]
}

export interface MemoryHeader {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  type: MemoryType | undefined
  scope?: 'private' | 'team'
}

export interface MemorySearchResult {
  memories: Memory[]
  relevanceScores: Map<string, number>
}
```

### 4.4 记忆存储 (MemoryStore)

```typescript
// src/memory/MemoryStore.ts

import * as fs from 'fs/promises'
import * as path from 'path'
import { parseFrontmatter, stringifyFrontmatter } from '../utils/frontmatter'

export class MemoryStore {
  private memoryDir: string

  constructor(memoryDir: string = './memory') {
    this.memoryDir = memoryDir
  }

  async save(memory: Memory): Promise<void> {
    const filename = this.generateFilename(memory.name)
    const filepath = path.join(this.memoryDir, memory.type, filename)
    const content = this.serialize(memory)
    await fs.writeFile(filepath, content, 'utf-8')
  }

  async load(name: string, type: MemoryType): Promise<Memory | null> {
    const filepath = path.join(this.memoryDir, type, `${name}.md`)
    const content = await fs.readFile(filepath, 'utf-8')
    return this.deserialize(content)
  }

  async delete(name: string, type: MemoryType): Promise<void> {
    const filepath = path.join(this.memoryDir, type, `${name}.md`)
    await fs.unlink(filepath)
  }

  async list(type?: MemoryType): Promise<MemoryHeader[]> {
    // 扫描目录，返回记忆头信息列表
  }

  private serialize(memory: Memory): string {
    const frontmatter = {
      name: memory.name,
      description: memory.description,
      type: memory.type,
      scope: memory.scope,
      tags: memory.tags,
    }
    return stringifyFrontmatter(frontmatter, memory.content)
  }

  private deserialize(content: string): Memory {
    const { frontmatter, body } = parseFrontmatter(content)
    return {
      ...frontmatter,
      content: body,
    } as Memory
  }
}
```

### 4.5 记忆选择器 (MemorySelector)

```typescript
// src/memory/MemorySelector.ts

import { MemoryHeader } from './types'

const SELECT_MEMORIES_PROMPT = `You are selecting memories that will be useful.

Return a JSON object with a "selected_memories" array containing filenames.
Only include memories that will clearly be helpful (max 5).`

export class MemorySelector {
  private model: Model

  async select(
    query: string,
    memories: MemoryHeader[],
    options?: { maxResults?: number }
  ): Promise<string[]> {
    const manifest = this.formatManifest(memories)

    const response = await this.model.complete({
      prompt: `Query: ${query}\n\nAvailable memories:\n${manifest}`,
      schema: {
        type: 'object',
        properties: {
          selected_memories: { type: 'array', items: { type: 'string' } }
        }
      }
    })

    return response.selected_memories
  }

  private formatManifest(memories: MemoryHeader[]): string {
    return memories
      .map(m => {
        const tag = m.type ? `[${m.type}] ` : ''
        const desc = m.description ? `: ${m.description}` : ''
        return `- ${tag}${m.filename}${desc}`
      })
      .join('\n')
  }
}
```

### 4.6 会话记忆 (SessionMemory)

```typescript
// src/memory/SessionMemory.ts

import { Message } from '../types'

export interface SessionMemoryConfig {
  minimumMessageTokensToInit: number      // 默认 1000
  minimumTokensBetweenUpdate: number      // 默认 2000
  toolCallsBetweenUpdates: number         // 默认 10
}

export class SessionMemoryManager {
  private config: SessionMemoryConfig
  private lastExtractionId: string | null = null

  constructor(config: Partial<SessionMemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  shouldExtract(messages: Message[]): boolean {
    const tokenCount = this.estimateTokens(messages)

    // 检查初始化阈值
    if (!this.isInitialized()) {
      if (tokenCount < this.config.minimumMessageTokensToInit) {
        return false
      }
      this.markInitialized()
    }

    // 检查更新阈值
    const hasMetTokenThreshold =
      tokenCount - this.lastExtractionTokens >=
      this.config.minimumTokensBetweenUpdate

    const hasMetToolCallThreshold =
      this.countToolCallsSince(this.lastExtractionId) >=
      this.config.toolCallsBetweenUpdates

    const lastTurnHasToolCalls = this.checkLastTurn(messages)

    return (
      (hasMetTokenThreshold && hasMetToolCallThreshold) ||
      (hasMetTokenThreshold && !lastTurnHasToolCalls)
    )
  }

  async extract(messages: Message[]): Promise<string> {
    // 使用子代理提取摘要
    const summary = await this.runExtractionAgent(messages)
    await this.saveToFile(summary)
    return summary
  }
}
```

---

## 五、OpenClaw 配置

### 5.1 配置文件

```yaml
# config.yaml
memory:
  enabled: true
  directory: ./memory          # 记忆存储目录
  maxFiles: 200               # 最大记忆文件数

  types:
    user:
      scope: private           # 用户记忆总是私有的
    feedback:
      scope: both             # 支持 private 和 team
    project:
      scope: both
    reference:
      scope: team             # 参考通常团队共享

  session:
    enabled: true
    minimumTokensToInit: 1000
    minimumTokensBetweenUpdate: 2000
    toolCallsBetweenUpdates: 10

  search:
    enabled: true             # 启用 AI 记忆选择
    maxResults: 5             # 最多加载 5 个记忆

  vector:
    enabled: false            # 可选：启用向量搜索
    provider: openai          # 向量搜索 provider
```

### 5.2 目录结构

```
memory/
├── MEMORY.md                 # 主记忆文件
├── user/                    # 用户记忆 (private)
│   └── .gitkeep
├── feedback/                # 反馈记忆 (private/team)
│   └── .gitkeep
├── project/                 # 项目记忆 (team)
│   └── .gitkeep
└── reference/               # 参考记忆 (team)
    └── .gitkeep
```

---

## 六、命令接口

### 6.1 /memory 命令

```
/memory save <type> <name> <description>
  保存新记忆

/memory list [type]
  列出记忆

/memory search <query>
  搜索相关记忆

/memory read <name> [type]
  读取特定记忆

/memory delete <name> [type]
  删除记忆

/memory clear [type]
  清除记忆
```

### 6.2 自动记忆触发

当检测到以下情况时，自动提示保存记忆：

| 场景 | 记忆类型 | 提示 |
|------|----------|------|
| 用户说明角色/偏好 | user | "是否保存此偏好设置？" |
| 用户纠正/确认方法 | feedback | "是否保存此反馈？" |
| 用户提到项目状态 | project | "是否保存此项目信息？" |
| 用户提到外部系统 | reference | "是否保存此参考信息？" |

---

## 七、集成步骤

### 7.1 第一阶段：基础记忆系统

```typescript
// 1. 创建记忆模块
mkdir -p /root/.openclaw/extensions/memory

// 2. 实现 MemoryStore
// src/memory/MemoryStore.ts

// 3. 实现类型定义
// src/memory/types.ts

// 4. 配置 OpenClaw
// config.yaml 添加 memory 配置
```

### 7.2 第二阶段：智能检索

```typescript
// 5. 实现 MemorySelector
// src/memory/MemorySelector.ts

// 6. 集成到系统提示
// 在系统提示中添加记忆加载逻辑
```

### 7.3 第三阶段：会话记忆

```typescript
// 7. 实现 SessionMemoryManager
// src/memory/SessionMemory.ts

// 8. 添加阈值检查钩子
// 在消息处理流程中检查是否需要提取
```

### 7.4 第四阶段：团队记忆

```typescript
// 9. 实现 TeamMemory
// src/memory/TeamMemory.ts

// 10. 添加权限控制
// private vs team 作用域处理
```

---

## 八、关键技术点

### 8.1 Frontmatter 解析

```typescript
// utils/frontmatter.ts

export function parseFrontmatter(
  content: string
): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: content }

  const [, frontmatterStr, body] = match
  const frontmatter = yaml.parse(frontmatterStr)
  return { frontmatter, body }
}

export function stringifyFrontmatter(
  frontmatter: Record<string, any>,
  body: string
): string {
  const yamlStr = yaml.stringify(frontmatter)
  return `---\n${yamlStr}---\n\n${body}\n`
}
```

### 8.2 记忆新鲜度检查

```typescript
// 检查记忆是否过期
async function isMemoryStale(memoryPath: string, maxAge: number): Promise<boolean> {
  const stat = await fs.stat(memoryPath)
  const age = Date.now() - stat.mtimeMs
  return age > maxAge
}
```

### 8.3 记忆去重

```typescript
// 检查相似记忆
async function findSimilarMemories(
  newMemory: Memory,
  existingMemories: Memory[]
): Promise<Memory[]> {
  // 使用 embedding 相似度检查
  const newEmbedding = await embed(newMemory.content)
  return existingMemories
    .map(m => ({
      memory: m,
      similarity: cosineSimilarity(newEmbedding, m.embedding)
    }))
    .filter(r => r.similarity > 0.9)
}
```

---

## 九、测试计划

| 测试用例 | 预期结果 |
|----------|----------|
| 保存 user 类型记忆 | 文件创建成功 |
| 列出所有记忆 | 返回按类型分组的列表 |
| AI 选择相关记忆 | 返回最相关的 5 个 |
| 会话记忆自动提取 | Token 达到阈值后触发 |
| 团队 vs 私人记忆隔离 | 私人记忆不可见 |

---

## 十、已知限制与注意事项

1. **记忆文件上限**：最多 200 个记忆文件
2. **token 预算**：记忆内容占用上下文窗口
3. **新鲜度**：记忆可能过期，需要定期清理
4. **作用域**：private vs team 需要明确区分
5. **安全**：记忆文件权限设置为 600
