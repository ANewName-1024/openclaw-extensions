/**
 * MemoryStore - 记忆存储管理
 * 基于 Claude Code memoryScan.ts 重构
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseFrontmatter, stringifyFrontmatter } from '../utils/frontmatter';
export class MemoryStore {
    memoryDir;
    constructor(memoryDir = './memory') {
        this.memoryDir = memoryDir;
    }
    /**
     * 保存记忆到文件
     */
    async save(memory) {
        const dir = path.join(this.memoryDir, memory.type);
        await fs.mkdir(dir, { recursive: true });
        const filename = this.generateFilename(memory.name);
        const filepath = path.join(dir, filename);
        const content = this.serialize(memory);
        await fs.writeFile(filepath, content, 'utf-8');
    }
    /**
     * 加载单个记忆
     */
    async load(type, name) {
        const filepath = path.join(this.memoryDir, type, `${name}.md`);
        try {
            const content = await fs.readFile(filepath, 'utf-8');
            return this.deserialize(content);
        }
        catch {
            return null;
        }
    }
    /**
     * 删除记忆
     */
    async delete(type, name) {
        const filepath = path.join(this.memoryDir, type, `${name}.md`);
        try {
            await fs.unlink(filepath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 扫描目录，返回所有记忆头信息
     */
    async scan(signal) {
        const headers = [];
        try {
            const entries = await fs.readdir(this.memoryDir, { recursive: true });
            for (const entry of entries) {
                if (signal?.aborted)
                    break;
                if (typeof entry === 'string' && entry.endsWith('.md') && entry !== 'MEMORY.md') {
                    const filepath = path.join(this.memoryDir, entry);
                    const header = await this.readHeader(filepath);
                    if (header)
                        headers.push(header);
                }
            }
        }
        catch {
            return [];
        }
        // 按修改时间排序（最新优先），最多 200 个
        return headers
            .sort((a, b) => b.mtimeMs - a.mtimeMs)
            .slice(0, 200);
    }
    /**
     * 按类型扫描记忆
     */
    async scanByType(type, signal) {
        const typeDir = path.join(this.memoryDir, type);
        try {
            const entries = await fs.readdir(typeDir);
            const headers = [];
            for (const entry of entries) {
                if (signal?.aborted)
                    break;
                if (entry.endsWith('.md')) {
                    const filepath = path.join(typeDir, entry);
                    const header = await this.readHeader(filepath);
                    if (header)
                        headers.push(header);
                }
            }
            return headers.sort((a, b) => b.mtimeMs - a.mtimeMs);
        }
        catch {
            return [];
        }
    }
    /**
     * 读取记忆文件头信息
     */
    async readHeader(filepath) {
        try {
            const stat = await fs.stat(filepath);
            const content = await fs.readFile(filepath, 'utf-8');
            const lines = content.split('\n').slice(0, 30); // 只读前 30 行
            const frontmatterContent = lines.join('\n');
            const { frontmatter } = parseFrontmatter(`---\n${frontmatterContent}\n---`);
            const filename = path.basename(filepath);
            const typeStr = frontmatter.type;
            const type = MEMORY_TYPES.includes(typeStr) ? typeStr : undefined;
            return {
                filename,
                filePath: filepath,
                mtimeMs: stat.mtimeMs,
                description: frontmatter.description || null,
                type,
                scope: frontmatter.scope || 'private',
            };
        }
        catch {
            return null;
        }
    }
    /**
     * 生成安全文件名
     */
    generateFilename(name) {
        // 移除非字母数字字符，转小写
        const safe = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `${safe}.md`;
    }
    /**
     * 序列化记忆为 Markdown
     */
    serialize(memory) {
        const frontmatter = {
            name: memory.name,
            description: memory.description,
            type: memory.type,
            scope: memory.scope,
            tags: memory.tags,
            createdAt: memory.createdAt.toISOString(),
            updatedAt: memory.updatedAt.toISOString(),
        };
        return stringifyFrontmatter(frontmatter, memory.content);
    }
    /**
     * 反序列化记忆
     */
    deserialize(content) {
        const { frontmatter, body } = parseFrontmatter(content);
        return {
            name: frontmatter.name || '',
            description: frontmatter.description || '',
            type: frontmatter.type || 'reference',
            content: body,
            scope: frontmatter.scope || 'private',
            tags: frontmatter.tags || [],
            createdAt: new Date(frontmatter.createdAt || Date.now()),
            updatedAt: new Date(frontmatter.updatedAt || Date.now()),
        };
    }
}
export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'];
//# sourceMappingURL=MemoryStore.js.map