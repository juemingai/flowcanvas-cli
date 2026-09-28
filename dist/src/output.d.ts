export declare function setJsonMode(enabled: boolean): void;
export declare function isJsonMode(): boolean;
export declare function outputJson(data: unknown): void;
/** 工具结果：JSON 模式带 {ok, data} 信封；--pretty 模式直接缩进打印 */
export declare function outputData(data: unknown): void;
export declare function outputTable(headers: string[], rows: string[][]): void;
export declare function outputSuccess(message: string): void;
export declare function outputError(message: string): void;
export declare function outputInfo(message: string): void;
