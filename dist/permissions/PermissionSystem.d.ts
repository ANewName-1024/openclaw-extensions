/**
 * Permission System - 权限控制系统
 * 基于 Claude Code 权限系统重构
 */
import { z } from 'zod';
export declare enum PermissionMode {
    AUTO = "auto",// AI 自动决策
    ASK = "ask",// 询问用户
    DENY = "deny",// 默认拒绝
    ALLOW = "allow"
}
declare const PermissionConfig: z.ZodObject<{
    mode: z.ZodDefault<z.ZodNativeEnum<typeof PermissionMode>>;
    rules: z.ZodDefault<z.ZodArray<z.ZodObject<{
        pattern: z.ZodString;
        action: z.ZodEnum<["allow", "deny"]>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        action: "deny" | "allow";
        reason?: string | undefined;
    }, {
        pattern: string;
        action: "deny" | "allow";
        reason?: string | undefined;
    }>, "many">>;
    dangerous_patterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    mode: PermissionMode;
    rules: {
        pattern: string;
        action: "deny" | "allow";
        reason?: string | undefined;
    }[];
    dangerous_patterns?: string[] | undefined;
}, {
    mode?: PermissionMode | undefined;
    rules?: {
        pattern: string;
        action: "deny" | "allow";
        reason?: string | undefined;
    }[] | undefined;
    dangerous_patterns?: string[] | undefined;
}>;
type PermissionConfigType = z.infer<typeof PermissionConfig>;
export interface PermissionResult {
    result: 'allowed' | 'denied' | 'ask';
    reason?: string;
    matched_rule?: string;
}
export declare class PermissionChecker {
    private mode;
    private rules;
    private dangerousPatterns;
    constructor(config: PermissionConfigType);
    check(toolName: string, input: any): Promise<PermissionResult>;
    private extractCommand;
    private checkAskMode;
    private checkAutoMode;
    private detectDangerousCommand;
    private matchWildcard;
    setMode(mode: PermissionMode): void;
    addRule(pattern: string, action: 'allow' | 'deny', reason?: string): void;
}
export default PermissionChecker;
//# sourceMappingURL=PermissionSystem.d.ts.map