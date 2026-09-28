---
name: flowcanvas
version: 2.0.0
description: "FlowCanvas 画布操作：管理画布与节点、连线、触发 AI 图片/视频/音频/文本生成、查看与处理生成结果。需要本地运行 FlowCanvas 桌面端（自动探测端口）。当用户提到 FlowCanvas、画布操作、AI 生图/视频/音频生成时触发。"
metadata:
  requires:
    bins: ["flowcanvas"]
  cliHelp: "flowcanvas tools"
---

# FlowCanvas 画布操作

`flowcanvas` CLI 的每条命令都与 FlowCanvas MCP 的一个工具一一对应（工具名 `generate_image` ↔ 命令
`flowcanvas generate-image`），能力完全一致。命令和参数来自正在运行的 FlowCanvas，**不要凭记忆写参数**：

```bash
flowcanvas health                    # 确认 FlowCanvas 正在运行
flowcanvas tools                     # 列出全部命令（类型：read / write / destructive / generate）
flowcanvas <command> --help          # 查看某条命令的参数、取值范围与详细说明
```

## 参数写法

- 参数名 snake_case → `--kebab-case`：`canvas_id` → `--canvas-id`
- 布尔：`--include-schema` / `--no-include-schema`
- 列表：重复传入 `--node-ids a --node-ids b`
- 对象 / 复杂列表：传 JSON 字符串 `--extra-params '{"voiceId":"female-shaonv"}'`
- 也可一次性传全部参数：`--json '{"canvas_id":"...","prompt":"..."}'`，或按工具原名调用 `flowcanvas call generate_image --json '{...}'`
- 默认输出 JSON：`{"ok": true, "data": ...}`；失败时 `{"ok": false, "error": {...}}` 且退出码非 0；`--pretty` 为人类可读格式

## 典型流程

```bash
# 1. 确定画布
flowcanvas list-canvases
flowcanvas get-canvas --canvas-id <canvas_id>

# 2. 生成前先取真实的 config_id / model_key 与参数取值（不要凭记忆填写）
flowcanvas list-configs --model-type image

# 3. 生成（非阻塞，立即返回 node_id）；加 --wait 等待完成并直接返回结果
flowcanvas generate-image --canvas-id <canvas_id> --prompt "赛博朋克城市夜景" \
  --config-id <config_id> --model-key <model_key> --wait

# 4. 以已有节点为参考继续生成（自动连线）：图生视频、多图融合、首尾帧（--video-mode sef）等
flowcanvas generate-video --canvas-id <canvas_id> --prompt "城市漫游镜头" \
  --config-id <config_id> --reference-node-ids <image_node_id> --wait

# 5. 未加 --wait 或等待超时：继续等待，不要重复调用生成命令
flowcanvas wait-for-nodes --canvas-id <canvas_id> --node-ids <node_id>
```

TTS 音色：`flowcanvas list-voices` 查看语言分组，`flowcanvas list-voices --lang 中文` 查看音色 ID，
再通过 `generate-audio --scene tts --extra-params '{"voiceId":"..."}'` 使用。

## 画布选择规则

1. **未指定画布时必须询问用户**：运行 `list-canvases`，展示名称、最近修改时间、节点数，让用户选择或新建。禁止静默使用最近的画布或自动新建。
2. **用户提到画布名称时先模糊匹配**：唯一匹配直接使用；多个匹配列出让用户选；未找到则告知并展示完整列表。
3. **新建画布必须命名**：创建前先问用户名称，禁止使用 "Untitled Canvas" 等默认名。

## 生成结果处理

生成完成后把文件发给用户，而不只是说"已完成，请查看桌面端"——用户可能不在桌面端前。

- `wait-for-nodes`（或 `--wait`）的结果里每个产物都带 `local_path`（本机绝对路径），直接读取该文件发送给用户；多个结果逐一发送。
- 查看图片效果可用 `flowcanvas view-image --canvas-id <id> --node-id <id>`，输出的 `image_path` 是缩略图文件路径。

## 其他

- 用户若正打开同一画布，改动会在数秒内同步显示，无需手动刷新。
- FlowCanvas 未启动时命令会返回错误并提示先启动桌面端。
- `--server <url>` 可指定地址；默认自动探测：`FLOWCANVAS_API_BASE` → `~/.flowcanvas/runtime.json` → `:28765` → `:8000`。
