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

## flowcanvas config params

查看某个模型配置支持哪些参数、参数类型和合法值，用于确认 `generate` 命令应如何传参。

```bash
# 查看 config 1 下所有模型的参数
flowcanvas config params <config_id>

# 只看指定模型
flowcanvas config params <config_id> --model <model_key>

# JSON 输出（Agent 推荐）
flowcanvas --json config params <config_id>
```

**Human 模式输出示例**：
```
Config: My Config (ID: 1) — BytePlus [image]

▸ Model: Seedream 3.0 (key: seedream-3.0)

┌──────────────┬────────┬──────┬────────┬─────────────────────┬──────────────┐
│ 参数名       │ 类型   │ 必填 │ 默认值 │ 可选值/范围         │ 说明         │
├──────────────┼────────┼──────┼────────┼─────────────────────┼──────────────┤
│ aspect_ratio │ select │ 是   │ 1:1    │ 1:1, 4:3, 16:9, ... │ 图片宽高比   │
│ resolution   │ select │ 否   │ 1K     │ 1K, 2K, 4K          │ 图片分辨率   │
└──────────────┴────────┴──────┴────────┴─────────────────────┴──────────────┘
```

**JSON 输出结构**：
```json
[
  {
    "model_key": "seedream-3.0",
    "model_name": "Seedream 3.0",
    "parameter_schema": {
      "aspect_ratio": {
        "type": "select",
        "required": true,
        "label": "宽高比",
        "options": ["1:1", "4:3", "16:9", "9:16"],
        "default": "1:1"
      },
      "resolution": {
        "type": "select",
        "required": false,
        "label": "分辨率",
        "options": ["1K", "2K", "4K"],
        "default": "1K"
      }
    }
  }
]
```

**参数类型说明**：

| 类型 | 含义 | 可传值 |
|------|------|--------|
| `select` | 枚举选择 | `options` 中的某个 `value` |
| `string` | 自由文本 | 任意字符串 |
| `boolean` | 开关 | `true` / `false` |
| `range` | 数值范围 | `min` 到 `max` 之间，步长 `step` |
| `file[]` | 图片文件 | 通过 `--images` 参数（CLI 暂不支持，需通过前端上传） |

**Agent 工作流（推荐）**：
1. `flowcanvas --json config list --type image` → 获取 `config_id` 和 `model_key`
2. `flowcanvas --json config params <config_id> --model <model_key>` → 查看合法参数值
3. 根据 schema 构造 `generate` 命令参数

## flowcanvas generate image

生成图片并自动在画布上创建节点、绑定结果。命令会自动等待生成完成（最长 10 分钟）。

```bash
flowcanvas generate image <canvas_uuid> \
  --prompt "赛博朋克城市夜景，霓虹灯光，高楼大厦" \
  --config <config_id>

# 可选参数
  --node <element_id>        # 目标节点 ID（省略时自动创建新节点）
  --model <model_key>        # 模型 key（默认使用配置中第一个模型）
  --aspect-ratio <ratio>     # 宽高比（如 1:1, 16:9, 9:16）
  --resolution <res>         # 分辨率（如 1024x1024）
  --count <n>                # 生成数量（1, 2, 或 4，默认 1）
  --label <label>            # 自动创建节点时设置的标签名称（省略 --node 时生效）
```

**典型用法（推荐，一步完成）**：

```bash
# 自动创建节点 + 生成 + 绑定结果，桌面端自动刷新显示
flowcanvas generate image <uuid> --prompt "赛博朋克城市夜景" --config <config_id>
```

**JSON 输出**（含 nodeId，用于后续图生视频）：

```bash
flowcanvas --json generate image <uuid> --prompt "..." --config <config_id>
# {
#   "nodeId": "abc-123",
#   "task_id": "task-xxx",
#   "status": "completed",
#   "results": { "generated_images": [...] }
# }
```

**输出（普通模式）**：
```
ℹ Created image node: abc-123
ℹ Submitting image generation task...
ℹ Task ID: task-xxx — waiting for completion...
  Progress: 100%
ℹ Results attached to node abc-123
✓ Image generation completed! Check FlowCanvas desktop app.
```

## flowcanvas generate video

生成视频并自动在画布上创建节点、绑定结果。

```bash
flowcanvas generate video <canvas_uuid> \
  --config <config_id> \
  --prompt "城市漫游镜头，缓慢推进"

# 可选参数
  --model <model_key>        # 模型 key
  --node <element_id>        # 目标节点 ID（省略时自动创建新节点）
  --from <image_node_id>     # 源图片节点 ID（图生视频：自动创建视频节点+连接+生成）
  --duration <seconds>       # 时长（秒）
  --resolution <res>         # 分辨率
  --ratio <ratio>            # 宽高比
  --label <label>            # 自动创建节点时设置的标签名称（省略 --node 时生效）
```

**图生视频快捷方式（推荐）**：使用 `--from` 参数，一步完成创建视频节点、连接到图片节点、触发生成：

```bash
# 先获取图片节点 ID（从 generate image --json 的 nodeId 字段）
flowcanvas generate video <canvas_uuid> --from <image_node_id> --prompt "..." --config <id>
```

**文生视频（一步完成）**：

```bash
# 自动创建视频节点 + 生成 + 绑定结果
flowcanvas generate video <uuid> --prompt "城市漫游" --config <config_id>
```

## flowcanvas generate audio

生成音频并自动在画布上创建节点、绑定结果。

```bash
flowcanvas generate audio <canvas_uuid> \
  --prompt "欢快的电子舞曲，节奏感强" \
  --config <config_id>

# 可选参数
  --node <element_id>        # 目标节点 ID（省略时自动创建新节点）
  --model <model_key>        # 模型 key
  --style <style>            # 音乐风格
  --title <title>            # 歌曲标题
  --instrumental             # 纯音乐（无人声）
  --label <label>            # 自动创建节点时设置的标签名称（省略 --node 时生效）
```

**典型用法（一步完成）**：

```bash
flowcanvas generate audio <uuid> --prompt "欢快的电子舞曲" --config <config_id>
```
