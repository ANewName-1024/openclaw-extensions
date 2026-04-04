/**
 * Memory Types - Core type definitions for OpenClaw Memory System
 */
// =============================================================================
// Memory Types
// =============================================================================
export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'];
/**
 * Normalize pagination options to offset/limit
 */
export function normalizePagination(opts) {
    if (opts.offset !== undefined && opts.limit !== undefined) {
        return { offset: opts.offset, limit: opts.limit };
    }
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;
    return {
        offset: (page - 1) * pageSize,
        limit: pageSize,
    };
}
// =============================================================================
// Defaults
// =============================================================================
export const DEFAULT_MEMORY_CONFIG = {
    enabled: true,
    directory: './memory',
    maxFiles: 200,
    maxFileSize: 1024 * 1024, // 1MB
    autoMemory: {
        enabled: true,
        autoSave: true,
        types: {
            user: { scope: 'private' },
            feedback: { scope: 'both' },
            project: { scope: 'team' },
            reference: { scope: 'team' },
        },
    },
    teamMemory: {
        enabled: false,
        syncOnStart: true,
        path: './memory/team',
    },
    sessionMemory: {
        enabled: true,
        minimumMessageTokensToInit: 1000,
        minimumTokensBetweenUpdate: 2000,
        toolCallsBetweenUpdates: 10,
        template: {
            title: 'Session Title',
            currentState: 'What is actively being worked on right now?',
            taskSpecification: 'What did the user ask to build?',
            filesAndFunctions: 'What are the important files?',
            workflow: 'What bash commands are usually run?',
            errorsAndCorrections: 'Errors encountered and how they were fixed?',
            codebaseDocumentation: 'What are the important system components?',
            learnings: 'What has worked well? What has not?',
            keyResults: 'If the user asked a specific output, repeat it here.',
            worklog: 'Step by step, what was attempted and done?',
        },
    },
    aiSelection: {
        enabled: true,
        model: 'minimax-cn/MiniMax-M2.7',
        maxResults: 5,
        excludeRecentTools: true,
    },
    security: {
        validatePaths: true,
        checkSymlinks: true,
        maxPathDepth: 10,
    },
};
export const MEMORY_TYPE_DESCRIPTIONS = {
    user: 'Information about the user: role, goals, preferences, knowledge',
    feedback: 'Guidance from the user: corrections, confirmations, approach preferences',
    project: 'Project state: ongoing work, goals, deadlines, incidents',
    reference: 'External system pointers: where to find up-to-date information',
};
export const DEFAULT_SESSION_MEMORY_TEMPLATE = `
---
name: current-session
description: Current conversation summary
type: session
---

# Session Title
_A short and distinctive 5-10 word descriptive title for the session._

# Current State
_What is actively being worked on right now? Pending tasks not yet completed._

# Task specification
_What did the user ask to build? Any design decisions or explanatory context._

# Files and Functions
_What are the important files? What do they contain and why are they relevant?_

# Workflow
_What bash commands are usually run and in what order?_

# Errors & Corrections
_Errors encountered and how they were fixed. What did the user correct?_

# Learnings
_What has worked well? What has not? What to avoid?_

# Key results
_If the user asked a specific output, repeat the exact result here._

# Worklog
_Step by step, what was attempted, done? Very terse summary for each step._
`.trim();
//# sourceMappingURL=index.js.map