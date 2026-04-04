/**
 * MCP Client - Model Context Protocol 客户端
 * 基于 Claude Code MCP 客户端重构
 */
import { z } from 'zod';
declare const McpServerConfig: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["stdio", "sse", "http"]>;
    command: z.ZodOptional<z.ZodString>;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    url: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "stdio" | "sse" | "http";
    name: string;
    command?: string | undefined;
    args?: string[] | undefined;
    url?: string | undefined;
    env?: Record<string, string> | undefined;
}, {
    type: "stdio" | "sse" | "http";
    name: string;
    command?: string | undefined;
    args?: string[] | undefined;
    url?: string | undefined;
    env?: Record<string, string> | undefined;
}>;
declare const McpTool: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    inputSchema: Record<string, any>;
    description?: string | undefined;
}, {
    name: string;
    inputSchema: Record<string, any>;
    description?: string | undefined;
}>;
declare const McpResource: z.ZodObject<{
    uri: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    mimeType: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    uri: string;
    description?: string | undefined;
    mimeType?: string | undefined;
}, {
    name: string;
    uri: string;
    description?: string | undefined;
    mimeType?: string | undefined;
}>;
export declare class McpClient {
    private serverName;
    private transport;
    private tools;
    private resources;
    constructor(config: z.infer<typeof McpServerConfig>);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    listTools(): Promise<Array<z.infer<typeof McpTool>>>;
    callTool(name: string, args: Record<string, any>): Promise<any>;
    listResources(): Promise<Array<z.infer<typeof McpResource>>>;
    readResource(uri: string): Promise<{
        contents: string;
    }>;
    isConnected(): boolean;
}
export declare class McpClientManager {
    private clients;
    addServer(config: z.infer<typeof McpServerConfig>): Promise<void>;
    removeServer(name: string): Promise<void>;
    getClient(name: string): McpClient | undefined;
    listServers(): string[];
}
declare const _default: {
    McpClient: typeof McpClient;
    McpClientManager: typeof McpClientManager;
};
export default _default;
//# sourceMappingURL=McpClient.d.ts.map