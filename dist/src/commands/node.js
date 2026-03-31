import { isJsonMode, outputJson, outputSuccess, outputInfo } from "../output.js";
const SUPPORTED_TYPES = ["image-generation", "video-generation", "audio-generation", "text"];
export function registerNodeCommand(program, client) {
    const node = program.command("node").description("Manage nodes on a canvas");
    node
        .command("add")
        .description("Add a node to a canvas. Use --from to also connect it to an existing node (like dragging a connection line in the UI).")
        .argument("<canvas_uuid>", "Canvas UUID")
        .argument("<type>", `Node type: ${SUPPORTED_TYPES.join(", ")}`)
        .option("--x <x>", "X position (auto-calculated if omitted)", parseFloat)
        .option("--y <y>", "Y position (auto-calculated if omitted)", parseFloat)
        .option("--from <source_id>", "Source node ID — creates the new node and connects source → new node (like dragging a connection line)")
        .option("--label <label>", "Custom display label for the node (optional)")
        .action(async (canvasUuid, type, opts) => {
        if (!SUPPORTED_TYPES.includes(type)) {
            throw new Error(`Unsupported node type: ${type}. Supported: ${SUPPORTED_TYPES.join(", ")}`);
        }
        const elem = await client.addCanvasElement(canvasUuid, type, opts.x, opts.y, opts.label);
        // --from: auto-connect source node → new node
        if (opts.from) {
            const edge = await client.addCanvasEdge(canvasUuid, opts.from, elem.id);
            if (!isJsonMode()) {
                outputInfo(`Connected ${opts.from} → ${elem.id} (edge: ${edge.id})`);
            }
        }
        if (isJsonMode()) {
            outputJson({
                ...elem,
                ...(opts.from ? { connected_from: opts.from } : {}),
            });
            return;
        }
        outputSuccess(`Added ${elem.type} node (ID: ${elem.id}) at (${Math.round(elem.x)}, ${Math.round(elem.y)})`);
    });
    node
        .command("delete")
        .description("Delete a node from a canvas (also removes connected edges)")
        .argument("<canvas_uuid>", "Canvas UUID")
        .argument("<element_id>", "Node ID to delete")
        .action(async (canvasUuid, elementId) => {
        await client.deleteCanvasElement(canvasUuid, elementId);
        if (isJsonMode()) {
            outputJson({ deleted: elementId });
            return;
        }
        outputSuccess(`Deleted node ${elementId} (and removed all connected edges)`);
    });
}
//# sourceMappingURL=node.js.map