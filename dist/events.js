/**
 * Event System - Observer pattern for memory changes
 */
/**
 * Simple event emitter for memory system events
 */
export class MemoryEventEmitter {
    handlers = new Map();
    allHandlers = new Set();
    /**
     * Subscribe to a specific event type
     */
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(handler);
        // Return unsubscribe function
        return () => {
            this.handlers.get(event)?.delete(handler);
        };
    }
    /**
     * Subscribe to all events
     */
    onAny(handler) {
        this.allHandlers.add(handler);
        return () => {
            this.allHandlers.delete(handler);
        };
    }
    /**
     * Unsubscribe from a specific event type
     */
    off(event, handler) {
        this.handlers.get(event)?.delete(handler);
    }
    /**
     * Unsubscribe from all events
     */
    offAll() {
        this.handlers.clear();
        this.allHandlers.clear();
    }
    /**
     * Emit an event to all subscribers
     */
    emit(event) {
        // Call specific handlers
        const handlers = this.handlers.get(event.type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    const result = handler(event);
                    if (result instanceof Promise) {
                        result.catch(console.error);
                    }
                }
                catch (error) {
                    console.error(`Event handler error for ${event.type}:`, error);
                }
            }
        }
        // Call general handlers
        for (const handler of this.allHandlers) {
            try {
                const result = handler(event);
                if (result instanceof Promise) {
                    result.catch(console.error);
                }
            }
            catch (error) {
                console.error(`Event handler error for any:`, error);
            }
        }
    }
    /**
     * Create an event and emit it
     */
    emitEvent(type, options) {
        this.emit({
            type,
            timestamp: new Date(),
            ...options,
        });
    }
}
/**
 * Singleton global event emitter for system-wide events
 */
export const globalEventEmitter = new MemoryEventEmitter();
//# sourceMappingURL=events.js.map