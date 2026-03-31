# Node & Edge 命令参考

## flowcanvas node add

添加节点到画布。位置自动计算（放在现有节点右侧），也可手动指定。

```bash
# 自动位置
flowcanvas node add <canvas_uuid> image-generation
flowcanvas node add <canvas_uuid> video-generation
flowcanvas node add <canvas_uuid> audio-generation
flowcanvas node add <canvas_uuid> text

# 手动位置
flowcanvas node add <canvas_uuid> image-generation --x 500 --y 300

# 设置自定义标签（在 UI 中显示的节点名称）
flowcanvas node add <canvas_uuid> image-generation --label "参考图A"
flowcanvas node add <canvas_uuid> video-generation --label "最终视频" --from <image_node_id>

# 从现有节点拖出连接（创建新节点 + 自动连接，等同于画布UI拖拽连接线操作）
flowcanvas node add <canvas_uuid> video-generation --from <image_node_id>
flowcanvas node add <canvas_uuid> audio-generation --from <image_node_id>
flowcanvas node add <canvas_uuid> image-generation --from <text_node_id>

# JSON 输出
flowcanvas --json node add <canvas_uuid> video-generation --from <image_node_id>
# {
#   "id": "new-node-uuid",
#   "type": "video-generation",
#   "x": 570, "y": 200,
#   "results_count": 0,
#   "connected_from": "image-node-uuid"
# }
```

**支持的节点类型**：

| 类型 | 说明 |
|------|------|
| `image-generation` | 图片生成节点 |
| `video-generation` | 视频生成节点 |
| `audio-generation` | 音频生成节点 |
| `text` | 文本节点 |

## flowcanvas node delete

删除节点，同时自动删除所有与该节点相连的边。

```bash
flowcanvas node delete <canvas_uuid> <element_id>
# ✓ Deleted node xxx (and removed all connected edges)
```

**注意**：使用 `flowcanvas canvas get <uuid>` 获取正确的节点 ID 后再删除。

## flowcanvas edge add

连接两个节点，创建有向边（source → target）。

```bash
flowcanvas edge add <canvas_uuid> <source_id> <target_id>
# ✓ Connected source-id → target-id (edge: edge-uuid)

flowcanvas --json edge add <canvas_uuid> <source_id> <target_id>
# {"id": "edge-uuid", "sourceId": "source-id", "targetId": "target-id"}
```

**典型用法**：将图片节点连接到视频节点，实现图生视频工作流。

```bash
# 1. 先查看画布获取节点 ID
flowcanvas --json canvas get <uuid>

# 2. 连接图片节点到视频节点
flowcanvas edge add <uuid> <image_node_id> <video_node_id>
```

**注意**：如果两个节点已经连接，不会创建重复的边，会返回现有的边信息。
