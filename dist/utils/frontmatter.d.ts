/**
 * Frontmatter Parser - YAML frontmatter parsing and serialization
 */
import type { MemoryFrontmatter, ParsedMemory, MemoryType } from '../types/index.js';
/**
 * Parse frontmatter from markdown content
 */
export declare function parseFrontmatter(content: string): ParsedMemory;
/**
 * Serialize frontmatter and body to markdown
 */
export declare function serializeFrontmatter(frontmatter: MemoryFrontmatter, body: string): string;
export declare function validateFrontmatter(frontmatter: MemoryFrontmatter): string[];
/**
 * Generate a safe filename from memory name
 */
export declare function generateFilename(name: string, type: MemoryType): string;
/**
 * Parse filename to extract type and name
 */
export declare function parseFilename(filename: string): {
    type: MemoryType;
    name: string;
} | null;
//# sourceMappingURL=frontmatter.d.ts.map