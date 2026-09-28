/**
 * 从后端 MCP 的 tools/list 动态生成子命令：每个 MCP 工具对应一条 `flowcanvas <tool-name>`。
 * 后端新增或修改工具时 CLI 自动跟随，无需改代码或发版。
 */
import { Command } from "commander";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare function registerToolCommands(program: Command, client: Client, tools: Tool[]): void;
