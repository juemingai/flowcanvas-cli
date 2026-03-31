import { isJsonMode, outputJson, outputTable, outputSuccess, outputError } from "../output.js";
export function registerCanvasCommand(program, client) {
    const canvas = program.command("canvas").description("Manage canvases");
    canvas
        .command("list")
        .description("List all canvases")
        .action(async () => {
        const canvases = await client.listCanvases();
        if (isJsonMode()) {
            outputJson(canvases);
            return;
        }
        if (canvases.length === 0) {
            outputError("No canvases found.");
            return;
        }
        outputTable(["Name", "UUID", "Nodes", "Updated", "Favorite"], canvases.map((c) => [
            c.name,
            c.uuid,
            String(c.element_count),
            formatDate(c.updated_at),
            c.is_favorite ? "⭐" : "",
        ]));
    });
    canvas
        .command("create")
        .description("Create a new canvas")
        .argument("<name>", "Canvas name (required)")
        .action(async (name) => {
        const result = await client.createCanvas(name);
        if (isJsonMode()) {
            outputJson(result);
            return;
        }
        outputSuccess(`Created canvas "${result.name}" (UUID: ${result.uuid})`);
    });
    canvas
        .command("get")
        .description("Get canvas details (list all nodes)")
        .argument("<uuid>", "Canvas UUID")
        .action(async (uuid) => {
        const elements = await client.getCanvasElements(uuid);
        if (isJsonMode()) {
            outputJson(elements);
            return;
        }
        if (elements.length === 0) {
            outputError("Canvas is empty — no nodes found.");
            return;
        }
        outputTable(["ID", "Type", "Label", "Position", "State", "Results", "Prompt"], elements.map((e) => [
            e.id,
            e.type,
            e.label ?? "",
            `(${Math.round(e.x)}, ${Math.round(e.y)})`,
            e.generationState ?? "",
            String(e.results_count),
            e.prompt ? truncate(e.prompt, 40) : "",
        ]));
    });
}
function formatDate(dateStr) {
    const d = new Date(dateStr + "Z");
    return d.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function truncate(str, maxLen) {
    return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}
//# sourceMappingURL=canvas.js.map