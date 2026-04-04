/**
 * BashTool - 安全 Shell 命令执行工具
 * 基于 Claude Code BashTool 重构
 */
import { z } from 'zod';
declare const BashInput: z.ZodObject<{
    command: z.ZodString;
    timeout_ms: z.ZodOptional<z.ZodNumber>;
    working_directory: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    command: string;
    env?: Record<string, string> | undefined;
    timeout_ms?: number | undefined;
    working_directory?: string | undefined;
}, {
    command: string;
    env?: Record<string, string> | undefined;
    timeout_ms?: number | undefined;
    working_directory?: string | undefined;
}>;
declare const BashOutput: z.ZodObject<{
    stdout: z.ZodOptional<z.ZodString>;
    stderr: z.ZodOptional<z.ZodString>;
    exit_code: z.ZodNumber;
    timed_out: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    exit_code: number;
    stdout?: string | undefined;
    stderr?: string | undefined;
    timed_out?: boolean | undefined;
}, {
    exit_code: number;
    stdout?: string | undefined;
    stderr?: string | undefined;
    timed_out?: boolean | undefined;
}>;
type BashInputType = z.infer<typeof BashInput>;
type BashOutputType = z.infer<typeof BashOutput>;
export declare class BashTool {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        command: z.ZodString;
        timeout_ms: z.ZodOptional<z.ZodNumber>;
        working_directory: z.ZodOptional<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        command: string;
        env?: Record<string, string> | undefined;
        timeout_ms?: number | undefined;
        working_directory?: string | undefined;
    }, {
        command: string;
        env?: Record<string, string> | undefined;
        timeout_ms?: number | undefined;
        working_directory?: string | undefined;
    }>;
    private safeCommands;
    private dangerousCommands;
    execute(input: BashInputType): Promise<BashOutputType>;
    private isCommandSafe;
    private checkCustomRules;
    private runCommand;
}
export default BashTool;
//# sourceMappingURL=BashTool.d.ts.map