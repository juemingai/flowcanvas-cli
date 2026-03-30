import chalk from "chalk";
import { isJsonMode, outputJson, outputTable, outputError } from "../output.js";
function formatOptions(field) {
    if (field.type === "boolean")
        return "true / false";
    if (field.type === "range") {
        const step = field.step !== undefined ? ` (step ${field.step})` : "";
        return `${field.min} ~ ${field.max}${step}`;
    }
    if (field.type === "file[]") {
        return field.max_count ? `文件 (最多 ${field.max_count} 张)` : "文件";
    }
    if (field.type === "select" && field.options) {
        const parts = field.options.map((o) => {
            if (typeof o === "object" && o !== null && "value" in o) {
                return o.label !== o.value ? `${o.value}(${o.label})` : String(o.value);
            }
            return String(o);
        });
        const joined = parts.join(", ");
        // Truncate if too long
        return joined.length > 60 ? joined.slice(0, 57) + "..." : joined;
    }
    return "-";
}
function printModelSchema(modelKey, modelName, schema) {
    console.log("\n" + chalk.bold(`▸ Model: ${modelName} (key: ${modelKey})`));
    // Filter out non-field entries (e.g. video_modes array metadata)
    const entries = Object.entries(schema).filter(([, v]) => {
        return typeof v === "object" && v !== null && !Array.isArray(v) && "type" in v;
    });
    if (entries.length === 0) {
        console.log(chalk.gray("  该模型暂无参数定义"));
        return;
    }
    // Skip category fields (read-only metadata)
    const paramEntries = entries.filter(([, v]) => v.type !== "category");
    if (paramEntries.length === 0) {
        console.log(chalk.gray("  该模型暂无可配置参数"));
        return;
    }
    outputTable(["参数名", "类型", "必填", "默认值", "可选值/范围", "说明"], paramEntries.map(([key, v]) => {
        const field = v;
        return [
            key,
            field.type,
            field.required ? chalk.yellow("是") : "否",
            field.default !== undefined ? String(field.default) : "-",
            formatOptions(field),
            field.description ?? field.label ?? "-",
        ];
    }));
}
export function registerConfigCommand(program, client) {
    const config = program.command("config").description("Manage model configurations");
    config
        .command("list")
        .description("List available model configurations")
        .option("--type <type>", "Filter by model type: image, video, audio")
        .action(async (opts) => {
        const modelType = opts.type;
        // When no type specified, fetch all three types
        let configs;
        if (modelType) {
            configs = await client.getAvailableConfigs(modelType);
        }
        else {
            const [image, video, audio] = await Promise.all([
                client.getAvailableConfigs("image"),
                client.getAvailableConfigs("video"),
                client.getAvailableConfigs("audio"),
            ]);
            configs = [...image, ...video, ...audio];
        }
        if (isJsonMode()) {
            outputJson(configs);
            return;
        }
        if (configs.length === 0) {
            outputError("No configurations found. Add one in FlowCanvas Settings.");
            return;
        }
        outputTable(["Config ID", "Name", "Provider", "Type", "Models"], configs.map((c) => [
            String(c.config_id),
            c.config_name,
            c.provider.display_name,
            c.provider.model_type,
            c.models.map((m) => m.display_name).join(", "),
        ]));
    });
    config
        .command("params")
        .description("Show supported parameters for a model configuration")
        .argument("<config_id>", "Config ID (from `flowcanvas config list`)")
        .option("--model <model_key>", "Show params for a specific model only")
        .action(async (configIdStr, opts) => {
        const configId = parseInt(configIdStr, 10);
        if (isNaN(configId)) {
            outputError("Invalid config_id — must be a number.");
            process.exit(1);
        }
        // Fetch all types to find the config
        const [image, video, audio] = await Promise.all([
            client.getAvailableConfigs("image"),
            client.getAvailableConfigs("video"),
            client.getAvailableConfigs("audio"),
        ]);
        const allConfigs = [...image, ...video, ...audio];
        const cfg = allConfigs.find((c) => c.config_id === configId);
        if (!cfg) {
            outputError(`Config ${configId} not found. Run \`flowcanvas config list\` to see available configs.`);
            process.exit(1);
        }
        // Filter models if --model specified
        const models = opts.model
            ? cfg.models.filter((m) => m.name === opts.model)
            : cfg.models;
        if (opts.model && models.length === 0) {
            outputError(`Model "${opts.model}" not found in config ${configId}. Available models: ${cfg.models.map((m) => m.name).join(", ")}`);
            process.exit(1);
        }
        if (isJsonMode()) {
            outputJson(models.map((m) => ({
                model_key: m.name,
                model_name: m.display_name,
                parameter_schema: m.parameter_schema ?? {},
            })));
            return;
        }
        console.log(chalk.cyan(`Config: ${cfg.config_name} (ID: ${cfg.config_id}) — ${cfg.provider.display_name} [${cfg.provider.model_type}]`));
        for (const model of models) {
            if (!model.parameter_schema || Object.keys(model.parameter_schema).length === 0) {
                console.log("\n" + chalk.bold(`▸ Model: ${model.display_name} (key: ${model.name})`));
                console.log(chalk.gray("  该模型暂无参数定义"));
                continue;
            }
            printModelSchema(model.name, model.display_name, model.parameter_schema);
        }
        console.log();
    });
}
//# sourceMappingURL=config-list.js.map