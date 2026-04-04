/**
 * TaskCoordinator - 任务协调器
 * 多任务协调执行
 */
import { z } from 'zod';
declare const Task: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["pending", "running", "completed", "failed"]>>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    dependencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    status: "pending" | "running" | "completed" | "failed";
    priority: number;
    description?: string | undefined;
    result?: any;
    error?: string | undefined;
    dependencies?: string[] | undefined;
}, {
    type: string;
    id: string;
    description?: string | undefined;
    result?: any;
    error?: string | undefined;
    status?: "pending" | "running" | "completed" | "failed" | undefined;
    priority?: number | undefined;
    dependencies?: string[] | undefined;
}>;
declare const TaskResult: z.ZodObject<z.ZodRawShape, "strip", z.ZodTypeAny, {
    [x: string]: any;
}, {
    [x: string]: any;
}>;
type TaskType = z.infer<typeof Task>;
type TaskResultType = z.infer<typeof TaskResult>;
export declare class TaskCoordinator {
    private tasks;
    private taskQueue;
    private results;
    private onProgress?;
    constructor(options?: {
        onProgress?: (taskId: string, progress: number) => void;
    });
    addTask(task: TaskType): void;
    addTasks(tasks: TaskType[]): void;
    execute(): Promise<Map<string, TaskResultType>>;
    private resolveDependencies;
    private executeTask;
    getTask(taskId: string): TaskType | undefined;
    getResult(taskId: string): TaskResultType | undefined;
    getAllResults(): Map<string, TaskResultType>;
    clear(): void;
}
export default TaskCoordinator;
//# sourceMappingURL=TaskCoordinator.d.ts.map