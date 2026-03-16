# PAI × Notion: When 13 AI Agents Share a Brain

> Submission for the [Notion MCP Challenge](https://dev.to/challenges/notion-2026-03-04)

## What is this?

PAI (Personal AI) is a system of **13 specialized AI agents** that run 24/7 on Telegram, managing projects, writing content, monitoring infrastructure, and making decisions together like a Board of Directors.

This project connects PAI's multi-agent system to **Notion as a shared brain** — giving all 13 agents a visual, human-readable workspace where tasks, memory, decisions, and daily briefings are synced bidirectionally.

## The 13 Agents

| Agent | Role | Model |
|-------|------|-------|
| 👑 General | Orchestrator (190+ tools) | Claude Opus |
| 🔬 Research | Deep Analysis | Claude Opus |
| ✍️ Content | Social Media | Groq Llama |
| 💰 Finance | Budget & ROI | Groq Llama |
| 🎯 Strategy | Business Strategy | Claude Opus |
| 😈 Critic | Devil's Advocate | Claude Opus |
| 🧠 Psycho | Psychoanalyst | Claude Opus |
| 🎨 Artist | Visual Director | Claude Opus |
| ✏️ Writer | Literary Director | Claude Opus |
| 🛡️ DevOps | Infrastructure | Groq Llama |
| 📈 Sales | Growth | Groq Llama |
| 📊 Analytics | Data & Metrics | Groq Llama |
| 🌍 Translator | Localization | Groq Llama |

## 5 Notion Databases

1. **🤖 Agent Registry** — all 13 agents with status, level, tasks completed
2. **📋 Task Board** — bidirectional sync with PAI's internal task system
3. **🧠 Memory Log** — facts, insights, standing orders from PAI's memory
4. **📰 Daily Briefings** — auto-generated daily summaries with mood tracking
5. **🏛️ Board Meetings** — decisions from agent coordination sessions

## How It Works

```
PAI (Telegram bot)          Notion (shared brain)
┌──────────────┐           ┌──────────────────┐
│ 13 agents    │◄─────────►│ 5 databases      │
│ 190+ tools   │  sync.ts  │ Agent Registry   │
│ memory.md    │◄─────────►│ Task Board       │
│ tasks.json   │           │ Memory Log       │
│ daily logs   │──────────►│ Daily Briefings  │
│ board meets  │──────────►│ Board Meetings   │
└──────────────┘           └──────────────────┘
```

### Bidirectional Sync

- **PAI → Notion**: Tasks, memory, agent states, briefings, meeting notes
- **Notion → PAI**: Task status changes, new tasks created by humans, priority updates

### Key Features

- **Deduplication**: Tasks matched by PAI Task ID — updates existing, creates new
- **Status mapping**: PAI statuses (`todo`, `in_progress`, `done`, `blocked`) ↔ Notion selects with emoji
- **Real data**: Uses actual PAI production data, not mock data
- **Agent state tracking**: Level, XP, tasks completed, last active
- **Daily briefings**: Auto-generated summaries with mood indicators

## Quick Start

```bash
# Install
bun install

# Set environment variables
export NOTION_TOKEN="your-notion-integration-token"
export NOTION_PAGE_ID="your-parent-page-id"

# 1. Create Notion workspace
bun run setup

# 2. Run interactive demo (populates everything)
bun run demo

# 3. Or run sync manually
bun run sync
```

## Architecture

```
src/
├── setup.ts   — Creates 5 Notion databases with proper schemas
├── sync.ts    — Bidirectional sync engine (PAI ↔ Notion)
└── demo.ts    — Interactive demo with real PAI data
```

### Notion MCP Integration

This project uses `@notionhq/client` for direct API access and `@notionhq/notion-mcp-server` as the MCP bridge. The sync engine (`sync.ts`) exports all functions for use by PAI's agent system:

```typescript
import {
  syncTaskToNotion,    // PAI → Notion task sync
  syncFactToNotion,    // Memory → Notion
  syncAgentState,      // Agent status updates
  createDailyBriefing, // Auto-generated briefings
  logBoardMeeting,     // Board of Directors sessions
  getNotionTasks,      // Notion → PAI (reverse sync)
} from "./sync";
```

## Why Notion?

PAI agents communicate via Telegram and store state in markdown files and JSON. This works — but it's invisible to the human operator.

Notion gives us:
- **Visual dashboard** for 13 agents' status at a glance
- **Human-writable task board** — Marek can add/edit tasks directly
- **Meeting history** — every Board of Directors decision is logged
- **Memory transparency** — what does PAI actually remember?
- **Daily briefings** — one page to understand what happened today

## Built With

- [Bun](https://bun.sh) — runtime
- [@notionhq/client](https://github.com/makenotion/notion-sdk-js) — Notion API
- [@notionhq/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) — MCP bridge
- TypeScript
- PAI — our 13-agent AI system

## Author

Built by **Marek** and **PAI Family** (13 AI agents) in Rio de Janeiro, Brazil.

Part of the [HYPHANTA](https://hypha.art) project — an AI civilization woven from human words.
