/**
 * Security Module - Path traversal and symlink attack protection
 */
export declare class PathTraversalError extends Error {
    constructor(message: string);
}
export declare class SymlinkEscapeError extends Error {
    constructor(message: string);
}
/**
 * Validate that a path is within the allowed base directory
 * Prevents path traversal attacks (../)
 */
export declare function validatePath(baseDir: string, filePath: string): string;
/**
 * Validate path with symlink checking
 * Prevents symlink-based directory escape attacks
 */
export declare function validatePathWithSymlinks(baseDir: string, filePath: string): Promise<string>;
/**
 * Sanitize a path key from user/server input
 */
export declare function sanitizePathKey(key: string): string;
/**
 * Check if a path is a symlink
 */
export declare function isSymlink(p: string): Promise<boolean>;
/**
 * Check if a path is within a directory (string comparison, no filesystem access)
 */
export declare function isPathInDirectory(filePath: string, dirPath: string): boolean;
/**
 * Validate file size is within limit
 */
export declare function validateFileSize(filePath: string, maxSize: number): Promise<boolean>;
/**
 * Validate total count of memory files
 */
export declare function validateFileCount(dirPath: string, maxFiles: number): Promise<boolean>;
export interface SecurityOptions {
    validatePaths: boolean;
    checkSymlinks: boolean;
    maxPathDepth: number;
    allowedExtensions: string[];
}
export declare const DEFAULT_SECURITY_OPTIONS: SecurityOptions;
/**
 * Apply security options to path validation
 */
export declare function createSecurePathValidator(options?: Partial<SecurityOptions>): (baseDir: string, filePath: string) => Promise<string>;
//# sourceMappingURL=pathValidator.d.ts.map