# OpenClaw Extensions

基于 Claude Code 源码分析提取的 OpenClaw 扩展能力模块，统一集成了记忆系统、工具系统、MCP 客户端等。

## 模块列表

### 1. 记忆系统 (memory)

完整的企业级记忆系统，支持持久化、会话、团队记忆。

| 模块 | 文件 | 说明 | 状态 |
|------|------|------|------|
| MemoryStore | `src/store/MemoryStore.ts` | 记忆存储管理 | ⭐⭐⭐ |
| MemorySelector | `src/selector/MemorySelector.ts` | AI 相关性选择 | ⭐⭐⭐ |
| SessionMemory | `src/session/SessionMemory.ts` | 会话自动摘要 | ⭐⭐⭐ |
| TeamMemory | `src/team/TeamMemory.ts` | 团队级记忆共享 | ⭐⭐ |
| MemoryCache | `src/cache.ts` | LRU + TTL 缓存 | ⭐⭐ |
| MemoryBatchProcessor | `src/batch.ts` | 批量操作 + 事务 | ⭐⭐ |
| TTLCleanupManager | `src/ttl.ts` | 自动过期清理 | ⭐⭐ |
| MemoryExporter/Importer | `src/import-export.ts` | 导入/导出 | ⭐⭐ |

**记忆类型**:
- `user` - 用户角色、偏好，知识背景
- `feedback` - 用户指导、纠正、确认
- `project` - 项目状态、目标、截止日期
- `reference` - 外部系统指针、文档位置

### 2. 工具系统 (tools)

安全 Shell 命令执行和文件操作工具。

| 模块 | 说明 | 状态 |
|------|------|------|
| BashTool | 安全 Shell 命令执行 | ⭐⭐⭐ |
| FileTool | 文件读写编辑 | ⭐⭐⭐ |
| GrepTool | 代码搜索 | ⭐⭐⭐ |

### 3. MCP 客户端 (mcp)

原生 MCP 协议支持，即插即用。

### 4. 权限系统 (permissions)

| 模式 | 说明 |
|------|------|
| AUTO | AI 自动决策 |
| ASK | 询问用户 |
| DENY | 默认拒绝 |
| ALLOW | 默认允许 |

### 5. 任务协调器 (coordinator)

多任务协调执行。

### 6. 安全模块 (security)

| 模块 | 说明 |
|------|------|
| PathValidator | 路径遍历防护 |
| SymlinkEscape | Symlink 逃逸检测 |
| InputSanitizer | 输入清理 |

### 7. 遗留代码 (memory-legacy, types-legacy)

原始版本，保留作为参考。

## 特性

- ✅ **持久化存储** - 基于文件系统的记忆存储，使用 YAML frontmatter
- ✅ **作用域隔离** - private（私有）和 team（团队）两种作用域
- ✅ **会话记忆** - SessionMemoryManager 管理会话内的记忆提取
- ✅ **团队记忆** - TeamMemoryManager 支持团队级别的记忆共享
- ✅ **智能选择** - MemorySelector 根据上下文智能选择相关记忆
- ✅ **事件系统** - 观察者模式，支持记忆变化的订阅
- ✅ **缓存层** - LRU 缓存，支持 TTL 过期
- ✅ **批量操作** - 支持批量保存/删除，事务支持
- ✅ **TTL 清理** - 自动过期清理机制
- ✅ **导入/导出** - JSON 格式备份和恢复
- ✅ **分页支持** - 大数据集分页查询
- ✅ **安全防护** - 路径遍历、symlink 逃逸、Unicode 规范化攻击防护

## 安装

```bash
# 克隆仓库
git clone https://github.com/ANewName-1024/openclaw-extensions.git

# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test
```

## 快速开始

```typescript
import { createMemorySystem } from './dist/index.js'

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
```

## API 文档

详细 API 文档请查看 [docs/](docs/) 目录：

- [记忆系统详解](docs/Stage7_Memory_System.md)
- [高级记忆功能](docs/Stage7_Memory_System_Advanced.md)
- [工具系统设计](docs/Stage3_Tool_System.md)
- [MCP 客户端](docs/MCP.md)
- [权限系统](docs/PERMISSIONS.md)

## 测试

```bash
npm test
```

**测试覆盖**:
- MemoryStore CRUD 操作
- SessionMemoryManager 会话管理
- TeamMemoryManager 团队记忆
- 路径安全验证
- Frontmatter 序列化/反序列化
- 事件系统
- 缓存层
- 批量操作
- TTL 清理
- 导入/导出
- 分页

## 项目结构

```
src/
├── index.ts              # 主入口
├── types/                # 类型定义 (新版)
├── types-legacy/         # 类型定义 (旧版)
├── store/                # MemoryStore
├── session/              # SessionMemoryManager
├── team/                 # TeamMemoryManager
├── selector/             # MemorySelector
├── security/             # 安全模块
├── utils/                # 工具函数
├── errors.ts            # 自定义错误
├── events.ts            # 事件系统
├── cache.ts             # 缓存层
├── batch.ts             # 批量操作
├── ttl.ts               # TTL 清理
├── import-export.ts     # 导入导出
├── commands/            # 命令系统
├── coordinator/         # 任务协调器
├── mcp/                 # MCP 客户端
├── permissions/         # 权限系统
├── tools/               # 工具集
└── memory-legacy/      # 遗留代码
```

## 许可证

MIT License
