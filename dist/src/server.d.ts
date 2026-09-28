export declare const DESKTOP_PORT = 28765;
export declare const DEV_PORT = 8000;
export declare const RUNTIME_FILE: string;
export declare function isFlowCanvas(base: string): Promise<boolean>;
/** 候选地址（不做网络探测），按优先级排列 */
export declare function candidateBases(explicit?: string): string[];
/**
 * 返回第一个可连通的 FlowCanvas 地址；显式指定（参数/环境变量）时直接信任。
 * 都连不上时返回首个候选，让调用方给出「请先启动 FlowCanvas」的提示。
 */
export declare function resolveServerUrl(explicit?: string): Promise<string>;
