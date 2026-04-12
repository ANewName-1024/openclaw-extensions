# TaskSystem Extension

多会话协同任务管理系统，提供完整的任务生命周期管理能力。

## 核心功能

- **Task File Protocol**: 基于文件系统的任务状态共享
- **sessions_spawn 封装**: Worker 会话创建与管理
- **自动清理**: DONE/FAILED 状态自动迁移到对应目录

## 目录结构

```
TaskSystem/
├── scripts/
│   ├── task-spawn.js       # 分配任务（由 Agent 调用 sessions_spawn）
│   ├── task-status.js      # 查询任务状态
│   ├── task-result.js      # 读取任务结果
│   ├── task-cleanup.js     # 清理孤儿/过期任务
│   └── task-spawn-prep.js  # Spawn 前准备脚本
└── SKILL.md
```

## Task File Protocol

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

### Task File 格式

```json
{
  "taskId": "task-001",
  "name": "任务名称",
  "status": "IN_PROGRESS",
  "progress": {
    "percent": 50,
    "step": "正在执行第二步"
  },
  "createdAt": "2026-04-12T10:00:00+08:00",
  "updatedAt": "2026-04-12T10:05:00+08:00"
}
```

### 状态流转

```
INBOX → ASSIGNED → IN_PROGRESS → DONE
                               → FAILED
                               → TIMEOUT
                               → ORPHANED
```

## sessions_spawn 调用规范

**重要**: `sessions_spawn` 必须由 Agent 直接调用，外部脚本不能通过 HTTP RPC 调用。

```
主会话(Agent) ──sessions_spawn tool call──► Gateway ──► Worker Session
                              │
                              └── 返回 session key
```

### spawn 参数

- `mode`: "session" (非阻塞) 或 "run" (阻塞)
- `thread`: true (长任务必须)
- `prompt`: Worker 执行指令
- `taskId`: 任务 ID（用于 task file 关联）

## 脚本用法

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

## 架构要点

1. **Task File 是唯一共享状态**: 主会话和 Worker 通过文件系统共享状态
2. **Feishu 回调**: Worker 完成后通过飞书消息通知用户/主会话
3. **非阻塞 spawn**: 长任务使用 `mode="session"` 立即返回
4. **自动迁移**: `task-cleanup.js` 自动将 DONE/FAILED 任务迁移到对应目录

## 版本历史

- v1.0 (2026-04-12): 初始版本，包含完整的 Task File Protocol 和 scripts
