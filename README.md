# OpenClaw Extensions

基于 Claude Code 源码分析提取的 OpenClaw 扩展能力模块。

## 模块列表

### 1. 工具系统 (tools)

| 模块 | 说明 | 优先级 |
|------|------|--------|
| [BashTool](src/tools/bash/) | 安全 Shell 命令执行 | ⭐⭐⭐ |
| [FileTool](src/tools/file/) | 文件读写编辑 | ⭐⭐⭐ |
| [GrepTool](src/tools/grep/) | 代码搜索 | ⭐⭐⭐ |

### 2. MCP 客户端 (mcp)

原生 MCP 协议支持，即插即用。

### 3. 权限系统 (permissions)

| 模式 | 说明 |
|------|------|
| AUTO | AI 自动决策 |
| ASK | 询问用户 |
| DENY | 默认拒绝 |
| ALLOW | 默认允许 |

### 4. 任务协调器 (coordinator)

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
cp -r src/tools/bash /root/.openclaw/extensions/
cp -r src/mcp /root/.openclaw/extensions/
```

## 文档

- [集成方案](docs/INTEGRATION.md)
- [工具系统设计](docs/TOOLS.md)
- [MCP 客户端](docs/MCP.md)
- [权限系统](docs/PERMISSIONS.md)

## 许可证

MIT License
