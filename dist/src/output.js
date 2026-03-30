import chalk from "chalk";
import Table from "cli-table3";
let jsonMode = false;
export function setJsonMode(enabled) {
    jsonMode = enabled;
}
export function isJsonMode() {
    return jsonMode;
}
export function outputJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
export function outputTable(headers, rows) {
    const table = new Table({ head: headers.map((h) => chalk.cyan(h)) });
    for (const row of rows) {
        table.push(row);
    }
    console.log(table.toString());
}
export function outputSuccess(message) {
    if (jsonMode)
        return;
    console.log(chalk.green("✓") + " " + message);
}
export function outputError(message) {
    console.error(chalk.red("✗") + " " + message);
}
export function outputInfo(message) {
    if (jsonMode)
        return;
    console.log(chalk.blue("ℹ") + " " + message);
}
//# sourceMappingURL=output.js.map