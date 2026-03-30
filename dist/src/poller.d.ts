import { FlowCanvasClient, TaskResult } from "./client.js";
export interface PollOptions {
    intervalMs?: number;
    timeoutMs?: number;
    onProgress?: (task: TaskResult) => void;
}
export declare function pollTask(client: FlowCanvasClient, taskId: string, options?: PollOptions): Promise<TaskResult>;
