/**
 * MemorySelector - AI 驱动的记忆相关性选择
 * 基于 Claude Code findRelevantMemories.ts 重构
 */
const SELECT_MEMORIES_SYSTEM_PROMPT = `You are selecting memories that will be useful to the AI assistant as it processes a user's query.

You will be given:
1. The user's query
2. A list of available memory files with their filenames, types, and descriptions

Return a JSON object with a "selected_memories" array containing the filenames that will clearly be useful (up to 5).

Rules:
- Only include memories that you are CERTAIN will be helpful
- If you are unsure, do NOT include it
- If no memories would be helpful, return an empty array
- Recently used tools are provided to help you avoid selecting tool documentation

Output format:
{
  "selected_memories": ["filename1.md", "filename2.md", ...]
}`;
export class MemorySelector {
    model;
    maxResults;
    constructor(options = {}) {
        this.model = options.model || 'minimax-cn/MiniMax-M2.7';
        this.maxResults = options.maxResults || 5;
    }
    /**
     * 选择与查询最相关的记忆
     */
    async select(query, memories, recentTools = []) {
        if (memories.length === 0) {
            return [];
        }
        try {
            // 构建 manifest
            const manifest = this.formatManifest(memories);
            const toolsSection = recentTools.length > 0
                ? `\n\nRecently used tools: ${recentTools.join(', ')}`
                : '';
            // 调用 AI 选择最相关的记忆
            const response = await this.callModel({
                prompt: `Query: ${query}\n\nAvailable memories:\n${manifest}${toolsSection}`,
            });
            const result = this.parseResponse(response);
            const selectedFilenames = result.selected_memories || [];
            // 过滤有效的文件名
            const validFilenames = new Set(memories.map(m => m.filename));
            return selectedFilenames
                .filter((f) => validFilenames.has(f))
                .map((f) => memories.find(m => m.filename === f))
                .slice(0, this.maxResults);
        }
        catch (error) {
            console.error('[MemorySelector] Selection failed:', error);
            return [];
        }
    }
    /**
     * 格式化记忆清单
     */
    formatManifest(memories) {
        return memories
            .map(m => {
            const tag = m.type ? `[${m.type}] ` : '';
            const desc = m.description ? `: ${m.description}` : '';
            return `- ${tag}${m.filename}${desc}`;
        })
            .join('\n');
    }
    /**
     * 调用模型
     */
    async callModel(input) {
        // TODO: 实现实际的模型调用
        // 这里应该连接到 OpenClaw 的模型 API
        throw new Error('Not implemented: connect to OpenClaw model API');
    }
    /**
     * 解析响应
     */
    parseResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed;
        }
        catch {
            return { selected_memories: [] };
        }
    }
}
export default MemorySelector;
//# sourceMappingURL=MemorySelector.js.map