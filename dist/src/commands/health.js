import { isFlowCanvas } from "../server.js";
import { NOT_RUNNING } from "../mcpClient.js";
import { isJsonMode, outputJson, outputSuccess, outputError } from "../output.js";
export function registerHealthCommand(program, getBase) {
    program
        .command("health")
        .description("Check if FlowCanvas is running")
        .action(async () => {
        const base = await getBase();
        const healthy = await isFlowCanvas(base);
        if (isJsonMode()) {
            outputJson({ status: healthy ? "ok" : "unreachable", server: base });
        }
        else if (healthy) {
            outputSuccess(`FlowCanvas is running (${base})`);
        }
        else {
            outputError(`${NOT_RUNNING} (${base})`);
        }
        if (!healthy)
            process.exit(1);
    });
}
//# sourceMappingURL=health.js.map