export async function pollTask(client, taskId, options = {}) {
    const intervalMs = options.intervalMs ?? 2000;
    const timeoutMs = options.timeoutMs ?? 600000; // 10 minutes default
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const task = await client.getTask(taskId);
        if (options.onProgress) {
            options.onProgress(task);
        }
        if (task.status === "completed") {
            return task;
        }
        if (task.status === "failed") {
            throw new Error(task.error ?? "Task failed with unknown error");
        }
        await sleep(intervalMs);
    }
    throw new Error(`Task ${taskId} timed out after ${timeoutMs / 1000}s`);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=poller.js.map