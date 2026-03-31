# Generate & Config 命令参考

## Agent 生成工作流（必须遵循）

**CRITICAL — 生成内容前，必须按以下 3 步操作，禁止凭感觉填写参数值：**

```
Step 1: flowcanvas --json config list --type <image|video|audio>
        → 获取 config_id 和可用 model_key

Step 2: flowcanvas --json config params <config_id>
        → 查看模型的合法参数值（aspect_ratio、resolution 等）

Step 3: flowcanvas generate <type> <canvas_uuid> \
          --prompt "..." --config <config_id> \
          [--aspect-ratio <从Step2获取的合法值>] \
          [--resolution <从Step2获取的合法值>]
```

> **AI 行为指导：**
> - `--aspect-ratio` 和 `--resolution` 的合法值**因模型而异**，必须从 `config params` 输出的 `options` 字段读取
> - 如果用户没有特别指定参数，使用 schema 中的 `default` 值即可，不要传入该参数
> - 不确定参数合法值时，宁可少传，不要乱传（多余参数会被后端忽略，但错误值会导致生成失败）

---

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

查看某个模型配置支持哪些参数、参数类型和**合法值**，用于确认 `generate` 命令应如何传参。

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

▸ Model: Seedream 4.5 (key: seedream-4.5)

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
    "model_key": "seedream-4.5",
    "model_name": "Seedream 4.5",
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
| `select` | 枚举选择 | `options` 中的某个值（必须完全匹配） |
| `string` | 自由文本 | 任意字符串 |
| `boolean` | 开关 | `true` / `false` |
| `range` | 数值范围 | `min` 到 `max` 之间，步长 `step` |
| `file[]` | 图片文件 | 通过 `--images` 参数（CLI 暂不支持，需通过前端上传） |

## flowcanvas generate image

生成图片并自动在画布上创建节点、绑定结果。命令会自动等待生成完成（最长 10 分钟）。

```bash
flowcanvas generate image <canvas_uuid> \
  --prompt "赛博朋克城市夜景，霓虹灯光，高楼大厦" \
  --config <config_id>
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `<canvas_uuid>` | 是 | 目标画布 UUID |
| `--prompt <text>` | 是 | 图片生成提示词 |
| `--config <id>` | 是 | 模型配置 ID（从 `config list --type image` 获取） |
| `--node <element_id>` | 否 | 目标节点 ID（省略时自动创建新节点） |
| `--model <model_key>` | 否 | 模型 key（省略时使用配置中第一个模型） |
| `--aspect-ratio <ratio>` | 否 | 宽高比（合法值从 `config params` 获取，如 `1:1`、`16:9`） |
| `--resolution <res>` | 否 | 分辨率（合法值从 `config params` 获取，如 `1K`、`2K`、`4K`） |
| `--count <n>` | 否 | 生成数量，默认 1（并非所有模型支持，先用 `config params` 确认） |
| `--from <node_id>` | 否 | 参考图节点 ID（可多次传入，多图融合时传 2+ 个） |
| `--label <label>` | 否 | 节点标签（省略 `--node` 时自动创建节点的显示名称） |

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

生成视频并自动在画布上创建节点、绑定结果。支持三种生成模式：

**生成模式对比**：

| 模式 | 参数组合 | 说明 |
|------|---------|------|
| 文生视频 | 只有 `--prompt` | 完全由文字描述生成视频 |
| 图生视频 | `--from <image_node_id>` | 以图片节点的结果为首帧生成 |
| 首尾帧视频 | `--from <first_node_id> --last-frame <last_node_id>` | 指定首帧和尾帧，生成过渡动画 |

```bash
flowcanvas generate video <canvas_uuid> \
  --config <config_id> \
  --prompt "城市漫游镜头，缓慢推进"
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `<canvas_uuid>` | 是 | 目标画布 UUID |
| `--config <id>` | 是 | 模型配置 ID（从 `config list --type video` 获取） |
| `--prompt <text>` | 否* | 视频生成提示词（文生视频时必填，图生视频时可选） |
| `--model <model_key>` | 否 | 模型 key（省略时使用配置中第一个模型） |
| `--node <element_id>` | 否 | 目标节点 ID（省略时自动创建新节点） |
| `--from <image_node_id>` | 否 | 首帧图片节点 ID（图生视频 / 首尾帧视频） |
| `--last-frame <image_node_id>` | 否 | 尾帧图片节点 ID（首尾帧视频，必须与 `--from` 配合使用） |
| `--duration <seconds>` | 否 | 视频时长（整数秒，合法范围从 `config params` 确认） |
| `--resolution <res>` | 否 | 分辨率（合法值从 `config params` 获取） |
| `--ratio <ratio>` | 否 | 宽高比（合法值从 `config params` 获取） |
| `--label <label>` | 否 | 节点标签（自动创建节点时的显示名称） |

**图生视频（推荐方式）**：

```bash
# 先获取图片节点 ID（从 generate image --json 的 nodeId 字段）
flowcanvas generate video <canvas_uuid> --from <image_node_id> --prompt "..." --config <id>
```

**首尾帧视频**：

```bash
flowcanvas generate video <canvas_uuid> \
  --from <first_frame_node_id> \
  --last-frame <last_frame_node_id> \
  --prompt "角色从A姿势变换到B姿势" \
  --config <id>
```

## flowcanvas generate audio

生成音频并自动在画布上创建节点、绑定结果。

```bash
flowcanvas generate audio <canvas_uuid> \
  --prompt "欢快的电子舞曲，节奏感强" \
  --config <config_id>
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `<canvas_uuid>` | 是 | 目标画布 UUID |
| `--prompt <text>` | 是 | 音频生成提示词（描述音乐风格、情感、场景等） |
| `--config <id>` | 是 | 模型配置 ID（从 `config list --type audio` 获取） |
| `--node <element_id>` | 否 | 目标节点 ID（省略时自动创建新节点） |
| `--model <model_key>` | 否 | 模型 key（省略时使用配置中第一个模型） |
| `--style <style>` | 否 | 音乐风格（如 "电子舞曲"、"古典钢琴"） |
| `--title <title>` | 否 | 歌曲标题 |
| `--instrumental` | 否 | 纯音乐模式（无人声，布尔开关，无需值） |
| `--label <label>` | 否 | 节点标签（自动创建节点时的显示名称） |
