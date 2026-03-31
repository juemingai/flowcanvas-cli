# Canvas 命令参考

## flowcanvas health

检查 FlowCanvas 桌面端是否运行。

```bash
flowcanvas health
# ✓ FlowCanvas is running

flowcanvas --json health
# {"status": "ok"}
```

## flowcanvas canvas list

列出所有画布，包含名称、UUID、节点数、修改时间。

```bash
flowcanvas canvas list
# 表格输出：Name | UUID | Nodes | Updated | Favorite

flowcanvas --json canvas list
# JSON 数组示例：
# [
#   {
#     "id": 1,
#     "uuid": "xxx-xxx-xxx",
#     "name": "赛博朋克项目",
#     "is_favorite": false,
#     "is_archived": false,
#     "created_at": "2026-03-01T10:00:00",
#     "updated_at": "2026-03-31T15:30:00",
#     "element_count": 5,
#     "thumbnail_url": "/files/xxx/thumbnail.png"  // 可能为 null
#   }
# ]
```

**Agent 用法**：使用 `--json` 获取结构化数据，按 `name` 模糊匹配用户提到的画布名称。`thumbnail_url` 字段可能为 `null`，匹配时勿依赖此字段。

## flowcanvas canvas create

创建新画布，必须指定名称。

```bash
flowcanvas canvas create "赛博朋克项目"
# ✓ Created canvas "赛博朋克项目" (UUID: xxx-xxx-xxx)

flowcanvas --json canvas create "新画布"
# {"uuid": "xxx-xxx-xxx", "name": "新画布"}
```

**规则**：禁止使用 "Untitled Canvas" 或空名称。创建前必须询问用户画布名称。

## flowcanvas canvas get

查看画布内所有节点详情。

```bash
flowcanvas canvas get <uuid>
# 表格输出：ID | Type | Position | State | Results | Prompt

flowcanvas --json canvas get <uuid>
# JSON 数组，每个元素包含：
# {
#   "id": "node-uuid",
#   "type": "image-generation",
#   "x": 120, "y": 200,
#   "label": "参考图A",             // 用户自定义标签（无则为 null）
#   "generationState": "completed",  // idle | generating | completed | failed
#   "results_count": 1,
#   "prompt": "赛博朋克城市..."
# }
```

**Agent 用法**：使用 `--json` 获取节点 ID 和 label，用于后续的连接（edge add）或删除（node delete）操作。
