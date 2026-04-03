/**
 * BashTool - 安全 Shell 命令执行工具
 * 基于 Claude Code BashTool 重构
 */

import { z } from 'zod';

const BashInput = z.object({
  command: z.string().describe('要执行的 shell 命令'),
  timeout_ms: z.number().optional().describe('超时时间(毫秒)'),
  working_directory: z.string().optional().describe('工作目录'),
  env: z.record(z.string()).optional().describe('环境变量'),
});

const BashOutput = z.object({
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exit_code: z.number(),
  timed_out: z.boolean().optional(),
});

type BashInputType = z.infer<typeof BashInput>;
type BashOutputType = z.infer<typeof BashOutput>;

export class BashTool {
  name = 'Bash';
  description = 'Execute shell commands safely';
  inputSchema = BashInput;
  
  // 安全命令白名单
  private safeCommands = new Set([
    'ls', 'cat', 'pwd', 'git', 'npm', 'node', 
    'python', 'python3', 'curl', 'wget', 'grep'
  ]);
  
  // 危险命令黑名单
  private dangerousCommands = new Set([
    'rm -rf', 'dd', 'mkfs', ':(){:|:&};:', 'forkbomb'
  ]);

  async execute(input: BashInputType): Promise<BashOutputType> {
    // 安全检查
    if (!this.isCommandSafe(input.command)) {
      throw new Error(`Command not allowed: ${input.command}`);
    }

    // 执行命令
    const result = await this.runCommand(input);
    return result;
  }

  private isCommandSafe(command: string): boolean {
    const cmd = command.trim().split(/\s+/)[0];
    
    // 检查是否在白名单中
    if (this.safeCommands.has(cmd)) {
      return true;
    }
    
    // 检查是否在黑名单中
    for (const dangerous of this.dangerousCommands) {
      if (command.includes(dangerous)) {
        return false;
      }
    }
    
    // 自定义规则
    return this.checkCustomRules(command);
  }

  private checkCustomRules(command: string): boolean {
    // TODO: 实现自定义规则检查
    return true;
  }

  private async runCommand(input: BashInputType): Promise<BashOutputType> {
    // TODO: 实现实际的命令执行
    // 这里需要集成 OpenClaw 的 exec 工具
    return {
      stdout: '',
      stderr: '',
      exit_code: 0,
    };
  }
}

export default BashTool;
