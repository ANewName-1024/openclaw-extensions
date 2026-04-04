/**
 * Memory System Errors - Custom error types
 */
export declare class MemoryError extends Error {
    constructor(message: string);
}
export declare class MemoryNotFoundError extends MemoryError {
    constructor(type: string, name: string);
}
export declare class MemoryValidationError extends MemoryError {
    constructor(message: string);
}
export declare class MemoryExistsError extends MemoryError {
    constructor(name: string);
}
export declare class MemoryQuotaError extends MemoryError {
    constructor(limit: string);
}
export declare class MemoryExportError extends MemoryError {
    constructor(message: string);
}
export declare class MemoryImportError extends MemoryError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map