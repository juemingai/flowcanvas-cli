/**
 * CLI 与 FlowCanvas 后端 MCP（POST /mcp）之间的客户端：连接、调用工具、解析结果。
 * CLI 不实现任何业务能力，全部转成 MCP 工具调用，保证与 MCP 接入方式能力一致。
 */
import { mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
export const NOT_RUNNING = "无法连接 FlowCanvas。请先启动 FlowCanvas 桌面端（或开发模式后端），再重试。" +
    "Cannot reach FlowCanvas — please start the FlowCanvas app first.";
/** wait_for_nodes 单次最长约 280 秒，请求超时要留余量；有进度通知时重置计时 */
const CALL_OPTIONS = { timeout: 300_000, resetTimeoutOnProgress: true };
const WAIT_CHUNK_SECONDS = 280;
export async function connectMcp(base, version) {
    const client = new Client({ name: "flowcanvas-cli", version });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
    return client;
}
export async function listTools(client) {
    const tools = [];
    let cursor;
    do {
        const page = await client.listTools(cursor ? { cursor } : undefined);
        tools.push(...page.tools);
        cursor = page.nextCursor;
    } while (cursor);
    return tools;
}
function parseText(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
function saveImage(item) {
    const ext = (item.mimeType ?? "image/png").split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    const dir = join(tmpdir(), "flowcanvas-cli");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
    writeFileSync(file, Buffer.from(item.data ?? "", "base64"));
    return { image_path: file, mime_type: item.mimeType };
}
/**
 * FastMCP 把返回值包成 {"result": ...}，其 outputSchema 只有 result 一个属性；
 * 未提供工具定义时按结构化结果本身只有 result 一个键判断。
 */
function isWrappedOutput(structured, tool) {
    const keys = Object.keys(tool?.outputSchema?.properties ?? structured);
    return keys.length === 1 && keys[0] === "result";
}
/** 工具结果 → CLI 输出数据；工具报错时抛出，由调用方统一输出错误并以非 0 退出 */
export function resultData(result, tool) {
    const content = result.content ?? [];
    if (result.isError) {
        const message = content.map((c) => c.text).filter(Boolean).join("\n");
        throw new Error(message || "工具调用失败");
    }
    const structured = result.structuredContent;
    if (structured) {
        return isWrappedOutput(structured, tool) ? structured.result : structured;
    }
    const items = content.map((c) => {
        if (c.type === "text")
            return parseText(c.text ?? "");
        if (c.type === "image")
            return saveImage(c);
        return c;
    });
    return items.length === 1 ? items[0] : items;
}
export async function callTool(client, name, args, tool) {
    const result = await client.callTool({ name, arguments: args }, undefined, CALL_OPTIONS);
    return resultData(result, tool);
}
/** 生成类工具返回的 node_id / node_ids */
export function submittedNodeIds(data) {
    if (!data || typeof data !== "object")
        return [];
    const d = data;
    if (typeof d.node_id === "string")
        return [d.node_id];
    if (Array.isArray(d.node_ids))
        return d.node_ids.filter((x) => typeof x === "string");
    return [];
}
/** 反复调用 wait_for_nodes，直到全部完成或超过 timeoutSeconds */
export async function waitForNodes(client, canvasId, nodeIds, timeoutSeconds) {
    const deadline = Date.now() + timeoutSeconds * 1000;
    for (;;) {
        const remaining = Math.ceil((deadline - Date.now()) / 1000);
        const res = (await callTool(client, "wait_for_nodes", {
            canvas_id: canvasId,
            node_ids: nodeIds,
            timeout_seconds: Math.max(5, Math.min(WAIT_CHUNK_SECONDS, remaining)),
        }));
        if (res.done || Date.now() >= deadline)
            return res;
    }
}
//# sourceMappingURL=mcpClient.js.map