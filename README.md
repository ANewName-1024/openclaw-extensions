# OpenClaw Memory System Extensions

企业级记忆系统扩展，为 OpenClaw 提供持久化、会话、团队记忆能力。支持 OpenClaw v2 插件架构。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 版本历史

### v1.1.0 (2026-04-06)
**插件架构升级 - OpenClaw v2 兼容**

- ✅ 升级为 OpenClaw v2 插件接口（`definePluginEntry`）
- ✅ 新增 `openclaw.plugin.json` 清单，插件可被 OpenClaw 自动发现
- ✅ 注册内存运行时（Memory Runtime）
- ✅ 注册记忆提示段落（Memory Prompt Section）
- ✅ 注册记忆刷新计划（Memory Flush Plan）
- ✅ 修复 `dist/types/index.js` 缺失问题
- ✅ 修复导出命名：`definePluginEntry` 来自压缩导出 `{ t }`

> ⚠️ **Breaking Change**: `dist/index.js` 不再是纯 ESM 导出，增加了 OpenClaw 插件入口。

### v1.0.0
- 初始版本，包含完整的 MemoryStore、MemorySelector、SessionMemory、TeamMemory

---

## 模块结构

```
openclaw-extensions/
├── dist/                          # ✅ 构建产物（直接使用）
│   ├── index.js                   # 主入口（v2 插件 + 业务导出）
│   ├── types/index.js             # 类型桥接（重新导出 types-legacy）
│   ├── types-legacy/index.js      # 原始类型定义
│   ├── store/MemoryStore.js       # 核心存储
│   ├── selector/MemorySelector.js  # AI 选择器
│   ├── session/SessionMemory.js   # 会话记忆
│   ├── team/TeamMemory.js         # 团队记忆
│   ├── security/                   # 安全模块
│   ├── utils/                      # 工具函数
│   ├── errors.js                   # 自定义错误
│   ├── events.js                   # 事件系统
│   ├── cache.js                    # 缓存层
│   ├── batch.js                    # 批量操作
│   ├── ttl.js                     # TTL 清理
│   ├── import-export.js           # 导入导出
│   ├── coordinator/               # 任务协调器
│   ├── mcp/                       # MCP 客户端
│   ├── permissions/               # 权限系统
│   ├── tools/                     # 工具集
│   └── memory-legacy/             # 遗留代码
├── src/                           # TypeScript 源码
├── docs/                          # 设计文档
├── tests/                         # 测试用例
├── openclaw.plugin.json           # ✅ OpenClaw v2 插件清单
└── package.json
```

---

## 安装为 OpenClaw 插件

### 方式一：Workspace 插件（推荐）

在 OpenClaw workspace 中创建 junction：

```powershell
# 创建插件目录（必须是这个路径）
mkdir "$env:USERPROFILE\.openclaw\extensions\memory-system"

# 创建 junction 指向本仓库
New-Item -ItemType Junction -Path "$env:USERPROFILE\.openclaw\extensions\memory-system" -Value "D:\path\to\openclaw-extensions"
```

### 方式二：从源码构建

```bash
git clone https://github.com/ANewName-1024/openclaw-extensions.git
cd openclaw-extensions
npm install
npm run build
```

---

## 作为库使用

### 基础用法

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

// 搜索
const results = await memory.store.search({ type: 'user' })

// 扫描
const headers = await memory.store.scan()
```

### 批量操作

```typescript
import { MemoryBatchProcessor } from './dist/batch.js'

const processor = new MemoryBatchProcessor(memory.store, 5)
const result = await processor.execute([
  { type: 'save', memory: { name: 'm1', type: 'user', content: '...', scope: 'private' } },
  { type: 'save', memory: { name: 'm2', type: 'user', content: '...', scope: 'private' } },
])
```

### 导入/导出

```typescript
import { MemoryExporter, MemoryImporter } from './dist/import-export.js'

const exporter = new MemoryExporter(memory.store)
const data = await exporter.exportToJSON()

const importer = new MemoryImporter(memory.store)
await importer.importFromData(data, { overwrite: true })
```

---

## 核心模块

| 模块 | 文件 | 说明 |
|------|------|------|
| MemoryStore | `dist/store/MemoryStore.js` | 核心存储，CRUD + 搜索 |
| MemorySelector | `dist/selector/MemorySelector.js` | AI 相关性选择 |
| SessionMemoryManager | `dist/session/SessionMemory.js` | 会话自动摘要 |
| TeamMemoryManager | `dist/team/TeamMemory.js` | 团队级记忆共享 |
| PathValidator | `dist/security/pathValidator.js` | 路径遍历防护 |

---

## 安全特性

- ✅ 路径遍历防护 (`../`)
- ✅ Symlink 逃逸检测
- ✅ Null 字节防护
- ✅ Unicode 规范化攻击防护
- ✅ 文件大小/数量限制

---

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npx tsc --noEmit

# 运行测试
npm test

# 重新构建
npm run build
```

---

## 相关文档

- [记忆系统详解](docs/Stage7_Memory_System.md)
- [高级记忆功能](docs/Stage7_Memory_System_Advanced.md)
- [集成方案](docs/INTEGRATION_PLAN.md)

---

## 许可证

MIT License
