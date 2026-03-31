# @flowcanvas/cli

FlowCanvas 命令行工具，让你和 AI Agent 都能通过终端操作 FlowCanvas 画布，生成图片、视频和音频。

---

## 环境要求

在安装 FlowCanvas CLI 之前，请确认以下两项已就绪：

### 1. FlowCanvas 桌面端

CLI 需要连接本地运行的 FlowCanvas 桌面端（默认地址 `http://localhost:8000`）。请先启动 FlowCanvas，再执行任何 CLI 命令。

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
npx skills add @flowcanvas/cli -y -g
```

Skill 是 AI Agent（如 Claude Code）的"操作手册"。安装后，Claude Code 会自动学会如何使用 FlowCanvas CLI 帮你生成图片、视频和音频，无需手动配置任何东西。

> 如果你只打算自己在终端敲命令，不使用 AI Agent，可以跳过第二步。

---

## 验证安装

两步完成后，运行以下命令确认一切正常：

```bash
flowcanvas --version   # 应输出当前版本号，如 1.4.2
flowcanvas health      # 应输出 ✓ FlowCanvas is running（需桌面端已启动）
```

如果 `flowcanvas health` 返回连接失败，请检查 FlowCanvas 桌面端是否已启动。

---

## 更新到最新版本

重新执行安装时的两条命令即可，会自动覆盖旧版本：

```bash
npm install -g @flowcanvas/cli
npx skills add @flowcanvas/cli -y -g
```

---

## 快速开始

```bash
# 列出所有画布
flowcanvas canvas list

# 查看某个画布的节点（将 <uuid> 替换为上一步列出的 UUID）
flowcanvas canvas get <uuid>

# 查看可用的 AI 模型配置
flowcanvas config list --type image

# 一步生成图片（将 <uuid> 和 <config_id> 替换为你自己的值）
flowcanvas generate image <uuid> --prompt "赛博朋克城市夜景" --config <config_id>
```

> CLI 操作完成后，FlowCanvas 桌面端会在 5 秒内自动刷新，无需手动操作。

---

## 命令参考

### 全局选项

| 选项 | 说明 |
|------|------|
| `--json` | JSON 格式输出（AI Agent 解析推荐） |
| `--server <url>` | FlowCanvas 地址（默认 `http://localhost:8000`） |

---

### health

```bash
flowcanvas health
```

检查 FlowCanvas 桌面端是否运行。

---

### canvas

```bash
flowcanvas canvas list                   # 列出所有画布
flowcanvas canvas create <name>          # 创建画布（必须命名）
flowcanvas canvas get <uuid>             # 查看画布内所有节点
```

---

### config

```bash
flowcanvas config list                   # 列出所有模型配置
flowcanvas config list --type image      # 按类型筛选（image / video / audio）
flowcanvas config params <config_id>     # 查看某模型支持的参数和合法值
```

---

### generate

所有 `generate` 命令均**自动等待生成完成**（最长 10 分钟），省略 `--node` 时**自动创建节点**并绑定结果。

#### generate image

```bash
flowcanvas generate image <canvas_uuid> \
  --prompt "赛博朋克城市夜景" \
  --config <config_id> \
  [--model <model_key>]
  [--aspect-ratio <ratio>]       # 宽高比，合法值通过 config params 查看（如 1:1, 16:9）
  [--resolution <res>]           # 分辨率，合法值通过 config params 查看（如 1K, 2K, 4K）
  [--count 1|2|4]                # 生成数量，并非所有模型支持
  [--from <image_node_id>]       # 参考图节点 ID（可多次传入，实现多图融合）
  [--node <element_id>]          # 省略则自动创建节点
  [--label <label>]              # 节点显示名称
```

#### generate video

```bash
flowcanvas generate video <canvas_uuid> \
  --config <config_id> \
  [--prompt "城市漫游镜头"]
  [--from <image_node_id>]       # 图生视频：以指定节点的图片为首帧
  [--last-frame <image_node_id>] # 首尾帧视频：与 --from 配合使用
  [--duration <seconds>]         # 视频时长（秒）
  [--resolution <res>]           # 合法值通过 config params 查看
  [--ratio <ratio>]              # 宽高比，合法值通过 config params 查看
  [--node <element_id>]          # 省略则自动创建节点
  [--label <label>]              # 节点显示名称
```

#### generate audio

```bash
flowcanvas generate audio <canvas_uuid> \
  --prompt "欢快的电子舞曲" \
  --config <config_id> \
  [--model <model_key>]
  [--style <style>]              # 音乐风格
  [--title <title>]              # 歌曲标题
  [--instrumental]               # 纯音乐（无人声）
  [--node <element_id>]          # 省略则自动创建节点
  [--label <label>]              # 节点显示名称
```

---

### node

```bash
flowcanvas node add <uuid> <type>                            # 添加空节点（自动定位）
flowcanvas node add <uuid> <type> --from <source_node_id>   # 添加节点并连接到来源节点
flowcanvas node delete <uuid> <element_id>                  # 删除节点（同时删除关联连线）
```

**节点类型**：`image-generation` / `video-generation` / `audio-generation` / `text`

---

### edge

```bash
flowcanvas edge add <uuid> <source_id> <target_id>   # 连接两个已有节点
```

---

## 核心工作流

### 文生图（1 步）

```bash
flowcanvas generate image <uuid> --prompt "..." --config <id>
```

### 图生视频（2 步）

```bash
# Step 1：生成图片，获取节点 ID
flowcanvas --json generate image <uuid> --prompt "..." --config <img_config_id>
# 输出示例：{ "nodeId": "abc-123", "status": "completed", ... }

# Step 2：以图片为首帧生成视频
flowcanvas generate video <uuid> --from abc-123 --config <vid_config_id>
```

### 首尾帧视频（指定起止画面）

```bash
flowcanvas generate video <uuid> \
  --from <first_frame_node_id> \
  --last-frame <last_frame_node_id> \
  --prompt "角色从 A 姿势变换到 B 姿势" \
  --config <vid_config_id>
```

### 多图融合（多张参考图 → 新图片）

```bash
flowcanvas generate image <uuid> \
  --from <image_node_id_1> \
  --from <image_node_id_2> \
  --prompt "融合两个角色风格" \
  --config <img_config_id>
```

### 文生音频（1 步）

```bash
flowcanvas generate audio <uuid> --prompt "欢快的电子舞曲" --config <audio_config_id>
```
