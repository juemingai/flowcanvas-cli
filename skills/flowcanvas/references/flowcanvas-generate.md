# Generate & Config 命令参考

## flowcanvas config list

列出可用的模型配置。每个配置包含 API Key 和可用模型列表。

```bash
# 列出所有配置
flowcanvas config list

# 按类型筛选
flowcanvas config list --type image
flowcanvas config list --type video
flowcanvas config list --type audio

# JSON 输出
flowcanvas --json config list --type image
# [
#   {
#     "config_id": 16,
#     "config_name": "my-config",
#     "provider": {"id": 1, "name": "byteplus", "display_name": "BytePlus", "model_type": "image"},
#     "models": [{"id": 1, "name": "seedream-4.5", "display_name": "Seedream-4.5"}]
#   }
# ]
```

**Agent 用法**：生成前先查询 `config list --type <type>` 获取 `config_id`，传给 `generate` 命令。

## flowcanvas generate image

生成图片并保存到画布。命令会自动等待生成完成（最长 5 分钟）。

```bash
flowcanvas generate image <canvas_uuid> \
  --prompt "赛博朋克城市夜景，霓虹灯光，高楼大厦" \
  --config <config_id>

# 可选参数
  --model <model_key>        # 模型 key（默认使用配置中第一个模型）
  --aspect-ratio <ratio>     # 宽高比（如 1:1, 16:9, 9:16）
  --resolution <res>         # 分辨率（如 1024x1024）
  --count <n>                # 生成数量（1, 2, 或 4，默认 1）
```

**输出**：
```
ℹ Submitting image generation task...
ℹ Task ID: task-xxx — waiting for completion...
  Progress: 100%
✓ Image generation completed! Check FlowCanvas desktop app.
```

## flowcanvas generate video

生成视频并保存到画布。

```bash
flowcanvas generate video <canvas_uuid> \
  --config <config_id> \
  --prompt "城市漫游镜头，缓慢推进"

# 可选参数
  --model <model_key>        # 模型 key
  --from <image_node_id>     # 源图片节点 ID（自动创建视频节点+连接+生成）
  --duration <seconds>       # 时长（秒）
  --resolution <res>         # 分辨率
  --ratio <ratio>            # 宽高比
```

**图生视频快捷方式**：使用 `--from` 参数，一步完成创建视频节点、连接到图片节点、触发生成：

```bash
# 自动创建视频节点 + 连接图片节点 + 生成视频
flowcanvas generate video <canvas_uuid> --from <image_node_id> --prompt "..." --config <id>
```

**手动方式**：先用 `node add` + `edge add` 手动创建和连接，再调用 `generate video`。

## flowcanvas generate audio

生成音频并保存到画布。

```bash
flowcanvas generate audio <canvas_uuid> \
  --prompt "欢快的电子舞曲，节奏感强" \
  --config <config_id>

# 可选参数
  --model <model_key>        # 模型 key
  --style <style>            # 音乐风格
  --title <title>            # 歌曲标题
  --instrumental             # 纯音乐（无人声）
```
