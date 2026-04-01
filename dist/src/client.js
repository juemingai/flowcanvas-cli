export class FlowCanvasClient {
    baseUrl;
    constructor(baseUrl = "http://localhost:8000") {
        this.baseUrl = baseUrl;
    }
    async checkHealth() {
        try {
            const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
            return res.ok;
        }
        catch {
            return false;
        }
    }
    async listCanvases() {
        const res = await fetch(`${this.baseUrl}/api/canvases?limit=50`);
        if (!res.ok)
            throw new Error(`Failed to list canvases: ${res.status}`);
        return res.json();
    }
    async createCanvas(name) {
        const res = await fetch(`${this.baseUrl}/api/canvases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to create canvas: ${err}`);
        }
        return res.json();
    }
    async getCanvasElements(canvasUuid) {
        const res = await fetch(`${this.baseUrl}/api/canvases/${canvasUuid}/elements`);
        if (!res.ok)
            throw new Error(`Failed to get canvas elements: ${res.status}`);
        return res.json();
    }
    async addCanvasElement(canvasUuid, type, x, y, label) {
        const res = await fetch(`${this.baseUrl}/api/canvases/${canvasUuid}/elements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, x, y, custom_label: label }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to add element: ${err}`);
        }
        return res.json();
    }
    async deleteCanvasElement(canvasUuid, elementId) {
        const res = await fetch(`${this.baseUrl}/api/canvases/${canvasUuid}/elements/${elementId}`, {
            method: "DELETE",
        });
        if (!res.ok && res.status !== 204) {
            const err = await res.text();
            throw new Error(`Failed to delete element: ${err}`);
        }
    }
    async addCanvasEdge(canvasUuid, sourceId, targetId) {
        const res = await fetch(`${this.baseUrl}/api/canvases/${canvasUuid}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source_id: sourceId, target_id: targetId }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to add edge: ${err}`);
        }
        return res.json();
    }
    async getAvailableConfigs(modelType) {
        const query = modelType ? `?model_type=${modelType}` : "";
        const res = await fetch(`${this.baseUrl}/api/configs/available${query}`);
        if (!res.ok)
            throw new Error(`Failed to fetch configs: ${res.status}`);
        return res.json();
    }
    async generateImageAsync(params) {
        const form = new FormData();
        form.append("config_id", String(params.config_id));
        form.append("model_key", params.model_key);
        form.append("prompt", params.prompt);
        if (params.aspect_ratio)
            form.append("aspect_ratio", params.aspect_ratio);
        if (params.resolution)
            form.append("resolution", params.resolution);
        if (params.count)
            form.append("count", String(params.count));
        if (params.canvas_id)
            form.append("canvas_id", params.canvas_id);
        // Attach reference images for image-to-image / multi-image fusion
        if (params.image_urls && params.image_urls.length > 0) {
            for (const url of params.image_urls) {
                const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
                const imgRes = await fetch(fullUrl);
                if (!imgRes.ok)
                    throw new Error(`Failed to fetch reference image: ${fullUrl}`);
                const blob = await imgRes.blob();
                const filename = url.split("/").pop() ?? "image.jpg";
                form.append("images", blob, filename);
            }
        }
        const res = await fetch(`${this.baseUrl}/api/image/generate-async`, { method: "POST", body: form });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Image generation failed: ${err}`);
        }
        return res.json();
    }
    async generateVideoAsync(params) {
        const form = new FormData();
        form.append("config_id", String(params.config_id));
        form.append("model_key", params.model_key);
        if (params.prompt)
            form.append("prompt", params.prompt);
        if (params.duration)
            form.append("duration", String(params.duration));
        if (params.resolution)
            form.append("resolution", params.resolution);
        if (params.ratio)
            form.append("ratio", params.ratio);
        if (params.canvas_id)
            form.append("canvas_id", params.canvas_id);
        // Attach source images for image-to-video
        if (params.image_urls && params.image_urls.length > 0) {
            for (const url of params.image_urls.slice(0, 2)) {
                const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`;
                const imgRes = await fetch(fullUrl);
                if (!imgRes.ok)
                    throw new Error(`Failed to fetch source image: ${fullUrl}`);
                const blob = await imgRes.blob();
                const filename = url.split("/").pop() ?? "image.jpg";
                form.append("images", blob, filename);
            }
        }
        const res = await fetch(`${this.baseUrl}/api/video/generate-async`, { method: "POST", body: form });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Video generation failed: ${err}`);
        }
        return res.json();
    }
    async generateAudioAsync(params) {
        const form = new FormData();
        form.append("config_id", String(params.config_id));
        form.append("model_key", params.model_key);
        form.append("prompt", params.prompt);
        if (params.custom_mode !== undefined)
            form.append("custom_mode", String(params.custom_mode));
        if (params.instrumental !== undefined)
            form.append("instrumental", String(params.instrumental));
        if (params.style)
            form.append("style", params.style);
        if (params.title)
            form.append("title", params.title);
        if (params.vocal_gender)
            form.append("vocal_gender", params.vocal_gender);
        if (params.canvas_id)
            form.append("canvas_id", params.canvas_id);
        if (params.voice_id)
            form.append("voice_id", params.voice_id);
        if (params.emotion)
            form.append("emotion", params.emotion);
        if (params.speed !== undefined)
            form.append("speed", String(params.speed));
        if (params.vol !== undefined)
            form.append("vol", String(params.vol));
        if (params.pitch !== undefined)
            form.append("pitch", String(params.pitch));
        const res = await fetch(`${this.baseUrl}/api/audio/generate-async`, { method: "POST", body: form });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Audio generation failed: ${err}`);
        }
        return res.json();
    }
    async getTask(taskId) {
        const res = await fetch(`${this.baseUrl}/api/tasks/${taskId}`);
        if (!res.ok)
            throw new Error(`Failed to get task: ${res.status}`);
        return res.json();
    }
    async getCanvasDetail(uuid) {
        const res = await fetch(`${this.baseUrl}/api/canvases/${uuid}`);
        if (!res.ok)
            throw new Error(`Failed to get canvas: ${res.status}`);
        return res.json();
    }
    async updateCanvasElements(uuid, elements) {
        const res = await fetch(`${this.baseUrl}/api/canvases/${uuid}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ elements }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to update canvas: ${err}`);
        }
    }
}
//# sourceMappingURL=client.js.map