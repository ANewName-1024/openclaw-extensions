/**
 * GrepTool - 代码搜索工具
 * 基于 Claude Code GrepTool 重构
 */
import { z } from 'zod';
declare const GrepInput: z.ZodObject<{
    pattern: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    case_sensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    file_pattern: z.ZodOptional<z.ZodString>;
    max_results: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    context_lines: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    pattern: string;
    case_sensitive: boolean;
    max_results: number;
    context_lines: number;
    path?: string | undefined;
    file_pattern?: string | undefined;
}, {
    pattern: string;
    path?: string | undefined;
    case_sensitive?: boolean | undefined;
    file_pattern?: string | undefined;
    max_results?: number | undefined;
    context_lines?: number | undefined;
}>;
export declare class GrepTool {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        pattern: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        case_sensitive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        file_pattern: z.ZodOptional<z.ZodString>;
        max_results: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        context_lines: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        case_sensitive: boolean;
        max_results: number;
        context_lines: number;
        path?: string | undefined;
        file_pattern?: string | undefined;
    }, {
        pattern: string;
        path?: string | undefined;
        case_sensitive?: boolean | undefined;
        file_pattern?: string | undefined;
        max_results?: number | undefined;
        context_lines?: number | undefined;
    }>;
    execute(input: z.infer<typeof GrepInput>): Promise<{
        results: Array<{
            file: string;
            line: number;
            content: string;
        }>;
        total: number;
    }>;
    private walkDirectory;
}
export default GrepTool;
//# sourceMappingURL=GrepTool.d.ts.map