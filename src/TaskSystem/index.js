/**
 * TaskSystem Extension Index
 * 
 * Provides task lifecycle management for multi-session coordination.
 * 
 * Key features:
 * - Task File Protocol for shared state between sessions
 * - sessions_spawn wrapper for Worker creation
 * - Automatic cleanup (DONE/FAILED migration)
 */

module.exports = {
  name: 'TaskSystem',
  version: '1.0.0',
  description: 'Multi-session task coordination system',
  
  scripts: [
    'scripts/task-spawn.js',
    'scripts/task-status.js', 
    'scripts/task-result.js',
    'scripts/task-cleanup.js',
    'scripts/task-spawn-prep.js'
  ],
  
  // Task File Protocol constants
  TASK_DIR: 'memory/task',
  ACTIVE_DIR: 'memory/task/.active',
  DONE_DIR: 'memory/task/.done',
  FAILED_DIR: 'memory/task/.failed',
  
  // Status values
  STATUS: {
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
    ORPHANED: 'ORPHANED'
  }
};
