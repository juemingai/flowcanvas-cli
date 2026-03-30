import { pollTask } from "../poller.js";
import { isJsonMode, outputJson, outputSuccess, outputInfo, outputError } from "../output.js";
export function registerGenerateCommand(program, client) {
    const generate = program.command("generate").description("Generate AI content");
    generate
        .command("image")
        .description("Generate an image")
        .argument("<canvas_uuid>", "Canvas UUID")
        .requiredOption("--prompt <prompt>", "Image generation prompt")
        .requiredOption("--config <config_id>", "Config ID (from `flowcanvas config list --type image`)")
        .option("--node <element_id>", "Target node ID to attach results to (use `flowcanvas canvas get <uuid>` to find IDs)")
        .option("--model <model_key>", "Model key (defaults to first available model)")
        .option("--aspect-ratio <ratio>", "Aspect ratio (e.g. 1:1, 16:9)")
        .option("--resolution <res>", "Resolution (e.g. 1024x1024)")
        .option("--count <n>", "Number of images (1, 2, or 4)", "1")
        .option("--from <node_id>", "Reference image node IDs (repeat for multi-image fusion, e.g. --from id1 --from id2)", (val, prev) => [...prev, val], [])
        .action(async (canvasUuid, opts) => {
        const configId = parseInt(opts.config, 10);
        const fromNodes = opts.from;
        // Resolve model key if not specified
        let modelKey = opts.model;
        if (!modelKey) {
            const configs = await client.getAvailableConfigs("image");
            const cfg = configs.find((c) => c.config_id === configId);
            if (!cfg || cfg.models.length === 0) {
                outputError(`Config ${configId} not found or has no models.`);
                process.exit(1);
            }
            modelKey = cfg.models[0].name;
        }
        // Collect reference image URLs from --from nodes
        let sourceImageUrls;
        if (fromNodes.length > 0) {
            const canvas = await client.getCanvasDetail(canvasUuid);
            sourceImageUrls = [];
            for (const nodeId of fromNodes) {
                const sourceNode = canvas.elements.find((el) => el.id === nodeId);
                if (!sourceNode) {
                    outputError(`Source node ${nodeId} not found on canvas.`);
                    process.exit(1);
                }
                const imageGen = sourceNode.imageGeneration;
                const results = imageGen?.results;
                const idx = imageGen?.currentResultIndex ?? 0;
                const imageUrl = results?.[idx]?.url;
                if (!imageUrl) {
                    outputError(`Source node ${nodeId} has no image results. Generate an image first.`);
                    process.exit(1);
                }
                sourceImageUrls.push(imageUrl);
                outputInfo(`Reference image from node ${nodeId}: ${imageUrl}`);
            }
            const mode = fromNodes.length >= 2 ? "multi-image fusion" : "image-to-image";
            outputInfo(`Mode: ${mode}`);
        }
        // Auto-create image node if --node not specified
        let targetNodeId = opts.node;
        if (!targetNodeId) {
            const newNode = await client.addCanvasElement(canvasUuid, "image-generation");
            outputInfo(`Created image node: ${newNode.id}`);
            targetNodeId = newNode.id;
        }
        // Create edges from source nodes to target node
        for (const sourceNodeId of fromNodes) {
            await client.addCanvasEdge(canvasUuid, sourceNodeId, targetNodeId);
            outputInfo(`Connected ${sourceNodeId} → ${targetNodeId}`);
        }
        outputInfo("Submitting image generation task...");
        const { task_id } = await client.generateImageAsync({
            config_id: configId,
            model_key: modelKey,
            prompt: opts.prompt,
            aspect_ratio: opts.aspectRatio,
            resolution: opts.resolution,
            count: parseInt(opts.count, 10),
            canvas_id: canvasUuid,
            image_urls: sourceImageUrls,
        });
        outputInfo(`Task ID: ${task_id} — waiting for completion...`);
        const result = await pollTask(client, task_id, {
            onProgress: (task) => {
                if (!isJsonMode() && task.progress > 0) {
                    process.stdout.write(`\r  Progress: ${task.progress}%`);
                }
            },
        });
        if (!isJsonMode())
            process.stdout.write("\n");
        // Attach results to the target node
        if (result.results) {
            const generated = result.results.generated_images;
            if (generated && generated.length > 0) {
                const canvas = await client.getCanvasDetail(canvasUuid);
                const updatedElements = canvas.elements.map((el) => {
                    if (el.id === targetNodeId) {
                        return {
                            ...el,
                            imageGeneration: {
                                ...(el.imageGeneration ?? {}),
                                generationState: "completed",
                                taskId: task_id,
                                results: generated.map((img) => ({ id: img.id, url: img.url, filename: img.filename })),
                                currentResultIndex: 0,
                                params: {
                                    ...(el.imageGeneration?.params ?? {}),
                                    prompt: opts.prompt,
                                    configId: configId,
                                    modelKey: modelKey,
                                    aspectRatio: opts.aspectRatio || "1:1",
                                    resolution: opts.resolution || "2K",
                                    count: parseInt(opts.count || "1", 10),
                                    ...(sourceImageUrls && sourceImageUrls.length > 0 ? {
                                        referenceImages: sourceImageUrls.map((url, i) => ({
                                            id: `ref-${i}`,
                                            type: "inherited",
                                            data: url,
                                            filename: url.split("/").pop() ?? "image.jpg",
                                            sourceNodeId: fromNodes[i],
                                        })),
                                    } : {}),
                                },
                            },
                        };
                    }
                    return el;
                });
                await client.updateCanvasElements(canvasUuid, updatedElements);
                if (!isJsonMode())
                    outputInfo(`Results attached to node ${targetNodeId}`);
            }
        }
        if (isJsonMode()) {
            outputJson({ nodeId: targetNodeId, ...result });
        }
        else {
            outputSuccess("Image generation completed! Check FlowCanvas desktop app.");
        }
    });
    generate
        .command("video")
        .description("Generate a video")
        .argument("<canvas_uuid>", "Canvas UUID")
        .requiredOption("--config <config_id>", "Config ID (from `flowcanvas config list --type video`)")
        .option("--prompt <prompt>", "Video generation prompt")
        .option("--model <model_key>", "Model key (defaults to first available model)")
        .option("--from <image_node_id>", "First frame image node ID — auto-creates video node, connects, and generates")
        .option("--last-frame <image_node_id>", "Last frame image node ID — use with --from for first/last frame video generation")
        .option("--node <element_id>", "Target node ID to attach results to")
        .option("--duration <seconds>", "Duration in seconds")
        .option("--resolution <res>", "Resolution")
        .option("--ratio <ratio>", "Aspect ratio")
        .action(async (canvasUuid, opts) => {
        const configId = parseInt(opts.config, 10);
        let modelKey = opts.model;
        if (!modelKey) {
            const configs = await client.getAvailableConfigs("video");
            const cfg = configs.find((c) => c.config_id === configId);
            if (!cfg || cfg.models.length === 0) {
                outputError(`Config ${configId} not found or has no models.`);
                process.exit(1);
            }
            modelKey = cfg.models[0].name;
        }
        // --from / --last-frame: auto-create video node + connect + generate
        let targetNodeId = opts.node;
        let sourceImageUrls;
        if (opts.from || opts.lastFrame) {
            const canvas = await client.getCanvasDetail(canvasUuid);
            sourceImageUrls = [];
            // First frame (--from)
            if (opts.from) {
                const sourceNode = canvas.elements.find((el) => el.id === opts.from);
                if (!sourceNode) {
                    outputError(`Source node ${opts.from} not found on canvas.`);
                    process.exit(1);
                }
                const imageGen = sourceNode.imageGeneration;
                const results = imageGen?.results;
                const idx = imageGen?.currentResultIndex ?? 0;
                const imageUrl = results?.[idx]?.url;
                if (!imageUrl) {
                    outputError(`Source node ${opts.from} has no image results. Generate an image first.`);
                    process.exit(1);
                }
                sourceImageUrls.push(imageUrl);
                outputInfo(`First frame from node ${opts.from}: ${imageUrl}`);
            }
            // Last frame (--last-frame)
            if (opts.lastFrame) {
                const lastFrameNode = canvas.elements.find((el) => el.id === opts.lastFrame);
                if (!lastFrameNode) {
                    outputError(`Last frame node ${opts.lastFrame} not found on canvas.`);
                    process.exit(1);
                }
                const imageGen = lastFrameNode.imageGeneration;
                const results = imageGen?.results;
                const idx = imageGen?.currentResultIndex ?? 0;
                const imageUrl = results?.[idx]?.url;
                if (!imageUrl) {
                    outputError(`Last frame node ${opts.lastFrame} has no image results. Generate an image first.`);
                    process.exit(1);
                }
                sourceImageUrls.push(imageUrl);
                outputInfo(`Last frame from node ${opts.lastFrame}: ${imageUrl}`);
            }
            const mode = sourceImageUrls.length === 2 ? "first/last frame" : "image-to-video";
            outputInfo(`Mode: ${mode}`);
            outputInfo("Creating video node...");
            const videoNode = await client.addCanvasElement(canvasUuid, "video-generation");
            outputInfo(`Created video node: ${videoNode.id}`);
            if (opts.from) {
                await client.addCanvasEdge(canvasUuid, opts.from, videoNode.id);
                outputInfo(`Connected ${opts.from} → ${videoNode.id}`);
            }
            if (opts.lastFrame) {
                await client.addCanvasEdge(canvasUuid, opts.lastFrame, videoNode.id);
                outputInfo(`Connected ${opts.lastFrame} → ${videoNode.id}`);
            }
            if (!targetNodeId)
                targetNodeId = videoNode.id;
        }
        // Auto-create video node if neither --from/--last-frame nor --node was specified
        if (!opts.from && !opts.lastFrame && !targetNodeId) {
            const newNode = await client.addCanvasElement(canvasUuid, "video-generation");
            outputInfo(`Created video node: ${newNode.id}`);
            targetNodeId = newNode.id;
        }
        outputInfo("Submitting video generation task...");
        const { task_id } = await client.generateVideoAsync({
            config_id: configId,
            model_key: modelKey,
            prompt: opts.prompt,
            duration: opts.duration ? parseInt(opts.duration, 10) : undefined,
            resolution: opts.resolution,
            ratio: opts.ratio,
            canvas_id: canvasUuid,
            image_urls: sourceImageUrls,
        });
        outputInfo(`Task ID: ${task_id} — waiting for completion...`);
        const result = await pollTask(client, task_id, {
            onProgress: (task) => {
                if (!isJsonMode() && task.progress > 0) {
                    process.stdout.write(`\r  Progress: ${task.progress}%`);
                }
            },
        });
        if (!isJsonMode())
            process.stdout.write("\n");
        // Attach results to the target node if specified
        if (targetNodeId && result.results) {
            const generated = result.results.generated_videos;
            if (generated && generated.length > 0) {
                const canvas = await client.getCanvasDetail(canvasUuid);
                const updatedElements = canvas.elements.map((el) => {
                    if (el.id === targetNodeId) {
                        const existingVideoGen = el.videoGeneration ?? {};
                        return {
                            ...el,
                            videoGeneration: {
                                ...existingVideoGen,
                                generationState: "completed",
                                taskId: task_id,
                                results: generated.map((v) => ({ id: v.id, url: v.url, filename: v.filename })),
                                currentResultIndex: 0,
                                params: {
                                    ...(existingVideoGen.params ?? {}),
                                    prompt: opts.prompt || "",
                                    configId: configId,
                                    modelKey: modelKey,
                                    ratio: opts.ratio || "adaptive",
                                    resolution: opts.resolution || "720p",
                                    duration: opts.duration ? parseInt(opts.duration, 10) : 5,
                                    generateAudio: true,
                                    promptOptimizer: true,
                                    count: 1,
                                    ...(sourceImageUrls && sourceImageUrls.length > 0 ? {
                                        referenceImages: sourceImageUrls.map((url, i) => ({
                                            id: `ref-${i}`,
                                            type: "inherited",
                                            data: url,
                                            filename: url.split("/").pop() ?? "image.jpg",
                                            sourceNodeId: i === 0 ? opts.from : opts.lastFrame,
                                        })),
                                    } : {}),
                                },
                            },
                        };
                    }
                    return el;
                });
                await client.updateCanvasElements(canvasUuid, updatedElements);
                if (!isJsonMode())
                    outputInfo(`Results attached to node ${targetNodeId}`);
            }
        }
        if (isJsonMode()) {
            outputJson({ nodeId: targetNodeId ?? null, ...result });
        }
        else {
            outputSuccess("Video generation completed! Check FlowCanvas desktop app.");
        }
    });
    generate
        .command("audio")
        .description("Generate audio")
        .argument("<canvas_uuid>", "Canvas UUID")
        .requiredOption("--prompt <prompt>", "Audio generation prompt")
        .requiredOption("--config <config_id>", "Config ID (from `flowcanvas config list --type audio`)")
        .option("--node <element_id>", "Target node ID to attach results to")
        .option("--model <model_key>", "Model key (defaults to first available model)")
        .option("--style <style>", "Music style")
        .option("--title <title>", "Song title")
        .option("--instrumental", "Instrumental only (no vocals)")
        .action(async (canvasUuid, opts) => {
        const configId = parseInt(opts.config, 10);
        let modelKey = opts.model;
        if (!modelKey) {
            const configs = await client.getAvailableConfigs("audio");
            const cfg = configs.find((c) => c.config_id === configId);
            if (!cfg || cfg.models.length === 0) {
                outputError(`Config ${configId} not found or has no models.`);
                process.exit(1);
            }
            modelKey = cfg.models[0].name;
        }
        // Auto-create audio node if --node not specified
        if (!opts.node) {
            const newNode = await client.addCanvasElement(canvasUuid, "audio-generation");
            outputInfo(`Created audio node: ${newNode.id}`);
            opts.node = newNode.id;
        }
        outputInfo("Submitting audio generation task...");
        const { task_id } = await client.generateAudioAsync({
            config_id: configId,
            model_key: modelKey,
            prompt: opts.prompt,
            style: opts.style,
            title: opts.title,
            instrumental: opts.instrumental === true ? true : undefined,
            canvas_id: canvasUuid,
        });
        outputInfo(`Task ID: ${task_id} — waiting for completion...`);
        const result = await pollTask(client, task_id, {
            onProgress: (task) => {
                if (!isJsonMode() && task.progress > 0) {
                    process.stdout.write(`\r  Progress: ${task.progress}%`);
                }
            },
        });
        if (!isJsonMode())
            process.stdout.write("\n");
        // Attach results to the target node
        if (result.results) {
            const generated = result.results.generated_audios;
            if (generated && generated.length > 0) {
                const canvas = await client.getCanvasDetail(canvasUuid);
                const updatedElements = canvas.elements.map((el) => {
                    if (el.id === opts.node) {
                        return {
                            ...el,
                            audioGeneration: {
                                ...(el.audioGeneration ?? {}),
                                generationState: "completed",
                                taskId: task_id,
                                results: generated.map((a) => ({ id: a.id, url: a.url, filename: a.filename })),
                                currentResultIndex: 0,
                                params: {
                                    ...(el.audioGeneration?.params ?? {}),
                                    prompt: opts.prompt,
                                    configId: configId,
                                    modelKey: modelKey,
                                    style: opts.style || "",
                                    title: opts.title || "",
                                    instrumental: opts.instrumental === true,
                                },
                            },
                        };
                    }
                    return el;
                });
                await client.updateCanvasElements(canvasUuid, updatedElements);
                if (!isJsonMode())
                    outputInfo(`Results attached to node ${opts.node}`);
            }
        }
        if (isJsonMode()) {
            outputJson({ nodeId: opts.node ?? null, ...result });
        }
        else {
            outputSuccess("Audio generation completed! Check FlowCanvas desktop app.");
        }
    });
}
//# sourceMappingURL=generate.js.map