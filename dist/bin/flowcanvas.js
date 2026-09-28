#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "module";
import { setJsonMode, outputError } from "../src/output.js";
import { registerHealthCommand } from "../src/commands/health.js";
import { registerMcpCommand } from "../src/commands/mcp.js";
import { registerToolCommands } from "../src/commands/tools.js";
import { connectMcp, listTools, NOT_RUNNING } from "../src/mcpClient.js";
import { resolveServerUrl } from "../src/server.js";
const require = createRequire(import.meta.url);
const { version } = require("../../package.json");
/** 不需要连接 MCP 的命令（mcp 桥接自行懒连接，FlowCanvas 可能晚于客户端启动） */
const OFFLINE_COMMANDS = new Set(["mcp", "health"]);
/** commander 解析前预扫 argv：工具命令要先连 MCP 拿到工具列表才能注册 */
function scanArgv(argv) {
    let server;
    let command;
    let pretty = false;
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--server")
            server = argv[++i];
        else if (a.startsWith("--server="))
            server = a.slice("--server=".length);
        else if (a === "--pretty")
            pretty = true;
        else if (!command && !a.startsWith("-"))
            command = a;
    }
    return { server, command, pretty };
}
async function main() {
    const { server, command, pretty } = scanArgv(process.argv.slice(2));
    if (pretty)
        setJsonMode(false);
    const program = new Command();
    program
        .name("flowcanvas")
        .description("FlowCanvas CLI — 命令与 FlowCanvas MCP 工具一一对应（flowcanvas tools 查看全部）。" +
        "Every command maps 1:1 to a FlowCanvas MCP tool.")
        .version(version)
        .option("--pretty", "Output in human-readable format")
        .option("--server <url>", "FlowCanvas server URL (default: auto-detect via FLOWCANVAS_API_BASE, ~/.flowcanvas/runtime.json, :28765, :8000)");
    registerHealthCommand(program, () => resolveServerUrl(server));
    registerMcpCommand(program);
    let client = null;
    if (!command || !OFFLINE_COMMANDS.has(command)) {
        const base = await resolveServerUrl(server);
        try {
            client = await connectMcp(base, version);
            registerToolCommands(program, client, await listTools(client));
        }
        catch (err) {
            await client?.close().catch(() => { });
            client = null;
            const reason = `${NOT_RUNNING} (${base}: ${err.message})`;
            if (command && command !== "help") {
                outputError(reason);
                process.exit(1);
            }
            program.addHelpText("after", `\n${reason}\n工具命令需在 FlowCanvas 运行时才能列出。\n`);
        }
    }
    try {
        await program.parseAsync(process.argv);
    }
    finally {
        await client?.close().catch(() => { });
    }
}
main().catch((err) => {
    outputError(err.message);
    process.exit(1);
});
//# sourceMappingURL=flowcanvas.js.map