# OpenClaw Extensions

基于 Claude Code 源码分析提取的 OpenClaw 扩展能力模块。

## 模块列表

### 1. 工具系统 (tools)

| 模块 | 说明 | 优先级 |
|------|------|--------|
| [BashTool](src/tools/bash/) | 安全 Shell 命令执行 | ⭐⭐⭐ |
| [FileTool](src/tools/file/) | 文件读写编辑 | ⭐⭐⭐ |
| [GrepTool](src/tools/grep/) | 代码搜索 | ⭐⭐⭐ |

### 2. 记忆系统 (memory)

基于 Claude Code 的记忆系统，支持持久化和会话记忆。

| 模块 | 说明 | 优先级 |
|------|------|--------|
| [MemoryStore](src/memory/) | 记忆存储管理 | ⭐⭐⭐ |
| [MemorySelector](src/memory/) | AI 相关性选择 | ⭐⭐⭐ |
| [SessionMemory](src/memory/) | 会话自动摘要 | ⭐⭐ |

**记忆类型**:
- `user` - 用户角色、偏好、知识背景
- `feedback` - 用户指导、纠正、确认
- `project` - 项目状态、目标、截止日期
- `reference` - 外部系统指针、文档位置

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

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/ANewName-1024/openclaw-extensions.git

# 安装依赖
npm install

# 查看可用模块
ls src/
```

## 安装单个模块

```bash
# 复制到 OpenClaw 扩展目录
cp -r src/memory /root/.openclaw/extensions/
```

## 文档

- [集成方案](docs/INTEGRATION_PLAN.md)
- [工具系统设计](docs/Stage3_Tool_System.md)
- [记忆系统详解](docs/Stage7_Memory_System.md)
- [MCP 客户端](docs/MCP.md)
- [权限系统](docs/PERMISSIONS.md)

## 许可证

MIT License
