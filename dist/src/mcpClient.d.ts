import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const NOT_RUNNING: string;
export declare function connectMcp(base: string, version: string): Promise<Client>;
export declare function listTools(client: Client): Promise<Tool[]>;
/** 工具结果 → CLI 输出数据；工具报错时抛出，由调用方统一输出错误并以非 0 退出 */
export declare function resultData(result: Record<string, unknown>, tool?: Tool): unknown;
export declare function callTool(client: Client, name: string, args: Record<string, unknown>, tool?: Tool): Promise<unknown>;
/** 生成类工具返回的 node_id / node_ids */
export declare function submittedNodeIds(data: unknown): string[];
/** 反复调用 wait_for_nodes，直到全部完成或超过 timeoutSeconds */
export declare function waitForNodes(client: Client, canvasId: string, nodeIds: string[], timeoutSeconds: number): Promise<Record<string, unknown>>;
