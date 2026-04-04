/**
 * Common Types - 共享类型定义
 */
export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tool_calls?: ToolCall[];
    createdAt?: Date;
}
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
}
export interface ToolResult {
    tool_call_id: string;
    content: string;
    is_error?: boolean;
}
//# sourceMappingURL=types.d.ts.map