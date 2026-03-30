# FlowCanvas CLI

A command-line tool for [FlowCanvas](https://github.com/juemingai/flowcanvas) — built for humans and AI Agents. Manage canvases, add/connect/delete nodes, and trigger AI image/video/audio generation via your local FlowCanvas desktop app.

## Installation

### CLI

```bash
npm install -g @flowcanvas/cli
```

### AI Agent Skills

```bash
npx skills add juemingai/flowcanvas-cli -y -g
```

## Quick Start

```bash
# 1. Make sure FlowCanvas desktop app is running
flowcanvas health

# 2. List canvases
flowcanvas canvas list

# 3. Create a canvas
flowcanvas canvas create "My Project"

# 4. Check available model configs
flowcanvas config list --type image

# 5. Generate an image
flowcanvas generate image <canvas_uuid> --prompt "cyberpunk city" --config <config_id>
```

## Commands

| Command | Description |
|---------|-------------|
| `flowcanvas health` | Check if FlowCanvas is running |
| `flowcanvas canvas list` | List all canvases |
| `flowcanvas canvas create <name>` | Create a new canvas |
| `flowcanvas canvas get <uuid>` | View canvas nodes |
| `flowcanvas node add <uuid> <type>` | Add a node (supports `--from` for auto-connect) |
| `flowcanvas node delete <uuid> <id>` | Delete a node |
| `flowcanvas edge add <uuid> <src> <tgt>` | Connect two nodes |
| `flowcanvas config list [--type]` | List model configurations |
| `flowcanvas generate image <uuid>` | Generate an image |
| `flowcanvas generate video <uuid>` | Generate a video (supports `--from` for image-to-video) |
| `flowcanvas generate audio <uuid>` | Generate audio |

### Global Options

| Option | Description |
|--------|-------------|
| `--json` | JSON output (agent-friendly) |
| `--server <url>` | FlowCanvas server URL (default: `http://localhost:8000`) |

## AI Agent Skills

This repo provides 1 skill for AI agents:

| Skill | Description |
|-------|-------------|
| `flowcanvas` | Canvas operations: manage canvases, nodes, edges, and trigger AI generation |

Install skills to your agent:

```bash
npx skills add juemingai/flowcanvas-cli -y -g
```

## License

MIT
