# OpenClaw Extensions

企业级 AI 助手扩展系统，为 OpenClaw 提供记忆系统、任务协同等企业级能力。支持 OpenClaw v2 插件架构。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 扩展列表

| 扩展 | 路径 | 说明 |
|------|------|------|
| MemorySystem | `src/memory-legacy/` | 企业级记忆系统（持久化、会话、团队记忆） |
| TaskSystem | `src/TaskSystem/` | 多会话协同任务管理系统 |

---

## 版本历史

### v1.2.0 (2026-04-12)
**新增 TaskSystem 扩展**

- ✅ Task File Protocol — 基于文件系统的任务状态共享
- ✅ sessions_spawn 封装 — Worker 会话创建与管理
- ✅ 自动清理 — DONE/FAILED 状态自动迁移到对应目录
- ✅ 完整的脚本工具：task-spawn / task-status / task-result / task-cleanup

### v1.1.0 (2026-04-06)
**插件架构升级 - OpenClaw v2 兼容**

- ✅ 升级为 OpenClaw v2 插件接口（`definePluginEntry`）
- ✅ 新增 `openclaw.plugin.json` 清单，插件可被 OpenClaw 自动发现
- ✅ 注册内存运行时（Memory Runtime）
- ✅ 注册记忆提示段落（Memory Prompt Section）
- ✅ 注册记忆刷新计划（Memory Flush Plan）
- ✅ 修复 `dist/types/index.js` 缺失问题
- ✅ 修复导出命名：`definePluginEntry` 来自压缩导出 `{ t }`

### v1.0.0
- 初始版本，包含完整的 MemoryStore、MemorySelector、SessionMemory、TeamMemory

---

## 模块结构

```
openclaw-extensions/
├── dist/                          # 构建产物（直接使用）
│   ├── index.js                   # 主入口（v2 插件 + 业务导出）
│   ├── types/index.js             # 类型桥接（重新导出 types-legacy）
│   ├── types-legacy/index.js      # 原始类型定义
│   ├── store/MemoryStore.js       # 核心存储
│   ├── selector/MemorySelector.js  # AI 选择器
│   ├── session/SessionMemory.js    # 会话记忆
│   ├── team/TeamMemory.js         # 团队记忆
│   ├── security/                  # 安全模块
│   ├── utils/                     # 工具函数
│   ├── errors.js                  # 自定义错误
│   ├── events.js                  # 事件系统
│   ├── cache.js                   # 缓存层
│   ├── batch.js                   # 批量操作
│   ├── ttl.js                     # TTL 清理
│   ├── import-export.js           # 导入导出
│   ├── coordinator/               # 任务协调器
│   ├── mcp/                       # MCP 客户端
│   ├── permissions/               # 权限系统
│   ├── tools/                    # 工具集
│   └── memory-legacy/             # 遗留代码
├── src/                           # TypeScript 源码
│   ├── TaskSystem/                # 任务协同系统（新增）
│   │   ├── scripts/               # 任务管理脚本
│   │   ├── SKILL.md               # 扩展文档
│   │   └── index.js               # 扩展入口
│   └── memory-legacy/             # 记忆系统
├── docs/                          # 设计文档
├── tests/                         # 测试用例
├── openclaw.plugin.json           # OpenClaw v2 插件清单
└── package.json
```

---

## TaskSystem 扩展

多会话协同任务管理系统，提供完整的任务生命周期管理能力。

### 核心功能

- **Task File Protocol**: 基于文件系统的任务状态共享
- **sessions_spawn 封装**: Worker 会话创建与管理
- **自动清理**: DONE/FAILED 状态自动迁移到对应目录

### Task File Protocol

任务状态文件保存在 `memory/task/` 目录：

```
memory/task/
├── .active/           # 活跃任务
│   └── {taskId}.json
├── .done/             # 已完成任务
│   └── {taskId}.json
└── .failed/           # 失败任务
    └── {taskId}.json
```

### 状态流转

```
INBOX → ASSIGNED → IN_PROGRESS → DONE
                               → FAILED
                               → TIMEOUT
                               → ORPHANED
```

### 脚本用法

```bash
# 分配任务
node scripts/task-spawn.js --task-id test-001 --name "测试任务"

# 查询状态
node scripts/task-status.js --task-id test-001

# 读取结果
node scripts/task-result.js --task-id test-001

# 清理（dry-run）
node scripts/task-cleanup.js --dry-run

# 清理（实际执行）
node scripts/task-cleanup.js

# 清理所有（包括7天前已完成）
node scripts/task-cleanup.js --all
```

### 架构要点

1. **Task File 是唯一共享状态**: 主会话和 Worker 通过文件系统共享状态
2. **Feishu 回调**: Worker 完成后通过飞书消息通知用户/主会话
3. **非阻塞 spawn**: 长任务使用 `mode="session"` 立即返回
4. **自动迁移**: `task-cleanup.js` 自动将 DONE/FAILED 任务迁移到对应目录

---

## MemorySystem 扩展

企业级记忆系统，提供持久化、会话、团队记忆能力。

### 核心功能

- **MemoryStore**: 核心存储，CRUD + 搜索
- **MemorySelector**: AI 相关性选择
- **SessionMemory**: 会话自动摘要
- **TeamMemory**: 团队级记忆共享

### 安全特性

- ✅ 路径遍历防护 (`../`)
- ✅ Symlink 逃逸检测
- ✅ Null 字节防护
- ✅ Unicode 规范化攻击防护
- ✅ 文件大小/数量限制

---

## 安装为 OpenClaw 插件

### 方式一：Workspace 插件（推荐）

在 OpenClaw workspace 中创建 junction：

```powershell
# 创建插件目录
mkdir "$env:USERPROFILE\.openclaw\extensions\memory-system"
mkdir "$env:USERPROFILE\.openclaw\extensions\task-system"

# 创建 junction 指向本仓库
New-Item -ItemType Junction -Path "$env:USERPROFILE\.openclaw\extensions\memory-system" -Value "D:\path\to\openclaw-extensions\src\memory-legacy"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.openclaw\extensions\task-system" -Value "D:\path\to\openclaw-extensions\src\TaskSystem"
```

### 方式二：从源码构建

```bash
git clone https://github.com/ANewName-1024/openclaw-extensions.git
cd openclaw-extensions
npm install
npm run build
```

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

- [TaskSystem 详细文档](src/TaskSystem/SKILL.md)
- [Memory System 详解](docs/Stage7_Memory_System.md)
- [高级记忆功能](docs/Stage7_Memory_System_Advanced.md)
- [集成方案](docs/INTEGRATION_PLAN.md)

---

## 许可

MIT License
