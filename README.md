# OpenClaw Extensions

基于 Claude Code 源码分析提取的 OpenClaw 扩展能力模块，统一集成了记忆系统、工具系统、MCP 客户端等企业级功能。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📦 模块总览

| 模块 | 说明 | 优先级 |
|------|------|--------|
| [记忆系统](#记忆系统) | 持久化、会话、团队记忆 | ⭐⭐⭐ |
| [工具系统](#工具系统) | 安全命令执行、文件操作 | ⭐⭐⭐ |
| [MCP 客户端](#mcp-客户端) | 原生 MCP 协议支持 | ⭐⭐⭐ |
| [权限系统](#权限系统) | 细粒度权限控制 | ⭐⭐⭐ |
| [任务协调器](#任务协调器) | 多任务协调执行 | ⭐⭐ |
| [安全模块](#安全模块) | 路径验证、输入清理 | ⭐⭐⭐ |

---

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/ANewName-1024/openclaw-extensions.git
cd openclaw-extensions

# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test
```

---

## 📚 记忆系统

完整的企业级记忆系统，支持持久化、会话、团队记忆。

### 核心模块

| 模块 | 文件 | 说明 |
|------|------|------|
| MemoryStore | `src/store/MemoryStore.ts` | 核心存储管理 |
| MemorySelector | `src/selector/MemorySelector.ts` | AI 相关性选择 |
| SessionMemory | `src/session/SessionMemory.ts` | 会话自动摘要 |
| TeamMemory | `src/team/TeamMemory.ts` | 团队级记忆共享 |

### 高级功能

| 模块 | 文件 | 说明 |
|------|------|------|
| MemoryCache | `src/cache.ts` | LRU + TTL 缓存 |
| MemoryBatchProcessor | `src/batch.ts` | 批量操作 + 事务 |
| TTLCleanupManager | `src/ttl.ts` | 自动过期清理 |
| MemoryExporter | `src/import-export.ts` | JSON 导出 |
| MemoryImporter | `src/import-export.ts` | JSON 导入 |
| MemoryEventEmitter | `src/events.ts` | 事件通知 |

### 记忆类型

| 类型 | 说明 | 作用域 |
|------|------|--------|
| `user` | 用户角色、偏好、知识背景 | private |
| `feedback` | 用户指导、纠正、确认 | private/team |
| `project` | 项目状态、目标、截止日期 | team |
| `reference` | 外部系统指针、文档位置 | team |

### 使用示例

```typescript
import { createMemorySystem } from './dist/index.js'

// 初始化
const memory = createMemorySystem({
  directory: './memory',
  maxFiles: 200,
})

// 保存记忆
const saved = await memory.store.save({
  name: 'my-memory',
  description: 'My first memory',
  type: 'user',
  content: 'This is the memory content',
  scope: 'private',
})

// 加载记忆
const loaded = await memory.store.load('user', 'my-memory')
console.log(loaded?.content)

// 扫描所有记忆
const headers = await memory.store.scan()
console.log(`Total memories: ${headers.length}`)

// 搜索记忆
const memories = await memory.store.search({ type: 'user' })

// 分页查询
const page = await memory.store.scanPaginated({ page: 1, pageSize: 20 })

// 事件订阅
memory.store.on?.('memory:saved', (event) => {
  console.log('Memory saved:', event.memoryName)
})

// 批量操作
import { MemoryBatchProcessor } from './dist/batch.js'
const processor = new MemoryBatchProcessor(memory.store, 5)
const result = await processor.execute([
  { type: 'save', memory: { name: 'm1', type: 'user', content: '...', scope: 'private' } },
  { type: 'save', memory: { name: 'm2', type: 'user', content: '...', scope: 'private' } },
])

// 导入/导出
import { MemoryExporter, MemoryImporter } from './dist/import-export.js'
const exporter = new MemoryExporter(memory.store)
const data = await exporter.exportToJSON()
const importer = new MemoryImporter(memory.store)
await importer.importFromData(data, { overwrite: true })
```

---

## 🔧 工具系统

安全 Shell 命令执行和文件操作工具。

| 模块 | 说明 |
|------|------|
| BashTool | 安全 Shell 命令执行 |
| FileTool | 文件读写编辑 |
| GrepTool | 代码搜索 |

### 安全特性

- 命令白名单
- 参数验证
- 超时控制
- 输出截断

---

## 🔌 MCP 客户端

原生 MCP (Model Context Protocol) 协议支持，即插即用。

### 特性

- 自动服务发现
- 工具调用
- 资源访问
- 提示模板

---

## 🔐 权限系统

| 模式 | 说明 |
|------|------|
| AUTO | AI 自动决策 |
| ASK | 询问用户 |
| DENY | 默认拒绝 |
| ALLOW | 默认允许 |

### 粒度控制

- 按工具类型
- 按文件路径
- 按命令参数

---

## 🎯 任务协调器

多任务协调执行，支持：

- 任务队列
- 优先级调度
- 并发控制
- 结果聚合

---

## 🛡️ 安全模块

| 模块 | 文件 | 说明 |
|------|------|------|
| PathValidator | `src/security/pathValidator.ts` | 路径遍历防护 |
| sanitizePathKey | 同上 | 输入清理 |
| validatePathWithSymlinks | 同上 | Symlink 逃逸检测 |

### 安全防护

- ✅ 路径遍历防护 (`../`)
- ✅ Symlink 逃逸检测
- ✅ Null 字节防护
- ✅ URL 编码攻击防护
- ✅ Unicode 规范化攻击防护
- ✅ 反斜杠防护
- ✅ 文件大小限制
- ✅ 文件数量限制

---

## 📁 项目结构

```
openclaw-extensions/
├── src/
│   ├── index.ts              # 主入口
│   ├── types/                # 类型定义 (新版)
│   ├── types-legacy/         # 类型定义 (旧版)
│   ├── store/                # MemoryStore
│   ├── session/              # SessionMemoryManager
│   ├── team/                 # TeamMemoryManager
│   ├── selector/             # MemorySelector
│   ├── security/             # 安全模块
│   ├── utils/                # 工具函数
│   ├── errors.ts            # 自定义错误
│   ├── events.ts            # 事件系统
│   ├── cache.ts             # 缓存层
│   ├── batch.ts             # 批量操作
│   ├── ttl.ts               # TTL 清理
│   ├── import-export.ts     # 导入导出
│   ├── commands/            # 命令系统
│   ├── coordinator/         # 任务协调器
│   ├── mcp/                 # MCP 客户端
│   ├── permissions/         # 权限系统
│   ├── tools/               # 工具集
│   └── memory-legacy/       # 遗留代码
├── docs/                    # 详细文档
├── tests/                   # 测试用例
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 📖 文档

详细文档请查看 [docs/](docs/) 目录：

### 设计文档
- [集成方案](docs/INTEGRATION_PLAN.md)
- [核心架构](docs/Stage1_Core_Architecture.md)
- [命令系统](docs/Stage2_Command_System.md)
- [工具系统设计](docs/Stage3_Tool_System.md)
- [核心逻辑](docs/Stage4_Core_Logic.md)
- [高级特性](docs/Stage5_Advanced_Features.md)

### 记忆系统
- [记忆系统详解](docs/Stage7_Memory_System.md)
- [高级记忆功能](docs/Stage7_Memory_System_Advanced.md)
- [记忆系统 README](docs/Memory_System_README.md)

---

## 🧪 测试

```bash
npm test
```

### 测试覆盖

| 模块 | 测试数 | 说明 |
|------|--------|------|
| MemoryStore | 13 | CRUD 操作 |
| SessionMemory | 5 | 会话管理 |
| TeamMemory | 5 | 团队记忆 |
| Security | 9 | 路径验证 |
| Frontmatter | 7 | 序列化/反序列化 |
| Events | 4 | 事件系统 |
| Cache | 8 | 缓存层 |
| Batch | 3 | 批量操作 |
| TTL | 3 | 清理机制 |
| Import/Export | 5 | 导入导出 |
| Pagination | 4 | 分页查询 |

**总计**: 86+ 测试用例

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
