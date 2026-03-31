# @flowcanvas/cli

FlowCanvas 命令行工具，让人类和 AI Agent 都能通过终端操作 FlowCanvas 画布。

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

Skill 是 AI Agent（如 Claude Code）的"操作手册"。安装后，Claude Code 会自动学会如何使用 FlowCanvas CLI 帮你生成图片、视频和音频，无需你手动配置任何东西。

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

```bash
npm install -g @flowcanvas/cli
npx skills add @flowcanvas/cli -y -g
```

两条命令重新执行一遍即可更新到最新版本（Skill 也会同步更新）。

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

---

## 设计思路

### 为什么是 CLI + Skills，而不是插件？

| 维度 | OpenClaw Plugin（旧方案） | CLI + Skills（现方案） |
|------|--------------------------|----------------------|
| 适用 Agent | 仅 OpenClaw | 任何支持 bash 的 Agent |
| 人类可用 | ❌ | ✅ 终端直接操作 |
| 调试 | 需通过 Agent | 命令行直接测试 |
| 安装 | 特定平台 | `npm install -g` |

受飞书 `lark-cli` 启发：先做 CLI，再通过 SKILL.md 教 Agent 用。这样 Claude Code、Cursor、Windsurf 等任何支持 bash 的 Agent 都能用，人类也能直接调试。

### 命令语义分层

```
generate image/video/audio   ← 高层命令（一步完成：建节点 + 生成 + 附加结果）
node add / edge add          ← 底层命令（只操作结构，不生成）
canvas list/create/get       ← 管理命令（画布元数据）
```

**`generate` 是主入口**：绝大多数场景用 `generate` 即可，不需要先 `node add` 再 `generate --node`。

`node add` / `edge add` 保留为底层命令，用于"先规划结构再生成"的高级场景。

### 自动建节点设计（v1.1.4+）

`generate` 命令省略 `--node` 时，**自动创建对应类型的节点**，生成完成后直接绑定结果：

```
用户之前（2步）：
  1. flowcanvas node add <uuid> image-generation   → 得到 node_id
  2. flowcanvas generate image <uuid> --node <node_id> --prompt "..." --config 1

用户现在（1步）：
  flowcanvas generate image <uuid> --prompt "..." --config 1
```

**向后兼容**：`--node <id>` 仍然有效，指定时直接附加到已有节点。

### JSON 输出与 nodeId

`--json` 模式下，`generate` 命令输出中包含 `nodeId`，方便 Agent 做链式调用：

```bash
# 图生视频两步流（Agent 友好）
NODE=$(flowcanvas --json generate image <uuid> --prompt "..." --config 1 | jq -r .nodeId)
flowcanvas generate video <uuid> --from $NODE --config 2
```

### 前端自动刷新机制

CLI 操作（新增节点、新增连线、更新生成结果）写入数据库后，前端 `useExternalChanges.ts` 每 5 秒轮询一次 `updated_at`，发现变更时：

1. 追加新节点（不覆盖本地状态）
2. 同步新增连接线（edges）
3. 更新已有节点的生成结果（imageGeneration / videoGeneration / audioGeneration）

**用户无需手动刷新**，操作完成后画布在 5 秒内自动同步。

---

## 命令参考

### 全局选项

| 选项 | 说明 |
|------|------|
| `--json` | JSON 格式输出（Agent 解析推荐） |
| `--server <url>` | FlowCanvas 地址（默认 `http://localhost:8000`） |

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

**`canvas get` JSON 输出的节点字段：**

```json
{
  "id": "node-uuid",
  "type": "image-generation",
  "x": 120, "y": 200,
  "generationState": "completed",
  "results_count": 1,
  "prompt": "赛博朋克城市..."
}
```

---

### node

```bash
flowcanvas node add <uuid> <type>              # 添加空节点
flowcanvas node add <uuid> <type> --x 500 --y 300   # 指定位置
flowcanvas node add <uuid> video-generation --from <source_id>  # 添加并连接

flowcanvas node delete <uuid> <element_id>    # 删除节点（同时删除关联连线）
```

**支持的节点类型**：`image-generation` / `video-generation` / `audio-generation` / `text`

---

### edge

```bash
flowcanvas edge add <uuid> <source_id> <target_id>   # 连接两个节点
```

---

### config

```bash
flowcanvas config list                  # 列出所有模型配置
flowcanvas config list --type image     # 按类型筛选（image / video / audio）
```

**JSON 输出字段**：`config_id`、`config_name`、`provider`、`models`

---

### generate

所有 `generate` 命令均**自动等待生成完成**（默认最长 10 分钟）。

省略 `--node` 时**自动创建节点**并绑定结果，`--json` 输出包含 `nodeId`。

#### generate image

```bash
flowcanvas generate image <canvas_uuid> \
  --prompt "赛博朋克城市夜景" \
  --config <config_id> \
  [--node <element_id>]          # 省略则自动创建节点
  [--model <model_key>]
  [--aspect-ratio <ratio>]       # 宽高比，合法值从 config params 获取（如 1:1, 16:9）
  [--resolution <res>]           # 分辨率，合法值从 config params 获取（如 1K, 2K, 4K）
  [--count 1|2|4]                # 并非所有模型支持，先用 config params 确认
```

#### generate video

```bash
flowcanvas generate video <canvas_uuid> \
  --config <config_id> \
  [--prompt "城市漫游镜头"]
  [--from <image_node_id>]       # 图生视频：自动创建视频节点 + 连线 + 生成
  [--node <element_id>]          # 省略则自动创建节点
  [--duration 5]
  [--resolution <res>]
  [--ratio 16:9]
```

#### generate audio

```bash
flowcanvas generate audio <canvas_uuid> \
  --prompt "欢快的电子舞曲" \
  --config <config_id> \
  [--node <element_id>]          # 省略则自动创建节点
  [--model <model_key>]
  [--style "Electronic"]
  [--title "My Song"]
  [--instrumental]
```

---

## 核心工作流

### 文生图（1步）

```bash
flowcanvas generate image <uuid> --prompt "..." --config <id>
```

### 图生视频（2步）

```bash
# Step 1: 生成图片，记录 nodeId
flowcanvas --json generate image <uuid> --prompt "..." --config <img_id>
# → { "nodeId": "abc-123", ... }

# Step 2: 图生视频
flowcanvas generate video <uuid> --from abc-123 --config <vid_id>
```

### 文生视频（1步）

```bash
flowcanvas generate video <uuid> --prompt "..." --config <id>
```

### 文生音频（1步）

```bash
flowcanvas generate audio <uuid> --prompt "..." --config <id>
```

### 高级：先建结构再批量生成

```bash
# 添加多个空节点
flowcanvas node add <uuid> image-generation
flowcanvas node add <uuid> image-generation
flowcanvas node add <uuid> image-generation

# 查看节点 ID
flowcanvas --json canvas get <uuid>

# 生成到指定节点
flowcanvas generate image <uuid> --node <id1> --prompt "日式城堡" --config 1
flowcanvas generate image <uuid> --node <id2> --prompt "哥特教堂" --config 1
```

---

## Skills（Agent 集成）

Skills 是给 Claude Code 等 AI Agent 看的"使用手册"，安装后 Agent 会自动知道如何使用 CLI。

```bash
npx skills add @flowcanvas/cli -y -g
```

Skills 文档位置：`skills/flowcanvas/SKILL.md`，包含：
- 画布选择规则（防止 Agent 乱建画布）
- 核心场景工作流
- 命令参考入口（references/ 目录）

---

## 开发与发布

### 双仓库结构

CLI 涉及两个仓库：

| 仓库 | 路径 | 用途 |
|------|------|------|
| **主仓库**（开发） | `FlowCanvas/flowcanvas-cli/` | 源码、编译、skills 原稿 |
| **发布仓库**（npm） | `github_path/flowcanvas-cli/` | 编译产物 + skills，用于 `npm publish` |

发布仓库只包含 `dist/`、`skills/`、`package.json`、`README.md`，**不含源码**。

---

### 完整发布流程

#### Step 1：在主仓库开发并编译

```bash
cd FlowCanvas/flowcanvas-cli

# 开发（监听编译）
npm run dev

# 正式构建
npm run build

# 本地验证
node dist/bin/flowcanvas.js health
node dist/bin/flowcanvas.js --help
```

#### Step 2：同步到发布仓库

```bash
# 同步编译产物
rm -rf ~/github_path/flowcanvas-cli/dist
cp -r FlowCanvas/flowcanvas-cli/dist ~/github_path/flowcanvas-cli/dist

# 同步 skill 文档
cp FlowCanvas/flowcanvas-cli/skills/flowcanvas/SKILL.md \
   ~/github_path/flowcanvas-cli/skills/flowcanvas/SKILL.md
cp FlowCanvas/flowcanvas-cli/skills/flowcanvas/references/*.md \
   ~/github_path/flowcanvas-cli/skills/flowcanvas/references/

# 同步 README（如果有更新）
cp FlowCanvas/flowcanvas-cli/README.md \
   ~/github_path/flowcanvas-cli/README.md
```

#### Step 3：在发布仓库 bump 版本并发布

```bash
cd ~/github_path/flowcanvas-cli

# 手动修改 package.json 的 version 字段（遵循语义化版本，见下表）

git add -A
git commit -m "feat/fix/docs: 描述本次更新，bump 版本至 x.x.x"
git push origin main

npm publish --access public
```

---

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

| 变更类型 | 版本升级 | 示例 |
|---------|---------|------|
| Bug 修复、文档更新 | patch（x.x.**+1**） | 1.1.4 → 1.1.5 |
| 新增命令或功能 | minor（x.**+1**.0） | 1.1.5 → 1.2.0 |
| 破坏性变更（命令重命名、参数改变等） | major（**+1**.0.0） | 1.2.0 → 2.0.0 |

---

### 常见更新场景

#### 只改 CLI 逻辑（不涉及 skills）

```bash
# 主仓库改代码 + 编译
cd FlowCanvas/flowcanvas-cli && npm run build

# 同步 dist
rm -rf ~/github_path/flowcanvas-cli/dist
cp -r dist ~/github_path/flowcanvas-cli/dist

# bump + publish
cd ~/github_path/flowcanvas-cli
# 修改 package.json version
git add -A && git commit -m "fix/feat: ..." && git push
npm publish --access public
```

#### 只改 Skill 文档（不涉及 CLI 逻辑）

```bash
# 编辑主仓库的 skills/ 文件后同步到发布仓库
cp FlowCanvas/flowcanvas-cli/skills/flowcanvas/SKILL.md \
   ~/github_path/flowcanvas-cli/skills/flowcanvas/SKILL.md
cp FlowCanvas/flowcanvas-cli/skills/flowcanvas/references/*.md \
   ~/github_path/flowcanvas-cli/skills/flowcanvas/references/

# bump patch + publish
cd ~/github_path/flowcanvas-cli
# 修改 package.json version（patch）
git add -A && git commit -m "docs: ..." && git push
npm publish --access public
```

#### CLI + Skills 都改（最常见）

按上面"完整发布流程"Step 1-3 全走一遍。

### 架构文件说明

```
flowcanvas-cli/
├── bin/flowcanvas.ts          # CLI 入口，版本号从 package.json 动态读取
├── src/
│   ├── client.ts              # HTTP 客户端（封装后端 API）
│   ├── poller.ts              # 任务轮询（2s 间隔，10min 超时）
│   ├── output.ts              # 输出格式化（table / json / color）
│   └── commands/
│       ├── canvas.ts          # canvas list/create/get
│       ├── node.ts            # node add/delete
│       ├── edge.ts            # edge add
│       ├── generate.ts        # generate image/video/audio（核心逻辑）
│       ├── config-list.ts     # config list
│       └── health.ts          # health check
└── skills/flowcanvas/
    ├── SKILL.md               # Agent 主技能文档
    └── references/
        ├── flowcanvas-canvas.md
        ├── flowcanvas-generate.md
        └── flowcanvas-node.md
```

### 后端依赖端点

CLI 调用的后端 API（均在 FlowCanvas 后端 `localhost:8000`）：

| 端点 | 用途 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /api/canvases` | 画布列表 |
| `POST /api/canvases` | 创建画布 |
| `GET /api/canvases/{uuid}` | 画布详情（含 elements + edges） |
| `PUT /api/canvases/{uuid}` | 更新画布 elements |
| `GET /api/canvases/{uuid}/elements` | 节点列表（摘要） |
| `POST /api/canvases/{uuid}/elements` | 添加节点 |
| `DELETE /api/canvases/{uuid}/elements/{id}` | 删除节点 |
| `POST /api/canvases/{uuid}/edges` | 添加连线 |
| `GET /api/configs/available` | 可用模型配置 |
| `POST /api/image/generate-async` | 异步图片生成 |
| `POST /api/video/generate-async` | 异步视频生成（支持 images 附件做图生视频） |
| `POST /api/audio/generate-async` | 异步音频生成 |
| `GET /api/tasks/{task_id}` | 任务状态轮询 |

### 注意事项

- `skills/` 目录被 `.gitignore` 忽略，提交时需 `git add -f flowcanvas-cli/skills`
- 版本号在 `package.json` 中，CLI 运行时动态读取（`bin/flowcanvas.ts` 用 `createRequire` 读取 `../../package.json`）
- 图生视频时，CLI 会从源节点的 `imageGeneration.results[currentResultIndex].url` 读取图片 URL，然后 fetch 成 blob 附加到 FormData 的 `images` 字段
- 生成结果写回画布时，仅更新 `elements` 字段（`PUT { elements }`），后端会保留 `edges` 不变
