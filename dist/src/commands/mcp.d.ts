/**
 * `flowcanvas mcp`：stdio ↔ HTTP 的 MCP 桥接。
 *
 * FlowCanvas 后端在 POST /mcp 提供 Streamable HTTP 的 MCP server。Claude Code / Cursor 可直接连 HTTP；
 * Claude Desktop 等只支持 stdio 的客户端用本命令：
 *   { "command": "npx", "args": ["-y", "@flowcanvas/cli", "mcp"] }
 * 本命令只在传输层转发 JSON-RPC 消息，工具定义全部来自后端，CLI 无需随工具变化而升级。
 *
 * stdout 专用于 MCP 协议，日志一律写 stderr。
 */
import { Command } from "commander";
export declare function registerMcpCommand(program: Command): void;
