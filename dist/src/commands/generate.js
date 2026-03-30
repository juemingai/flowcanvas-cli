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
        .action(async (canvasUuid, opts) => {
        const configId = parseInt(opts.config, 10);
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
        // Auto-create image node if --node not specified
        if (!opts.node) {
            const newNode = await client.addCanvasElement(canvasUuid, "image-generation");
            outputInfo(`Created image node: ${newNode.id}`);
            opts.node = newNode.id;
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
                    if (el.id === opts.node) {
                        return {
                            ...el,
                            imageGeneration: {
                                ...(el.imageGeneration ?? {}),
                                generationState: "completed",
                                taskId: task_id,
                                results: generated.map((img) => ({ id: img.id, url: img.url, filename: img.filename })),
                                currentResultIndex: 0,
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
            outputJson({ nodeId: opts.node, ...result });
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
        .option("--from <image_node_id>", "Source image node ID — auto-creates video node, connects, and generates (shortcut for image-to-video)")
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
        // --from shortcut: auto-create video node + connect + generate
        let targetNodeId = opts.node;
        let sourceImageUrls;
        if (opts.from) {
            // Get source node's image URL for image-to-video
            const canvas = await client.getCanvasDetail(canvasUuid);
            const sourceNode = canvas.elements.find((el) => el.id === opts.from);
            if (sourceNode) {
                const imageGen = sourceNode.imageGeneration;
                const results = imageGen?.results;
                const idx = imageGen?.currentResultIndex ?? 0;
                const imageUrl = results?.[idx]?.url;
                if (imageUrl) {
                    sourceImageUrls = [imageUrl];
                    outputInfo(`Using source image: ${imageUrl}`);
                }
                else {
                    outputError(`Source node ${opts.from} has no image results. Generate an image first.`);
                    process.exit(1);
                }
            }
            else {
                outputError(`Source node ${opts.from} not found on canvas.`);
                process.exit(1);
            }
            outputInfo(`Creating video node and connecting to ${opts.from}...`);
            const videoNode = await client.addCanvasElement(canvasUuid, "video-generation");
            outputInfo(`Created video node: ${videoNode.id}`);
            await client.addCanvasEdge(canvasUuid, opts.from, videoNode.id);
            outputInfo(`Connected ${opts.from} → ${videoNode.id}`);
            // Auto-use the newly created node as target for result attachment
            if (!targetNodeId)
                targetNodeId = videoNode.id;
        }
        // Auto-create video node if neither --from nor --node was specified
        if (!opts.from && !targetNodeId) {
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
                                // Store reference images so frontend shows them in the 首帧/尾帧 panel
                                params: {
                                    ...(existingVideoGen.params ?? {}),
                                    ...(sourceImageUrls ? {
                                        referenceImages: sourceImageUrls.map((url) => ({
                                            data: url,
                                            filename: url.split("/").pop() ?? "image.jpg",
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