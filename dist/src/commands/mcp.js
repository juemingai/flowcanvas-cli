import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { resolveServerUrl } from "../server.js";
import { NOT_RUNNING } from "../mcpClient.js";
function log(msg) {
    process.stderr.write(`[flowcanvas-mcp] ${msg}\n`);
}
function hasId(msg) {
    return "id" in msg && msg.id !== undefined && "method" in msg;
}
export function registerMcpCommand(program) {
    program
        .command("mcp")
        .description("Run a stdio MCP server bridged to the local FlowCanvas app (for Claude Desktop etc.)")
        .action(async () => {
        const serverOpt = program.opts().server;
        const stdio = new StdioServerTransport();
        let http = null;
        let connecting = null;
        // 懒连接：首条消息到来时才解析地址并连接；FlowCanvas 后启动也能工作
        const getHttp = async () => {
            if (http)
                return http;
            if (!connecting) {
                connecting = (async () => {
                    const base = await resolveServerUrl(serverOpt);
                    const t = new StreamableHTTPClientTransport(new URL(`${base}/mcp`));
                    t.onmessage = (msg) => void stdio.send(msg);
                    t.onerror = (err) => log(`HTTP transport error: ${err.message}`);
                    t.onclose = () => {
                        http = null;
                        connecting = null;
                    };
                    await t.start();
                    log(`forwarding to ${base}/mcp`);
                    http = t;
                    return t;
                })().catch((err) => {
                    connecting = null;
                    throw err;
                });
            }
            return connecting;
        };
        stdio.onmessage = async (msg) => {
            try {
                const t = await getHttp();
                await t.send(msg);
            }
            catch (err) {
                const reason = err.message || String(err);
                log(`forward failed: ${reason}`);
                http = null;
                connecting = null;
                if (hasId(msg)) {
                    await stdio.send({
                        jsonrpc: "2.0",
                        id: msg.id,
                        error: { code: -32000, message: `${NOT_RUNNING} (${reason})` },
                    });
                }
            }
        };
        stdio.onclose = () => {
            void http?.close();
            process.exit(0);
        };
        // StdioServerTransport 不监听 stdin 结束；客户端关闭 stdin 即断开连接，需主动退出
        process.stdin.on("end", () => void stdio.close());
        await stdio.start();
        log("stdio bridge ready");
        // 保持进程存活，直到 stdin 关闭
        await new Promise(() => { });
    });
}
//# sourceMappingURL=mcp.js.map