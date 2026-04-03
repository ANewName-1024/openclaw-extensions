/**
 * FileTool - 文件操作工具集
 * 基于 Claude Code FileTool 重构
 */

import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

const FileReadInput = z.object({
  file_path: z.string().describe('文件路径'),
  offset: z.number().optional().describe('起始行号'),
  limit: z.number().optional().describe('读取行数限制'),
  show_line_numbers: z.boolean().optional().default(false),
});

const FileWriteInput = z.object({
  file_path: z.string().describe('文件路径'),
  content: z.string().describe('文件内容'),
  append: z.boolean().optional().default(false),
});

const FileEditInput = z.object({
  file_path: z.string().describe('文件路径'),
  old_text: z.string().describe('要替换的文本'),
  new_text: z.string().describe('替换后的文本'),
});

export class FileReadTool {
  name = 'Read';
  description = 'Read file contents from filesystem';
  inputSchema = FileReadInput;

  async execute(input: z.infer<typeof FileReadInput>): Promise<{content: string; hasMore?: boolean}> {
    const content = await fs.readFile(input.file_path, 'utf-8');
    const lines = content.split('\n');
    
    let result = lines;
    if (input.offset !== undefined || input.limit !== undefined) {
      const start = input.offset || 0;
      const end = input.limit ? start + input.limit : lines.length;
      result = lines.slice(start, end);
      
      if (end < lines.length) {
        return {
          content: result.join('\n'),
          hasMore: true,
        };
      }
    }
    
    const prefix = input.show_line_numbers 
      ? result.map((l, i) => `${start + i + 1}: ${l}`).join('\n')
      : result.join('\n');
    
    return { content: prefix };
  }
}

export class FileWriteTool {
  name = 'Write';
  description = 'Write content to a file';
  inputSchema = FileWriteInput;

  async execute(input: z.infer<typeof FileWriteInput>): Promise<{success: boolean}> {
    const mode = input.append ? 'a' : 'w';
    await fs.writeFile(input.file_path, input.content, { flag: mode });
    return { success: true };
  }
}

export class FileEditTool {
  name = 'Edit';
  description = 'Edit file contents with precise text replacement';
  inputSchema = FileEditInput;

  async execute(input: z.infer<typeof FileEditInput>): Promise<{success: boolean; modified: number}> {
    const content = await fs.readFile(input.file_path, 'utf-8');
    
    if (!content.includes(input.old_text)) {
      throw new Error(`Text not found: ${input.old_text}`);
    }
    
    const modifiedContent = content.replace(input.old_text, input.new_text);
    await fs.writeFile(input.file_path, modifiedContent);
    
    return { success: true, modified: 1 };
  }
}

export default { FileReadTool, FileWriteTool, FileEditTool };
