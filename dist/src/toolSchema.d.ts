/**
 * MCP 工具 inputSchema（JSON Schema）→ 命令行参数的映射与取值转换。纯函数，不依赖 commander。
 *
 * 映射规则：参数名 snake_case → --kebab-case；
 *   string / integer / number → --flag <value>（有 enum 时限定取值）
 *   boolean                   → --flag / --no-flag
 *   标量数组                   → 可重复的 --flag <value>
 *   对象、对象数组等其它类型     → --flag <json>
 * 另有 --json <object> 一次性传入全部参数（单独给出的参数优先）。
 */
export interface JsonSchema {
    type?: string | string[];
    anyOf?: JsonSchema[];
    enum?: unknown[];
    const?: unknown;
    items?: JsonSchema;
    default?: unknown;
    title?: string;
    description?: string;
    properties?: Record<string, JsonSchema>;
    required?: string[];
}
export type ParamKind = "string" | "integer" | "number" | "boolean" | "string[]" | "integer[]" | "number[]" | "json";
export interface ParamSpec {
    /** MCP 参数名（snake_case） */
    name: string;
    /** 命令行 flag（不含 --） */
    flag: string;
    /** commander 解析后 opts 中的键名 */
    key: string;
    kind: ParamKind;
    required: boolean;
    choices?: string[];
    default?: unknown;
}
export declare function toCommandName(toolName: string): string;
export declare function paramSpecs(inputSchema: JsonSchema): ParamSpec[];
/** 把 commander 解析出的原始值转成工具参数值 */
export declare function coerceValue(spec: ParamSpec, raw: unknown): unknown;
/** 合并 --json 与单独参数，校验必填项，得到工具调用的 arguments */
export declare function buildArguments(specs: ParamSpec[], opts: Record<string, unknown>, jsonArg?: string): Record<string, unknown>;
/** 选项说明：类型、必填、默认值 */
export declare function describeParam(spec: ParamSpec): string;
