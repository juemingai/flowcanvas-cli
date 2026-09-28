# @flowcanvas/cli

FlowCanvas 命令行工具，让你和 AI Agent 都能通过终端操作 FlowCanvas 画布，生成图片、视频和音频。

---

## 环境要求

在安装 FlowCanvas CLI 之前，请确认以下两项已就绪：

### 1. FlowCanvas 桌面端

CLI 需要连接本地运行的 FlowCanvas 桌面端（自动探测地址：桌面端 `http://127.0.0.1:28765`，开发模式 `:8000`）。请先启动 FlowCanvas，再执行任何 CLI 命令。

### 2. Node.js 22 或更高版本

CLI 基于 Node.js 运行。请打开终端，输入以下命令检查是否已安装：

```bash
node --version
```

如果输出 `v22.x.x` 或更高版本，说明已满足要求。

如果提示"命令未找到"或版本过低，请前往 [nodejs.org](https://nodejs.org/) 下载安装最新的 LTS 版本（推荐选择标有 **LTS** 的版本，当前为 v22）。

> **macOS 用户**：也可以通过 Homebrew 安装：`brew install node`
>
> **Windows 用户**：下载 `.msi` 安装包，一路点击"下一步"即可

---

## 安装

确认 Node.js 就绪后，在终端中依次执行以下两条命令：

**第一步：安装 FlowCanvas CLI**

```bash
npm install -g @flowcanvas/cli
```

这条命令会把 `flowcanvas` 命令安装到你的电脑上，安装完成后即可在任意目录使用。

**第二步：安装 Skill（AI Agent 使用必需）**

```bash
npx skills add juemingai/flowcanvas-cli -y -g
```

Skill 是 AI Agent（如 Claude Code）的"操作手册"。安装后，Claude Code 会自动学会如何使用 FlowCanvas CLI 帮你生成图片、视频和音频，无需手动配置任何东西。

> 如果你只打算自己在终端敲命令，不使用 AI Agent，可以跳过第二步。

---

## 验证安装

两步完成后，运行以下命令确认一切正常：

```bash
flowcanvas --version   # 输出当前版本号
flowcanvas health      # 输出 {"ok": true, "data": {"status": "ok", ...}}（需桌面端已启动）
```

如果 `flowcanvas health` 返回 `unreachable`，请检查 FlowCanvas 桌面端是否已启动。

---

## 更新到最新版本

重新执行安装时的两条命令即可，会自动覆盖旧版本：

```bash
npm install -g @flowcanvas/cli
npx skills add juemingai/flowcanvas-cli -y -g
```

---

## 与 MCP 的关系

CLI 的每条命令都与 FlowCanvas MCP 的一个工具一一对应（`generate_image` ↔ `flowcanvas generate-image`），
**能力完全一致**：命令和参数在运行时从 FlowCanvas 后端的 MCP 工具定义动态生成，FlowCanvas 新增或修改工具后
CLI 自动跟随，无需升级。因此除 `health`、`mcp` 外，其余命令都需要 FlowCanvas 正在运行才能列出和执行。

---

## 快速开始

```bash
flowcanvas tools                                   # 列出全部命令
flowcanvas list-canvases                           # 列出画布
flowcanvas get-canvas --canvas-id <canvas_id>      # 查看画布内的节点与连线
flowcanvas list-configs --model-type image         # 查看可用的图片模型配置
flowcanvas generate-image --canvas-id <canvas_id> --prompt "赛博朋克城市夜景" \
  --config-id <config_id> --wait                   # 生成图片并等待结果
```

> 用户若正打开同一画布，改动会在数秒内同步显示，无需手动刷新。

---

## 命令参考

完整命令以 `flowcanvas tools` 为准，参数以 `flowcanvas <command> --help` 为准（内容来自后端工具定义）。

### 固定命令

| 命令 | 说明 |
|------|------|
| `flowcanvas health` | 检查 FlowCanvas 是否运行 |
| `flowcanvas tools` | 列出全部工具命令 |
| `flowcanvas call <tool> --json '{...}'` | 按 MCP 工具原名调用 |
| `flowcanvas mcp` | stdio MCP 桥接（见下文） |

### 全局选项

| 选项 | 说明 |
|------|------|
| `--pretty` | 人类可读格式输出，默认为 JSON（`{"ok": true, "data": ...}`） |
| `--server <url>` | FlowCanvas 地址（默认自动探测：`FLOWCANVAS_API_BASE` → `~/.flowcanvas/runtime.json` → `:28765` → `:8000`） |

### 参数写法

| 参数类型 | 写法 |
|------|------|
| 字符串 / 数字 | `--canvas-id abc`、`--count 2`（参数名 snake_case 转 kebab-case） |
| 布尔 | `--include-schema` / `--no-include-schema` |
| 列表 | 重复传入：`--reference-node-ids a --reference-node-ids b` |
| 对象 / 复杂列表 | JSON 字符串：`--extra-params '{"voiceId":"female-shaonv"}'` |
| 全部参数 | `--json '{"canvas_id":"...","prompt":"..."}'`（单独给出的参数优先） |

### 生成与等待

生成类命令（`generate-image` / `generate-video` / `generate-audio` / `generate-text` / `regenerate-node`）
**默认不阻塞**，立即返回 `node_id`，结果在后台完成后写回画布：

- 加 `--wait` 等待完成并直接返回结果（含本机文件路径 `local_path`），`--wait-timeout <秒>` 调整最长等待（默认 1800）
- 或之后运行 `flowcanvas wait-for-nodes --canvas-id <id> --node-ids <node_id>`

---

## 常用工作流

```bash
# 图生视频：以已有图片节点为参考（自动连线）
flowcanvas generate-video --canvas-id <id> --prompt "城市漫游镜头" \
  --config-id <video_config_id> --reference-node-ids <image_node_id> --wait

# 首尾帧视频：两个图片节点依次为首帧、尾帧
flowcanvas generate-video --canvas-id <id> --prompt "从 A 姿势变换到 B 姿势" --video-mode sef \
  --config-id <video_config_id> --reference-node-ids <first_id> --reference-node-ids <last_id> --wait

# 多图融合
flowcanvas generate-image --canvas-id <id> --prompt "融合两个角色风格" \
  --config-id <image_config_id> --reference-node-ids <id1> --reference-node-ids <id2> --wait

# MiniMax TTS：先查音色 ID
flowcanvas list-voices --lang 中文 --pretty
flowcanvas generate-audio --canvas-id <id> --prompt "欢迎使用 FlowCanvas" --scene tts \
  --config-id <audio_config_id> --extra-params '{"voiceId":"female-shaonv","emotion":"happy"}' --wait
```

---

## MCP 桥接（Claude Desktop 等仅支持 stdio 的客户端）

`flowcanvas mcp` 把 stdio 转发到 FlowCanvas 后端的 MCP 服务（`/mcp`），工具全部来自后端：

```json
{ "mcpServers": { "flowcanvas": { "command": "npx", "args": ["-y", "@flowcanvas/cli", "mcp"] } } }
```

支持 HTTP 的客户端（Claude Code、Codex、Cursor）可直接连 `http://127.0.0.1:28765/mcp`。详见 FlowCanvas 设置页「MCP 接入」。
