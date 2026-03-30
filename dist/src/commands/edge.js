import { isJsonMode, outputJson, outputSuccess } from "../output.js";
export function registerEdgeCommand(program, client) {
    const edge = program.command("edge").description("Manage edges (connections) between nodes");
    edge
        .command("add")
        .description("Connect two nodes with an edge")
        .argument("<canvas_uuid>", "Canvas UUID")
        .argument("<source_id>", "Source node ID")
        .argument("<target_id>", "Target node ID")
        .action(async (canvasUuid, sourceId, targetId) => {
        const result = await client.addCanvasEdge(canvasUuid, sourceId, targetId);
        if (isJsonMode()) {
            outputJson(result);
            return;
        }
        outputSuccess(`Connected ${result.sourceId} → ${result.targetId} (edge: ${result.id})`);
    });
}
//# sourceMappingURL=edge.js.map