/**
 * 解析 FlowCanvas 后端地址。
 *
 * 优先级：--server 参数 > 环境变量 FLOWCANVAS_API_BASE > ~/.flowcanvas/runtime.json（后端启动时写入的实际端口）
 * > 探测桌面端固定端口 28765 > 探测开发模式 8000。
 * 桌面端端口被占用时会顺延（28765→28774），所以 runtime.json 是最可靠的来源。
 */
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
export const DESKTOP_PORT = 28765;
export const DEV_PORT = 8000;
export const RUNTIME_FILE = join(homedir(), ".flowcanvas", "runtime.json");
function isAlive(pid) {
    if (!pid)
        return true;
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (err) {
        // EPERM：进程存在但无权发信号，也算存活
        return err.code === "EPERM";
    }
}
function readRuntimeBase() {
    try {
        const info = JSON.parse(readFileSync(RUNTIME_FILE, "utf-8"));
        return info.api_base && isAlive(info.pid) ? info.api_base : null;
    }
    catch {
        return null;
    }
}
export async function isFlowCanvas(base) {
    try {
        const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1500) });
        if (!res.ok)
            return false;
        const data = (await res.json());
        return data.app === "flowcanvas";
    }
    catch {
        return false;
    }
}
/** 候选地址（不做网络探测），按优先级排列 */
export function candidateBases(explicit) {
    const list = [
        explicit,
        process.env.FLOWCANVAS_API_BASE,
        readRuntimeBase(),
        `http://127.0.0.1:${DESKTOP_PORT}`,
        `http://127.0.0.1:${DEV_PORT}`,
    ].filter((x) => !!x);
    return [...new Set(list.map((b) => b.replace(/\/+$/, "")))];
}
/**
 * 返回第一个可连通的 FlowCanvas 地址；显式指定（参数/环境变量）时直接信任。
 * 都连不上时返回首个候选，让调用方给出「请先启动 FlowCanvas」的提示。
 */
export async function resolveServerUrl(explicit) {
    const pinned = explicit || process.env.FLOWCANVAS_API_BASE;
    if (pinned)
        return pinned.replace(/\/+$/, "");
    const candidates = candidateBases();
    for (const base of candidates) {
        if (await isFlowCanvas(base))
            return base;
    }
    return candidates[0];
}
//# sourceMappingURL=server.js.map