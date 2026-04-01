export type ModelSchemaFieldType = "string" | "select" | "boolean" | "range" | "file[]" | "category";
export interface ModelSchemaField {
    type: ModelSchemaFieldType;
    label?: string;
    required?: boolean;
    default?: unknown;
    description?: string;
    options?: Array<string | number | {
        value: string | number;
        label: string;
    }>;
    min?: number;
    max?: number;
    step?: number;
    max_count?: number;
    value?: unknown;
}
export interface ModelSchema {
    [key: string]: ModelSchemaField | unknown;
}
export interface AvailableConfig {
    config_id: number;
    config_name: string;
    provider: {
        id: number;
        name: string;
        display_name: string;
        model_type: string;
    };
    models: Array<{
        id: number;
        name: string;
        display_name: string;
        parameter_schema?: ModelSchema;
    }>;
}
export interface TaskResult {
    task_id: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress: number;
    results?: Record<string, unknown>;
    error?: string;
}
export interface ElementSummary {
    id: string;
    type: string;
    x: number;
    y: number;
    label?: string | null;
    generationState?: string | null;
    results_count: number;
    prompt?: string | null;
}
export interface EdgeResult {
    id: string;
    sourceId: string;
    targetId: string;
}
export interface CanvasItem {
    id: number;
    uuid: string;
    name: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
    element_count: number;
}
export interface CanvasDetail {
    uuid: string;
    name: string;
    elements: unknown[];
    edges: unknown[];
}
export declare class FlowCanvasClient {
    private baseUrl;
    constructor(baseUrl?: string);
    checkHealth(): Promise<boolean>;
    listCanvases(): Promise<CanvasItem[]>;
    createCanvas(name: string): Promise<{
        uuid: string;
        name: string;
    }>;
    getCanvasElements(canvasUuid: string): Promise<ElementSummary[]>;
    addCanvasElement(canvasUuid: string, type: string, x?: number, y?: number, label?: string): Promise<ElementSummary>;
    deleteCanvasElement(canvasUuid: string, elementId: string): Promise<void>;
    addCanvasEdge(canvasUuid: string, sourceId: string, targetId: string): Promise<EdgeResult>;
    getAvailableConfigs(modelType?: "image" | "video" | "audio"): Promise<AvailableConfig[]>;
    generateImageAsync(params: {
        config_id: number;
        model_key: string;
        prompt: string;
        aspect_ratio?: string;
        resolution?: string;
        count?: number;
        canvas_id?: string;
        image_urls?: string[];
    }): Promise<{
        task_id: string;
    }>;
    generateVideoAsync(params: {
        config_id: number;
        model_key: string;
        prompt?: string;
        duration?: number;
        resolution?: string;
        ratio?: string;
        canvas_id?: string;
        image_urls?: string[];
    }): Promise<{
        task_id: string;
    }>;
    generateAudioAsync(params: {
        config_id: number;
        model_key: string;
        prompt: string;
        custom_mode?: boolean;
        instrumental?: boolean;
        style?: string;
        title?: string;
        vocal_gender?: string;
        canvas_id?: string;
        voice_id?: string;
        emotion?: string;
        speed?: number;
        vol?: number;
        pitch?: number;
    }): Promise<{
        task_id: string;
    }>;
    getTask(taskId: string): Promise<TaskResult>;
    getCanvasDetail(uuid: string): Promise<CanvasDetail>;
    updateCanvasElements(uuid: string, elements: unknown[]): Promise<void>;
}
