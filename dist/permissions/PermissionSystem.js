/**
 * Permission System - 权限控制系统
 * 基于 Claude Code 权限系统重构
 */
import { z } from 'zod';
export var PermissionMode;
(function (PermissionMode) {
    PermissionMode["AUTO"] = "auto";
    PermissionMode["ASK"] = "ask";
    PermissionMode["DENY"] = "deny";
    PermissionMode["ALLOW"] = "allow";
})(PermissionMode || (PermissionMode = {}));
const PermissionRule = z.object({
    pattern: z.string().describe('命令匹配模式 (支持 * 通配符)'),
    action: z.enum(['allow', 'deny']),
    reason: z.string().optional(),
});
const PermissionConfig = z.object({
    mode: z.nativeEnum(PermissionMode).default(PermissionMode.ASK),
    rules: z.array(PermissionRule).default([]),
    dangerous_patterns: z.array(z.string()).optional(),
});
export class PermissionChecker {
    mode;
    rules = [];
    dangerousPatterns = [];
    constructor(config) {
        this.mode = config.mode;
        this.rules = config.rules;
        this.dangerousPatterns = config.dangerous_patterns || [];
    }
    async check(toolName, input) {
        const command = this.extractCommand(input);
        switch (this.mode) {
            case PermissionMode.ALLOW:
                return { result: 'allowed' };
            case PermissionMode.DENY:
                return { result: 'denied', reason: 'Default deny mode' };
            case PermissionMode.ASK:
                return this.checkAskMode(command);
            case PermissionMode.AUTO:
                return this.checkAutoMode(command);
        }
    }
    extractCommand(input) {
        if (typeof input === 'string')
            return input;
        if (input?.command)
            return input.command;
        if (input?.cmd)
            return input.cmd;
        return '';
    }
    checkAskMode(command) {
        // 检查是否匹配危险命令
        for (const pattern of this.dangerousPatterns) {
            if (this.matchWildcard(command, pattern)) {
                return { result: 'denied', reason: `Dangerous pattern: ${pattern}` };
            }
        }
        // 检查规则
        for (const rule of this.rules) {
            if (this.matchWildcard(command, rule.pattern)) {
                return {
                    result: rule.action === 'allow' ? 'allowed' : 'denied',
                    reason: rule.reason,
                    matched_rule: rule.pattern,
                };
            }
        }
        return { result: 'ask' };
    }
    async checkAutoMode(command) {
        // 自动模式：AI 判断安全性
        const isDangerous = await this.detectDangerousCommand(command);
        if (isDangerous) {
            return { result: 'denied', reason: 'Auto-detected dangerous command' };
        }
        return { result: 'allowed' };
    }
    async detectDangerousCommand(command) {
        // TODO: 实现危险命令检测
        const dangerous = ['rm -rf', 'dd if=', 'mkfs', ':(){:|:&};:'];
        return dangerous.some(d => command.includes(d));
    }
    matchWildcard(cmd, pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(cmd);
    }
    setMode(mode) {
        this.mode = mode;
    }
    addRule(pattern, action, reason) {
        this.rules.push({ pattern, action, reason });
    }
}
export default PermissionChecker;
//# sourceMappingURL=PermissionSystem.js.map