/**
 * FileTool - 文件操作工具集
 * 基于 Claude Code FileTool 重构
 */
import { z } from 'zod';
declare const FileReadInput: z.ZodObject<{
    file_path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    show_line_numbers: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    file_path: string;
    show_line_numbers: boolean;
    offset?: number | undefined;
    limit?: number | undefined;
}, {
    file_path: string;
    offset?: number | undefined;
    limit?: number | undefined;
    show_line_numbers?: boolean | undefined;
}>;
declare const FileWriteInput: z.ZodObject<{
    file_path: z.ZodString;
    content: z.ZodString;
    append: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    file_path: string;
    append: boolean;
}, {
    content: string;
    file_path: string;
    append?: boolean | undefined;
}>;
declare const FileEditInput: z.ZodObject<{
    file_path: z.ZodString;
    old_text: z.ZodString;
    new_text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file_path: string;
    old_text: string;
    new_text: string;
}, {
    file_path: string;
    old_text: string;
    new_text: string;
}>;
export declare class FileReadTool {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        file_path: z.ZodString;
        offset: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        show_line_numbers: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        file_path: string;
        show_line_numbers: boolean;
        offset?: number | undefined;
        limit?: number | undefined;
    }, {
        file_path: string;
        offset?: number | undefined;
        limit?: number | undefined;
        show_line_numbers?: boolean | undefined;
    }>;
    execute(input: z.infer<typeof FileReadInput>): Promise<{
        content: string;
        hasMore?: boolean;
    }>;
}
export declare class FileWriteTool {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        file_path: z.ZodString;
        content: z.ZodString;
        append: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        file_path: string;
        append: boolean;
    }, {
        content: string;
        file_path: string;
        append?: boolean | undefined;
    }>;
    execute(input: z.infer<typeof FileWriteInput>): Promise<{
        success: boolean;
    }>;
}
export declare class FileEditTool {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        file_path: z.ZodString;
        old_text: z.ZodString;
        new_text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        file_path: string;
        old_text: string;
        new_text: string;
    }, {
        file_path: string;
        old_text: string;
        new_text: string;
    }>;
    execute(input: z.infer<typeof FileEditInput>): Promise<{
        success: boolean;
        modified: number;
    }>;
}
declare const _default: {
    FileReadTool: typeof FileReadTool;
    FileWriteTool: typeof FileWriteTool;
    FileEditTool: typeof FileEditTool;
};
export default _default;
//# sourceMappingURL=FileTool.d.ts.map