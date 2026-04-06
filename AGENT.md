# Agent 使用说明 - OpenClaw Memory System Extensions

> 本文件供 AI Agent 阅读，帮助快速理解、修改和调试本仓库代码。

---

## 一、项目概述

**功能：** 为 OpenClaw 提供企业级记忆系统扩展，支持持久化记忆、会话自动摘要、团队记忆共享。

**插件架构：** OpenClaw v2（`definePluginEntry` 模式）

**部署方式：** 作为 OpenClaw workspace 插件加载（通过 junction），或作为独立 npm 包使用。

---

## 二、关键文件说明

### 2.1 主入口 `dist/index.js`

```javascript
import { createMemorySystem } from './index.js'

// v2 插件入口
import { t as definePluginEntry } from 'openclaw/dist/plugin-entry-DA7dUJNL.js'
const plugin = definePluginEntry({ id: 'memory-system', ... })
export { plugin as default }
```

**关键导出：**
- `createMemorySystem()` — 创建记忆系统实例
- `default` — OpenClaw v2 plugin 对象

**核心模块：**
| 模块 | 文件 | 说明 |
|------|------|------|
| MemoryStore | `dist/store/MemoryStore.js` | 核心存储，CRUD + 全文搜索 |
| MemorySelector | `dist/selector/MemorySelector.js` | AI 相关性选择 |
| SessionMemoryManager | `dist/session/SessionMemory.js` | 会话自动摘要 |
| TeamMemoryManager | `dist/team/TeamMemory.js` | 团队级记忆共享 |
| PathValidator | `dist/security/pathValidator.js` | 路径遍历防护 |

### 2.2 插件清单 `openclaw.plugin.json`

```json
{
  "id": "memory-system",
  "kind": "memory",
  "type": "extension",
  "main": "dist/index.js"
}
```

**kind 字段：** `memory` — 告诉 OpenClaw 这是一个记忆运行时插件。

---

## 三、构建与发布

### 3.1 构建

TypeScript 源码在 `src/`，构建产物在 `dist/`。

```bash
npm install
npm run build     # 编译 src/ -> dist/
```

### 3.2 发布流程（重要）

```
1. 更新 package.json 版本号 (x.y.z)
2. 追加 CHANGELOG.md
3. git add + git commit
4. git tag -a v{x.y.z} -m "v{x.y.z} {变更说明}"
5. git push origin master
6. git push origin v{x.y.z}
7. npm publish  (如果作为 npm 包发布)
```

**禁止：** 不带版本号直接构建、不写 CHANGELOG 直接发布。

### 3.3 安装为 OpenClaw workspace 插件

```powershell
# 创建 junction（必须在 {workspace}/.openclaw/extensions/ 下）
New-Item -ItemType Junction -Path "{$workspace}\.openclaw\extensions\memory-system" -Value "D:\path\to\openclaw-extensions"
```

---

## 四、修改指南

### 4.1 添加新的记忆类型

1. 在 `src/types.ts` 中定义新的类型接口
2. 在 `MemoryStore` 的 `save()` 方法中添加类型校验
3. 在 `dist/types-legacy/index.js` 中导出类型

### 4.2 修改存储后端

`MemoryStore` 使用文件系统存储（`dist/store/MemoryStore.js`）。如需切换到数据库：
1. 修改 `store.save()` / `store.load()` / `store.search()` 实现
2. 保持接口不变，其他模块无感知

### 4.3 升级 OpenClaw 插件接口

如果 OpenClaw 新版本修改了 `definePluginEntry` 的 API：
1. 检查 `openclaw/dist/plugin-entry-*.js` 的实际导出
2. 更新 `dist/index.js` 中的 `definePluginEntry` 调用
3. 确保 `registerMemoryRuntime` / `registerMemoryPromptSection` / `registerMemoryFlushPlan` 三个接口都实现

---

## 五、重要约定

1. **只提交源码和构建产物** — `node_modules/`、`dist/` 构建时自动生成后提交
2. **Breaking Changes 必须在 CHANGELOG 中标注** — 插件接口变化要注明
3. **不破坏向后兼容** — MemoryStore 等核心类的接口保持稳定

---

## 六、联系方式

**Owner：** 魏超
**平台：** 飞书（ou_755999aa81d7950e4a2a5f0190f0326e）
