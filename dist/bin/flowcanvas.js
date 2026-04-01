#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "module";
import { FlowCanvasClient } from "../src/client.js";
import { setJsonMode, outputError } from "../src/output.js";
import { registerHealthCommand } from "../src/commands/health.js";
import { registerCanvasCommand } from "../src/commands/canvas.js";
import { registerNodeCommand } from "../src/commands/node.js";
import { registerEdgeCommand } from "../src/commands/edge.js";
import { registerConfigCommand } from "../src/commands/config-list.js";
import { registerGenerateCommand } from "../src/commands/generate.js";
import { registerVoicesCommand } from "../src/commands/voices.js";
const require = createRequire(import.meta.url);
const { version } = require("../../package.json");
const program = new Command();
// Use a lazy-initialized client so --server flag is resolved before use
let _client = null;
function getClient() {
    if (!_client) {
        const opts = program.opts();
        _client = new FlowCanvasClient(opts.server);
    }
    return _client;
}
// Proxy that creates the client on first property access
const clientProxy = new Proxy({}, {
    get(_target, prop) {
        const real = getClient();
        const value = real[prop];
        if (typeof value === "function") {
            return value.bind(real);
        }
        return value;
    },
});
program
    .name("flowcanvas")
    .description("FlowCanvas CLI — operate FlowCanvas canvases from the command line")
    .version(version)
    .option("--pretty", "Output in human-readable format (tables and colors)")
    .option("--server <url>", "FlowCanvas server URL", "http://localhost:8000")
    .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.pretty)
        setJsonMode(false);
});
registerHealthCommand(program, clientProxy);
registerCanvasCommand(program, clientProxy);
registerNodeCommand(program, clientProxy);
registerEdgeCommand(program, clientProxy);
registerConfigCommand(program, clientProxy);
registerGenerateCommand(program, clientProxy);
registerVoicesCommand(program);
program.parseAsync(process.argv).catch((err) => {
    outputError(err.message);
    process.exit(1);
});
//# sourceMappingURL=flowcanvas.js.map