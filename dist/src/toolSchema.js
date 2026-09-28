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
/** CLI 自身占用的 flag；与之同名的工具参数改用 --arg-<name> */
const RESERVED_FLAGS = new Set(["help", "json", "wait", "wait-timeout", "server", "pretty", "version"]);
export function toCommandName(toolName) {
    return toolName.replace(/_/g, "-");
}
/** 与 commander 的 camelcase 保持一致：--canvas-id → canvasId */
function flagToKey(flag) {
    return flag.split("-").reduce((acc, word) => acc + word[0].toUpperCase() + word.slice(1));
}
/** Optional[X] 在 schema 里是 anyOf: [X, null]，取出 X */
function unwrapNullable(schema) {
    if (!schema.anyOf)
        return schema;
    const nonNull = schema.anyOf.filter((s) => s.type !== "null");
    return nonNull.length === 1 ? { ...nonNull[0], default: schema.default } : schema;
}
function scalarKind(schema) {
    const t = schema.type;
    if (t === "string" || t === "integer" || t === "number" || t === "boolean")
        return t;
    if (!t && schema.enum?.every((v) => typeof v === "string"))
        return "string";
    return null;
}
/** Literal 多个取值生成 enum，单个取值生成 const */
function stringChoices(schema) {
    if (typeof schema.const === "string")
        return [schema.const];
    return schema.enum?.every((v) => typeof v === "string") ? schema.enum : undefined;
}
export function paramSpecs(inputSchema) {
    const required = new Set(inputSchema.required ?? []);
    return Object.entries(inputSchema.properties ?? {}).map(([name, raw]) => {
        const schema = unwrapNullable(raw);
        let flag = name.replace(/_/g, "-");
        if (RESERVED_FLAGS.has(flag))
            flag = `arg-${flag}`;
        let kind = "json";
        let choices;
        const scalar = scalarKind(schema);
        if (scalar) {
            kind = scalar;
            choices = stringChoices(schema);
        }
        else if (schema.type === "array" && schema.items) {
            const item = unwrapNullable(schema.items);
            const itemKind = scalarKind(item);
            if (itemKind && itemKind !== "boolean") {
                kind = `${itemKind}[]`;
                choices = stringChoices(item);
            }
        }
        return {
            name,
            flag,
            key: flagToKey(flag),
            kind,
            required: required.has(name),
            ...(choices ? { choices } : {}),
            ...(schema.default !== undefined ? { default: schema.default } : {}),
        };
    });
}
function toNumber(spec, raw, integer) {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n) || (integer && !Number.isInteger(n))) {
        throw new Error(`--${spec.flag} 需要${integer ? "整数" : "数字"}，收到 ${JSON.stringify(raw)}`);
    }
    return n;
}
function checkChoice(spec, value) {
    if (spec.choices && !spec.choices.includes(value)) {
        throw new Error(`--${spec.flag} 的取值必须是 ${spec.choices.join(" | ")}，收到 ${JSON.stringify(value)}`);
    }
    return value;
}
/** 把 commander 解析出的原始值转成工具参数值 */
export function coerceValue(spec, raw) {
    switch (spec.kind) {
        case "boolean":
            return Boolean(raw);
        case "string":
            return checkChoice(spec, String(raw));
        case "integer":
        case "number":
            return toNumber(spec, String(raw), spec.kind === "integer");
        case "string[]":
            return raw.map((v) => checkChoice(spec, v));
        case "integer[]":
        case "number[]":
            return raw.map((v) => toNumber(spec, v, spec.kind === "integer[]"));
        case "json":
            try {
                return JSON.parse(String(raw));
            }
            catch {
                throw new Error(`--${spec.flag} 需要合法的 JSON，收到 ${JSON.stringify(raw)}`);
            }
    }
}
/** 合并 --json 与单独参数，校验必填项，得到工具调用的 arguments */
export function buildArguments(specs, opts, jsonArg) {
    let args = {};
    if (jsonArg !== undefined) {
        let parsed;
        try {
            parsed = JSON.parse(jsonArg);
        }
        catch {
            throw new Error(`--json 需要合法的 JSON 对象，收到 ${JSON.stringify(jsonArg)}`);
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("--json 需要 JSON 对象，例如 '{\"canvas_id\": \"...\"}'");
        }
        args = { ...parsed };
    }
    for (const spec of specs) {
        const raw = opts[spec.key];
        if (raw !== undefined)
            args[spec.name] = coerceValue(spec, raw);
    }
    const missing = specs.filter((s) => s.required && args[s.name] === undefined);
    if (missing.length) {
        throw new Error(`缺少必填参数：${missing.map((s) => `--${s.flag}`).join(", ")}`);
    }
    return args;
}
/** 选项说明：类型、必填、默认值 */
export function describeParam(spec) {
    const type = spec.choices ? spec.choices.join(" | ") : spec.kind === "json" ? "JSON" : spec.kind;
    const parts = [type];
    if (spec.kind.endsWith("[]"))
        parts.push("可重复");
    if (spec.required)
        parts.push("必填");
    if (spec.default !== undefined && spec.default !== null)
        parts.push(`默认 ${JSON.stringify(spec.default)}`);
    return parts.join("，");
}
//# sourceMappingURL=toolSchema.js.map