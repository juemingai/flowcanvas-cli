import chalk from "chalk";
import { isJsonMode, outputJson, outputTable } from "../output.js";
import { MINIMAX_VOICES, VOICE_LANG_GROUPS } from "../data/minimaxVoices.js";
export function registerVoicesCommand(program) {
    const voices = program.command("voices").description("Browse available voice IDs for TTS providers");
    voices
        .command("minimax")
        .description("List MiniMax system voice IDs (for use with --voice-id)")
        .option("--lang <language>", "Filter by language, e.g. '中文', '英文', '日文'")
        .option("--langs", "Show all available language groups")
        .action((opts) => {
        // --langs: show language groups summary
        if (opts.langs) {
            const groups = VOICE_LANG_GROUPS.map((lang) => {
                const count = MINIMAX_VOICES.filter((v) => v.lang === lang).length;
                return { lang, count };
            });
            if (isJsonMode()) {
                outputJson(groups);
                return;
            }
            outputTable(["语言", "音色数量"], groups.map((g) => [g.lang, String(g.count)]));
            return;
        }
        // Filter by language (partial match)
        const filtered = opts.lang
            ? MINIMAX_VOICES.filter((v) => v.lang.includes(opts.lang))
            : MINIMAX_VOICES;
        if (filtered.length === 0) {
            console.error(chalk.red("✗") +
                ` No voices found for language "${opts.lang}". Run \`flowcanvas voices minimax --langs\` to see available languages.`);
            process.exit(1);
        }
        if (isJsonMode()) {
            outputJson(filtered);
            return;
        }
        // Pretty mode: group by language
        const langGroups = [...new Set(filtered.map((v) => v.lang))];
        for (const lang of langGroups) {
            const group = filtered.filter((v) => v.lang === lang);
            console.log("\n" + chalk.cyan(`── ${lang} (${group.length}) ──`));
            outputTable(["Voice ID", "名称"], group.map((v) => [chalk.yellow(v.id), v.name]));
        }
        if (!opts.lang) {
            console.log(chalk.gray(`\n共 ${filtered.length} 个音色。使用 --lang <语言> 过滤，例如: --lang 中文`));
        }
    });
}
//# sourceMappingURL=voices.js.map