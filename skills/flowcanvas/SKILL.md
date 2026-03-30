---
name: flowcanvas
version: 1.0.0
description: "FlowCanvas 画布操作：管理画布、添加/连接/删除节点、触发 AI 图片/视频/音频生成。需要本地运行 FlowCanvas 桌面端（localhost:8000）。核心场景包括：创建画布并组织 AI 生成工作流、在画布上添加节点并建立连接、批量生成图片/视频/音频内容。当用户提到 FlowCanvas、画布操作、AI 生图/视频/音频生成时触发。"
metadata:
  requires:
    bins: ["flowcanvas"]
  cliHelp: "flowcanvas --help"
---

# FlowCanvas 画布操作

本技能指导你如何通过 `flowcanvas` CLI 操作 FlowCanvas 画布，管理节点和连接，以及触发 AI 图片/视频/音频生成。

**CRITICAL — 所有命令在执行前，务必先使用 Read 工具读取对应的说明文档，禁止直接盲目调用命令。**

## 前置条件

- FlowCanvas 桌面端需要运行（默认 localhost:8000）
- 首次使用先运行 `flowcanvas health` 确认连接

```bash
flowcanvas health
```

## 画布选择规则（CRITICAL）

**规则 1：未指定画布时，必须询问用户**
- 运行 `flowcanvas canvas list` 获取列表
- 展示给用户：名称 + 最近修改时间 + 节点数
- 询问用户选择哪个，或是否新建
- ❌ 禁止静默使用最近的画布或自动新建

**规则 2：用户提到画布名称时，先模糊匹配**
- 运行 `flowcanvas --json canvas list` 获取列表
- 按名称模糊搜索
- 找到唯一匹配 → 直接使用，无需确认
- 找到多个匹配 → 列出让用户选
- 未找到 → 告知用户并展示完整列表

**规则 3：新建画布必须命名**
- 创建前必须明确问用户："您想给这个画布起什么名字？"
- ❌ 禁止使用 "Untitled Canvas" 或任何默认名称

## 核心概念

- **画布（Canvas）**：节点的容器。每个画布有唯一 UUID，包含多个节点和连接。
- **节点（Node/Element）**：画布上的单个元素，包含类型、位置、生成状态等属性。支持的类型：`image-generation`、`video-generation`、`audio-generation`、`text`。
- **连接（Edge）**：两个节点之间的有向连接线，表示数据流向（如图片节点 → 视频节点，表示图生视频）。
- **模型配置（Config）**：用户在 FlowCanvas 设置中配置的 AI 模型和 API Key，每个配置有唯一 ID。

## 资源关系

```
Canvas (画布)
├── Element (节点)
│   ├── type: image-generation / video-generation / audio-generation / text
│   ├── generationState: idle / generating / completed / failed
│   └── results: 生成结果列表
└── Edge (连接)
    ├── sourceId → 源节点
    └── targetId → 目标节点
```

## 命令一览

| 命令 | 说明 | 参考文档 |
|------|------|---------|
| `flowcanvas health` | 检查 FlowCanvas 是否运行 | [flowcanvas-canvas](references/flowcanvas-canvas.md) |
| `flowcanvas canvas list` | 列出所有画布 | [flowcanvas-canvas](references/flowcanvas-canvas.md) |
| `flowcanvas canvas create <name>` | 创建新画布 | [flowcanvas-canvas](references/flowcanvas-canvas.md) |
| `flowcanvas canvas get <uuid>` | 查看画布内所有节点 | [flowcanvas-canvas](references/flowcanvas-canvas.md) |
| `flowcanvas node add <uuid> <type>` | 添加节点 | [flowcanvas-node](references/flowcanvas-node.md) |
| `flowcanvas node delete <uuid> <id>` | 删除节点 | [flowcanvas-node](references/flowcanvas-node.md) |
| `flowcanvas edge add <uuid> <src> <tgt>` | 连接两个节点 | [flowcanvas-node](references/flowcanvas-node.md) |
| `flowcanvas config list` | 列出可用模型配置 | [flowcanvas-generate](references/flowcanvas-generate.md) |
| `flowcanvas generate image <uuid>` | 生成图片 | [flowcanvas-generate](references/flowcanvas-generate.md) |
| `flowcanvas generate video <uuid>` | 生成视频 | [flowcanvas-generate](references/flowcanvas-generate.md) |
| `flowcanvas generate audio <uuid>` | 生成音频 | [flowcanvas-generate](references/flowcanvas-generate.md) |

## 全局选项

| 选项 | 说明 |
|------|------|
| `--json` | 输出 JSON 格式（Agent 推荐使用） |
| `--server <url>` | FlowCanvas 地址（默认 `http://localhost:8000`） |

## 核心场景

### 1. 图片生成

```bash
# 1. 确认目标画布
flowcanvas canvas list

# 2. 查看可用图片模型配置
flowcanvas config list --type image

# 3. 生成图片（会自动创建节点并等待完成）
flowcanvas generate image <canvas_uuid> --prompt "赛博朋克城市夜景" --config <config_id>
```

### 2. 图片→视频工作流

**快捷方式（推荐）**：使用 `--from` 参数一步完成创建视频节点 + 连接 + 生成

```bash
# 1. 生成图片
flowcanvas generate image <uuid> --prompt "赛博朋克城市" --config <image_config_id>

# 2. 获取图片节点 ID
flowcanvas --json canvas get <uuid>

# 3. 一步完成图生视频（自动创建视频节点 + 连接 + 生成）
flowcanvas generate video <uuid> --from <image_node_id> --prompt "城市漫游镜头" --config <video_config_id>
```

**分步方式**（手动控制每一步）：

```bash
flowcanvas node add <uuid> video-generation
flowcanvas edge add <uuid> <image_node_id> <video_node_id>
flowcanvas generate video <uuid> --prompt "城市漫游镜头" --config <video_config_id>
```

### 3. 多节点工作流

```bash
# 创建多个图片节点
flowcanvas node add <uuid> image-generation
flowcanvas node add <uuid> image-generation
flowcanvas node add <uuid> image-generation

# 查看节点 ID
flowcanvas --json canvas get <uuid>

# 分别生成不同风格图片
flowcanvas generate image <uuid> --prompt "日式风格城堡" --config <id>
flowcanvas generate image <uuid> --prompt "哥特式教堂" --config <id>
```

## 其他规则

- FlowCanvas 桌面端每 2 秒自动刷新，用户能实时看到操作结果，无需额外"打开"画布
- FlowCanvas 未启动时 CLI 会返回友好错误，提示用户先启动桌面端
- 操作前建议用 `flowcanvas canvas get <uuid>` 确认画布当前状态
- `generate` 命令会自动等待生成完成（最长 5 分钟），无需手动轮询
- 使用 `--json` 输出时更容易解析节点 ID 等信息
