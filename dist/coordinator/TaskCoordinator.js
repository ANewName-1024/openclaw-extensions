/**
 * TaskCoordinator - 任务协调器
 * 多任务协调执行
 */
import { z } from 'zod';
const Task = z.object({
    id: z.string(),
    type: z.string(),
    description: z.string().optional(),
    status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
    priority: z.number().optional().default(0),
    dependencies: z.array(z.string()).optional(),
    result: z.any().optional(),
    error: z.string().optional(),
});
const TaskResult = z.object({
    taskId: string,
    success: boolean,
    result: any,
    error: string | null,
});
export class TaskCoordinator {
    tasks = new Map();
    taskQueue = [];
    results = new Map();
    onProgress;
    constructor(options) {
        this.onProgress = options?.onProgress;
    }
    addTask(task) {
        this.tasks.set(task.id, task);
        this.taskQueue.push(task.id);
    }
    addTasks(tasks) {
        for (const task of tasks) {
            this.addTask(task);
        }
    }
    async execute() {
        // 按优先级排序
        this.taskQueue.sort((a, b) => {
            const taskA = this.tasks.get(a);
            const taskB = this.tasks.get(b);
            return (taskB.priority || 0) - (taskA.priority || 0);
        });
        // 执行任务
        const executionOrder = this.resolveDependencies();
        for (const taskId of executionOrder) {
            await this.executeTask(taskId);
        }
        return this.results;
    }
    resolveDependencies() {
        const result = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (taskId) => {
            if (visited.has(taskId))
                return;
            if (visiting.has(taskId)) {
                throw new Error(`Circular dependency detected: ${taskId}`);
            }
            visiting.add(taskId);
            const task = this.tasks.get(taskId);
            if (task?.dependencies) {
                for (const depId of task.dependencies) {
                    visit(depId);
                }
            }
            visiting.delete(taskId);
            visited.add(taskId);
            result.push(taskId);
        };
        for (const taskId of this.taskQueue) {
            visit(taskId);
        }
        return result;
    }
    async executeTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return;
        try {
            this.tasks.set(taskId, { ...task, status: 'running' });
            // TODO: 根据 task.type 执行相应的任务
            // const result = await this.runTask(task);
            this.results.set(taskId, {
                taskId,
                success: true,
                result: task,
                error: null,
            });
            this.tasks.set(taskId, { ...task, status: 'completed' });
        }
        catch (error) {
            this.results.set(taskId, {
                taskId,
                success: false,
                result: null,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            this.tasks.set(taskId, { ...task, status: 'failed', error: String(error) });
        }
    }
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    getResult(taskId) {
        return this.results.get(taskId);
    }
    getAllResults() {
        return this.results;
    }
    clear() {
        this.tasks.clear();
        this.taskQueue = [];
        this.results.clear();
    }
}
export default TaskCoordinator;
//# sourceMappingURL=TaskCoordinator.js.map