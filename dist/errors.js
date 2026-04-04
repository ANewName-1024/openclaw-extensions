/**
 * Memory System Errors - Custom error types
 */
export class MemoryError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MemoryError';
    }
}
export class MemoryNotFoundError extends MemoryError {
    constructor(type, name) {
        super(`Memory not found: ${type}/${name}`);
        this.name = 'MemoryNotFoundError';
    }
}
export class MemoryValidationError extends MemoryError {
    constructor(message) {
        super(`Validation failed: ${message}`);
        this.name = 'MemoryValidationError';
    }
}
export class MemoryExistsError extends MemoryError {
    constructor(name) {
        super(`Memory already exists: ${name}`);
        this.name = 'MemoryExistsError';
    }
}
export class MemoryQuotaError extends MemoryError {
    constructor(limit) {
        super(`Memory quota exceeded: ${limit}`);
        this.name = 'MemoryQuotaError';
    }
}
export class MemoryExportError extends MemoryError {
    constructor(message) {
        super(`Export failed: ${message}`);
        this.name = 'MemoryExportError';
    }
}
export class MemoryImportError extends MemoryError {
    constructor(message) {
        super(`Import failed: ${message}`);
        this.name = 'MemoryImportError';
    }
}
//# sourceMappingURL=errors.js.map