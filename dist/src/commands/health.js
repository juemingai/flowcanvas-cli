import { isJsonMode, outputJson, outputSuccess, outputError } from "../output.js";
export function registerHealthCommand(program, client) {
    program
        .command("health")
        .description("Check if FlowCanvas is running")
        .action(async () => {
        const healthy = await client.checkHealth();
        if (isJsonMode()) {
            outputJson({ status: healthy ? "ok" : "unreachable" });
        }
        else if (healthy) {
            outputSuccess("FlowCanvas is running");
        }
        else {
            outputError("FlowCanvas is not running. Please start the FlowCanvas desktop app first.");
            process.exit(1);
        }
    });
}
//# sourceMappingURL=health.js.map