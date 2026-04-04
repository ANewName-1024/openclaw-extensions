/**
 * Event System - Observer pattern for memory changes
 */
import type { Memory, MemoryType } from './types/index.js';
export type MemoryEventType = 'memory:saved' | 'memory:updated' | 'memory:deleted' | 'memory:scanned' | 'memory:searched';
export interface MemoryEvent {
    type: MemoryEventType;
    timestamp: Date;
    memory?: Memory;
    memoryName?: string;
    memoryType?: MemoryType;
    metadata?: Record<string, unknown>;
}
export type EventHandler = (event: MemoryEvent) => void | Promise<void>;
/**
 * Simple event emitter for memory system events
 */
export declare class MemoryEventEmitter {
    private handlers;
    private allHandlers;
    /**
     * Subscribe to a specific event type
     */
    on(event: MemoryEventType, handler: EventHandler): () => void;
    /**
     * Subscribe to all events
     */
    onAny(handler: EventHandler): () => void;
    /**
     * Unsubscribe from a specific event type
     */
    off(event: MemoryEventType, handler: EventHandler): void;
    /**
     * Unsubscribe from all events
     */
    offAll(): void;
    /**
     * Emit an event to all subscribers
     */
    protected emit(event: MemoryEvent): void;
    /**
     * Create an event and emit it
     */
    emitEvent(type: MemoryEventType, options?: {
        memory?: Memory;
        memoryName?: string;
        memoryType?: MemoryType;
        metadata?: Record<string, unknown>;
    }): void;
}
/**
 * Singleton global event emitter for system-wide events
 */
export declare const globalEventEmitter: MemoryEventEmitter;
//# sourceMappingURL=events.d.ts.map