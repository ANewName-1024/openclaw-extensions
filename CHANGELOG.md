# Changelog

所有版本变更记录。发布流程：更新版本号 → 新建 tag → 推送。

---

## [v1.2.0] - 2026-04-12

### ✨ 新增 TaskSystem 扩展

**多会话协同任务管理系统**

- ✅ Task File Protocol — 基于文件系统的任务状态共享
  - 任务状态保存在 `memory/task/.active/`、`.done/`、`.failed/`
  - 支持 INBOX → ASSIGNED → IN_PROGRESS → DONE/FAILED 状态流转
- ✅ sessions_spawn 封装 — Worker 会话创建与管理
  - `task-spawn.js` — 分配任务（由 Agent 调用 sessions_spawn）
  - `task-status.js` — 查询任务状态
  - `task-result.js` — 读取任务结果
- ✅ 自动清理 — DONE/FAILED 状态自动迁移到对应目录
  - `task-cleanup.js` — 清理孤儿任务和过期文件
  - 支持 `--dry-run` 模拟运行
  - 支持 `--all` 清理7天前已完成任务
- ✅ 架构要点
  - Task File 是唯一共享状态，主会话和 Worker 通过文件系统通信
  - Worker 完成后通过飞书消息通知用户/主会话
  - `sessions_spawn` 必须由 Agent 直接调用，外部脚本不能通过 HTTP RPC 调用

---

## [v1.1.0] - 2026-04-06

### 🔧 插件架构升级

**OpenClaw v2 插件兼容**

- ✅ 升级为 OpenClaw v2 插件接口（`definePluginEntry`）
  - 旧版直接 export 函数已不支持
  - 新版必须使用 `definePluginEntry` 返回 plugin 对象
- ✅ 新增 `openclaw.plugin.json` 插件清单
  - 路径：`{workspace}/.openclaw/extensions/`
  - 必须包含 `id`、`kind`、`main` 字段
- ✅ 注册内存运行时（`registerMemoryRuntime`）
  - 提供 `getMemorySearchManager()`
  - 提供 `resolveMemoryBackendConfig()`
- ✅ 注册记忆提示段落（`registerMemoryPromptSection`）
  - Before answering 行为指导
  - Citation 格式说明
- ✅ 注册记忆刷新计划（`registerMemoryFlushPlan`）
  - 自动写入 `memory/YYYY-MM-DD.md`

### 🐛 Bug 修复

- ✅ 修复 `dist/types/index.js` 缺失问题
  - `index.js` 导入 `./types/index.js` 但文件不存在
  - 解决方案：创建桥接文件，重新导出 `types-legacy`
- ✅ 修复 `definePluginEntry` 导入错误
  - 该函数导出名为 `t`（命名压缩），不是默认导出
  - 正确导入：`import { t as definePluginEntry } from '...'`

### ⚠️ Breaking Changes

- `dist/index.js` 不再是纯 ESM 导出模块
- 依赖 OpenClaw v2 运行时环境
- 不再支持旧版 OpenClaw（< 2026.4.x）

---

## [v1.0.0] - 2026-04-05

### ✨ 初始版本

包含完整的企业级记忆系统：

- `MemoryStore` - 核心存储，CRUD + 全文搜索
- `MemorySelector` - AI 相关性选择
- `SessionMemoryManager` - 会话自动摘要
- `TeamMemoryManager` - 团队级记忆共享
- `PathValidator` - 路径遍历防护
- `MemoryCache` - LRU + TTL 缓存
- `MemoryBatchProcessor` - 批量操作 + 事务
- `TTLCleanupManager` - 自动过期清理
- `MemoryExporter/Importer` - JSON 导入导出
- `MemoryEventEmitter` - 事件通知

---

## 发布流程

```bash
# 1. 更新 package.json 中的版本号
# 2. 追加本文件变更记录
# 3. 提交
git add CHANGELOG.md package.json
git commit -m "释放: v{x.y.z} {简短说明}"

# 4. 创建 tag
git tag -a v{x.y.z} -m "v{x.y.z} {变更说明}"

# 5. 推送（先推代码，再推 tag）
git push origin master
git push origin v{x.y.z}

# 6. 执行构建
npm run build
```
