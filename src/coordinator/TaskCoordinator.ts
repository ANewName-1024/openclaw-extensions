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

type TaskType = z.infer<typeof Task>;
type TaskResultType = z.infer<typeof TaskResult>;

export class TaskCoordinator {
  private tasks: Map<string, TaskType> = new Map();
  private taskQueue: string[] = [];
  private results: Map<string, TaskResultType> = new Map();
  private onProgress?: (taskId: string, progress: number) => void;

  constructor(options?: { onProgress?: (taskId: string, progress: number) => void }) {
    this.onProgress = options?.onProgress;
  }

  addTask(task: TaskType): void {
    this.tasks.set(task.id, task);
    this.taskQueue.push(task.id);
  }

  addTasks(tasks: TaskType[]): void {
    for (const task of tasks) {
      this.addTask(task);
    }
  }

  async execute(): Promise<Map<string, TaskResultType>> {
    // 按优先级排序
    this.taskQueue.sort((a, b) => {
      const taskA = this.tasks.get(a)!;
      const taskB = this.tasks.get(b)!;
      return (taskB.priority || 0) - (taskA.priority || 0);
    });

    // 执行任务
    const executionOrder = this.resolveDependencies();
    
    for (const taskId of executionOrder) {
      await this.executeTask(taskId);
    }

    return this.results;
  }

  private resolveDependencies(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
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

  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

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
    } catch (error) {
      this.results.set(taskId, {
        taskId,
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      this.tasks.set(taskId, { ...task, status: 'failed', error: String(error) });
    }
  }

  getTask(taskId: string): TaskType | undefined {
    return this.tasks.get(taskId);
  }

  getResult(taskId: string): TaskResultType | undefined {
    return this.results.get(taskId);
  }

  getAllResults(): Map<string, TaskResultType> {
    return this.results;
  }

  clear(): void {
    this.tasks.clear();
    this.taskQueue = [];
    this.results.clear();
  }
}

export default TaskCoordinator;
