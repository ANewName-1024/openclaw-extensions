/**
 * SessionMemory - 会话记忆自动摘要
 * 基于 Claude Code sessionMemory.ts 重构
 */
import * as fs from 'fs/promises';
export const DEFAULT_SESSION_MEMORY_CONFIG = {
    minimumMessageTokensToInit: 1000,
    minimumTokensBetweenUpdate: 2000,
    toolCallsBetweenUpdates: 10,
};
export class SessionMemoryManager {
    config;
    state;
    sessionDir;
    constructor(config = {}, sessionDir = './.session-memory') {
        this.config = { ...DEFAULT_SESSION_MEMORY_CONFIG, ...config };
        this.sessionDir = sessionDir;
        this.state = {
            initialized: false,
            lastExtractionTokens: 0,
            lastExtractionMessageId: null,
        };
    }
    /**
     * 检查是否应该触发记忆提取
     */
    shouldExtract(messages) {
        if (!this.config.enabled) {
            return false;
        }
        const tokenCount = this.estimateTokenCount(messages);
        // 检查初始化阈值
        if (!this.state.initialized) {
            if (tokenCount < this.config.minimumMessageTokensToInit) {
                return false;
            }
            this.state.initialized = true;
        }
        // 检查 token 增长阈值
        const tokenGrowth = tokenCount - this.state.lastExtractionTokens;
        const hasMetTokenThreshold = tokenGrowth >= this.config.minimumTokensBetweenUpdate;
        // 检查工具调用次数阈值
        const toolCallsSinceLastUpdate = this.countToolCallsSince(messages, this.state.lastExtractionMessageId);
        const hasMetToolCallThreshold = toolCallsSinceLastUpdate >= this.config.toolCallsBetweenUpdates;
        // 检查最后一条消息是否包含工具调用（避免截断）
        const lastTurnHasToolCalls = this.checkLastTurnHasToolCalls(messages);
        // 触发条件：
        // 1. Token + 工具调用阈值都满足
        // 2. OR Token 阈值满足且最后无工具调用（自然对话间隙）
        const shouldExtract = (hasMetTokenThreshold && hasMetToolCallThreshold) ||
            (hasMetTokenThreshold && !lastTurnHasToolCalls);
        return shouldExtract;
    }
    /**
     * 提取会话摘要
     */
    async extract(messages) {
        const sessionMemoryPath = await this.ensureSessionFile();
        // 读取当前记忆
        let currentMemory = '';
        try {
            currentMemory = await fs.readFile(sessionMemoryPath, 'utf-8');
        }
        catch {
            currentMemory = '';
        }
        // 构建提取提示
        const prompt = this.buildExtractionPrompt(currentMemory, messages);
        // TODO: 使用子代理执行提取
        // 这里应该调用 OpenClaw 的 fork agent 机制
        const summary = await this.runExtractionAgent(prompt);
        // 更新状态
        this.state.lastExtractionTokens = this.estimateTokenCount(messages);
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.id) {
            this.state.lastExtractionMessageId = lastMessage.id;
        }
        return summary;
    }
    /**
     * 确保会话记忆文件存在
     */
    async ensureSessionFile() {
        await fs.mkdir(this.sessionDir, { recursive: true });
        const filepath = `${this.sessionDir}/current.md`;
        try {
            await fs.writeFile(filepath, '', { flag: 'wx' });
            const template = this.loadSessionTemplate();
            await fs.writeFile(filepath, template);
        }
        catch (e) {
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }
        return filepath;
    }
    /**
     * 加载会话记忆模板
     */
    loadSessionTemplate() {
        return `---
name: current-session
description: Current conversation summary
type: session
---

# Current Session Summary

<!-- 在此记录对话的关键信息 -->

## 主题
-

## 关键决策
-

## 待处理事项
-

## 重要上下文
-

`;
    }
    /**
     * 构建提取提示
     */
    buildExtractionPrompt(currentMemory, messages) {
        const recentMessages = messages.slice(-20); // 最近 20 条消息
        const formattedMessages = recentMessages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n\n');
        return `
Current session memory:
${currentMemory}

Recent conversation:
${formattedMessages}

Please update the session memory with:
1. Key topics discussed
2. Important decisions made
3. Action items or follow-ups
4. Any relevant context that should be remembered

Keep the memory concise and actionable.
`;
    }
    /**
     * 运行提取子代理
     */
    async runExtractionAgent(prompt) {
        // TODO: 实现子代理调用
        // 应该使用 OpenClaw 的 runForkedAgent 或类似机制
        throw new Error('Not implemented: connect to OpenClaw fork agent');
    }
    /**
     * 估算 token 数量
     */
    estimateTokenCount(messages) {
        // 简单估算：每 4 个字符约等于 1 个 token
        const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.ceil(totalChars / 4);
    }
    /**
     * 计算自上次提取以来的工具调用次数
     */
    countToolCallsSince(messages, sinceId) {
        if (sinceId === null) {
            // 统计所有消息中的工具调用
            return messages.reduce((count, m) => {
                if (m.role === 'assistant' && m.tool_calls) {
                    return count + m.tool_calls.length;
                }
                return count;
            }, 0);
        }
        let foundStart = false;
        let toolCallCount = 0;
        for (const message of messages) {
            if (!foundStart) {
                if (message.id === sinceId) {
                    foundStart = true;
                }
                continue;
            }
            if (message.role === 'assistant' && message.tool_calls) {
                toolCallCount += message.tool_calls.length;
            }
        }
        return toolCallCount;
    }
    /**
     * 检查最后一条 assistant 消息是否包含工具调用
     */
    checkLastTurnHasToolCalls(messages) {
        const lastMessage = messages[messages.length - 1];
        return lastMessage?.role === 'assistant' &&
            Array.isArray(lastMessage?.tool_calls) &&
            lastMessage.tool_calls.length > 0;
    }
    /**
     * 重置状态
     */
    reset() {
        this.state = {
            initialized: false,
            lastExtractionTokens: 0,
            lastExtractionMessageId: null,
        };
    }
}
export default SessionMemoryManager;
//# sourceMappingURL=SessionMemory.js.map