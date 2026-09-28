/**
 * 从后端 MCP 的 tools/list 动态生成子命令：每个 MCP 工具对应一条 `flowcanvas <tool-name>`。
 * 后端新增或修改工具时 CLI 自动跟随，无需改代码或发版。
 */
import { Option } from "commander";
import { callTool, submittedNodeIds, waitForNodes } from "../mcpClient.js";
import { isJsonMode, outputData, outputInfo, outputTable } from "../output.js";
import { buildArguments, describeParam, paramSpecs, toCommandName } from "../toolSchema.js";
const DEFAULT_WAIT_TIMEOUT = 1800;
function summary(tool) {
    return (tool.description ?? "").split("\n")[0].trim();
}
/** 调用外部 AI 提供商的生成类工具（后端标注 openWorldHint） */
function isGenerateTool(tool) {
    return tool.annotations?.openWorldHint === true;
}
function toolKind(tool) {
    const a = tool.annotations;
    if (a?.openWorldHint)
        return "generate";
    if (a?.readOnlyHint)
        return "read";
    if (a?.destructiveHint)
        return "destructive";
    return "write";
}
function registerToolCommand(program, client, tool) {
    const specs = paramSpecs(tool.inputSchema);
    const cmd = program
        .command(toCommandName(tool.name))
        .description(summary(tool))
        .addHelpText("after", `\n说明 / Details:\n  ${(tool.description ?? "").trim()}\n`);
    for (const spec of specs) {
        const desc = describeParam(spec);
        if (spec.kind === "boolean") {
            cmd.addOption(new Option(`--${spec.flag}`, desc));
            cmd.addOption(new Option(`--no-${spec.flag}`, `关闭 --${spec.flag}`));
            continue;
        }
        const opt = new Option(`--${spec.flag} <value>`, desc);
        if (spec.kind.endsWith("[]")) {
            opt.argParser((value, prev) => [...(prev ?? []), value]);
        }
        cmd.addOption(opt);
    }
    cmd.addOption(new Option("--json <object>", "以 JSON 对象传入全部参数（单独给出的参数优先）"));
    const generate = isGenerateTool(tool);
    if (generate) {
        cmd.addOption(new Option("--wait", "提交后等待生成完成并返回结果（内部调用 wait_for_nodes）"));
        cmd.addOption(new Option("--wait-timeout <seconds>", `--wait 的最长等待秒数，默认 ${DEFAULT_WAIT_TIMEOUT}`));
    }
    cmd.action(async (opts) => {
        const args = buildArguments(specs, opts, opts.json);
        const data = await callTool(client, tool.name, args, tool);
        if (!(generate && opts.wait)) {
            outputData(data);
            return;
        }
        const nodeIds = submittedNodeIds(data);
        const canvasId = args.canvas_id;
        if (!nodeIds.length || typeof canvasId !== "string") {
            outputData(data);
            return;
        }
        const timeout = opts.waitTimeout !== undefined ? Number(opts.waitTimeout) : DEFAULT_WAIT_TIMEOUT;
        if (!Number.isFinite(timeout) || timeout <= 0) {
            throw new Error(`--wait-timeout 需要正数秒数，收到 ${JSON.stringify(opts.waitTimeout)}`);
        }
        outputInfo(`已提交，等待生成完成：${nodeIds.join(", ")}`);
        const waited = await waitForNodes(client, canvasId, nodeIds, timeout);
        outputData({ submitted: data, ...waited });
        if (!waited.done) {
            process.stderr.write(`仍在生成中，可稍后运行：flowcanvas wait-for-nodes --canvas-id ${canvasId} ` +
                nodeIds.map((id) => `--node-ids ${id}`).join(" ") +
                "\n");
        }
    });
}
export function registerToolCommands(program, client, tools) {
    const byName = new Map(tools.map((t) => [t.name, t]));
    program
        .command("tools")
        .description("列出 FlowCanvas 提供的全部工具（与 MCP tools/list 一致）")
        .action(() => {
        const rows = tools.map((t) => ({
            tool: t.name,
            command: `flowcanvas ${toCommandName(t.name)}`,
            kind: toolKind(t),
            description: summary(t),
        }));
        if (isJsonMode()) {
            outputData(rows);
            return;
        }
        outputTable(["命令", "类型", "说明"], rows.map((r) => [r.command, r.kind, r.description]));
    });
    program
        .command("call")
        .description("按 MCP 工具原名调用，参数以 JSON 传入：flowcanvas call <tool> --json '{...}'")
        .argument("<tool>", "MCP 工具名，如 generate_image")
        .option("--json <object>", "工具参数（JSON 对象）", "{}")
        .action(async (name, opts) => {
        const tool = byName.get(name) ?? byName.get(name.replace(/-/g, "_"));
        if (!tool)
            throw new Error(`未知工具 ${name}；运行 flowcanvas tools 查看全部工具`);
        const args = buildArguments(paramSpecs(tool.inputSchema), {}, opts.json);
        outputData(await callTool(client, tool.name, args, tool));
    });
    const taken = new Set(program.commands.map((c) => c.name()));
    for (const tool of tools) {
        // 与 CLI 自带命令重名的工具仍可经 `flowcanvas call <tool>` 调用
        if (!taken.has(toCommandName(tool.name)))
            registerToolCommand(program, client, tool);
    }
}
//# sourceMappingURL=tools.js.map