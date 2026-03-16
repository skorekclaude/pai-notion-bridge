/**
 * PAI × Notion: Bidirectional Sync Engine
 * Syncs PAI task board, memory, and agent states with Notion
 *
 * Runs as a cron job or on-demand:
 *   bun run sync          — full sync
 *   bun run sync tasks    — tasks only
 *   bun run sync memory   — memory only
 *   bun run sync agents   — agent states only
 */

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

interface NotionConfig {
  agentRegistry: string;
  taskBoard: string;
  memoryLog: string;
  dailyBriefings: string;
  meetingNotes: string;
}

interface PAITask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  owner: string;
  priority: "low" | "medium" | "high" | "critical";
  project?: string;
  deadline?: string;
  notes?: string;
}

interface PAIFact {
  fact: string;
  category: "fact" | "goal" | "insight" | "standing_order" | "contact";
  source?: string;
  created?: string;
}

// ── Status mapping ──
const STATUS_MAP: Record<string, string> = {
  "todo": "⬜ Todo",
  "in_progress": "🔄 In Progress",
  "done": "✅ Done",
  "blocked": "🚫 Blocked",
};

const PRIORITY_MAP: Record<string, string> = {
  "low": "⚪ Low",
  "medium": "🟢 Medium",
  "high": "🟡 High",
  "critical": "🔴 Critical",
};

const CATEGORY_MAP: Record<string, string> = {
  "fact": "📝 Fact",
  "goal": "🎯 Goal",
  "insight": "💡 Insight",
  "standing_order": "⚠️ Standing Order",
  "contact": "👤 Contact",
};

async function loadConfig(): Promise<NotionConfig> {
  const file = Bun.file("notion-config.json");
  if (!await file.exists()) {
    console.error("❌ Run 'bun run setup' first to create Notion databases");
    process.exit(1);
  }
  return JSON.parse(await file.text());
}

// ── Task Sync: PAI → Notion ──
async function syncTaskToNotion(config: NotionConfig, task: PAITask) {
  // Check if task already exists in Notion (by PAI Task ID)
  const existing = await notion.databases.query({
    database_id: config.taskBoard,
    filter: {
      property: "PAI Task ID",
      rich_text: { equals: task.id }
    }
  });

  const properties: any = {
    "Task": { title: [{ text: { content: task.title } }] },
    "Status": { select: { name: STATUS_MAP[task.status] || "⬜ Todo" } },
    "Owner": { select: { name: task.owner } },
    "Priority": { select: { name: PRIORITY_MAP[task.priority] || "🟢 Medium" } },
    "PAI Task ID": { rich_text: [{ text: { content: task.id } }] },
  };

  if (task.project) {
    properties["Project"] = { select: { name: task.project } };
  }
  if (task.deadline) {
    properties["Deadline"] = { date: { start: task.deadline } };
  }
  if (task.notes) {
    properties["Notes"] = { rich_text: [{ text: { content: task.notes.slice(0, 2000) } }] };
  }

  if (existing.results.length > 0) {
    // Update existing
    await notion.pages.update({
      page_id: existing.results[0].id,
      properties
    });
    console.log(`  🔄 Updated: ${task.title}`);
  } else {
    // Create new
    await notion.pages.create({
      parent: { database_id: config.taskBoard },
      properties
    });
    console.log(`  ✅ Created: ${task.title}`);
  }
}

// ── Task Sync: Notion → PAI ──
async function getNotionTasks(config: NotionConfig): Promise<PAITask[]> {
  const response = await notion.databases.query({
    database_id: config.taskBoard,
    sorts: [{ property: "Priority", direction: "ascending" }]
  });

  return response.results.map((page: any) => {
    const props = page.properties;
    const statusName = props["Status"]?.select?.name || "";
    const priorityName = props["Priority"]?.select?.name || "";

    // Reverse map
    const status = Object.entries(STATUS_MAP).find(([_, v]) => v === statusName)?.[0] || "todo";
    const priority = Object.entries(PRIORITY_MAP).find(([_, v]) => v === priorityName)?.[0] || "medium";

    return {
      id: props["PAI Task ID"]?.rich_text?.[0]?.text?.content || page.id,
      title: props["Task"]?.title?.[0]?.text?.content || "Untitled",
      status: status as PAITask["status"],
      owner: props["Owner"]?.select?.name || "general",
      priority: priority as PAITask["priority"],
      project: props["Project"]?.select?.name,
      deadline: props["Deadline"]?.date?.start,
      notes: props["Notes"]?.rich_text?.[0]?.text?.content,
    };
  });
}

// ── Memory Sync: PAI → Notion ──
async function syncFactToNotion(config: NotionConfig, fact: PAIFact) {
  await notion.pages.create({
    parent: { database_id: config.memoryLog },
    properties: {
      "Fact": { title: [{ text: { content: fact.fact.slice(0, 2000) } }] },
      "Category": { select: { name: CATEGORY_MAP[fact.category] || "📝 Fact" } },
      "Source Agent": fact.source ? { select: { name: fact.source } } : undefined,
      "Created": { date: { start: fact.created || new Date().toISOString() } },
    }
  });
  console.log(`  🧠 Synced: ${fact.fact.slice(0, 60)}...`);
}

// ── Agent State Sync ──
async function syncAgentState(config: NotionConfig, agentId: string, state: {
  status?: string;
  tasksCompleted?: number;
  level?: number;
  lastActive?: string;
}) {
  const existing = await notion.databases.query({
    database_id: config.agentRegistry,
    filter: {
      property: "ID",
      rich_text: { equals: agentId }
    }
  });

  if (existing.results.length === 0) {
    console.log(`  ⚠️ Agent not found: ${agentId}`);
    return;
  }

  const properties: any = {};
  if (state.status) properties["Status"] = { select: { name: state.status } };
  if (state.tasksCompleted !== undefined) properties["Tasks Completed"] = { number: state.tasksCompleted };
  if (state.level !== undefined) properties["Level"] = { number: state.level };
  if (state.lastActive) properties["Last Active"] = { date: { start: state.lastActive } };

  await notion.pages.update({
    page_id: existing.results[0].id,
    properties
  });
  console.log(`  🤖 Updated agent: ${agentId}`);
}

// ── Daily Briefing Generator ──
async function createDailyBriefing(config: NotionConfig, briefing: {
  date: string;
  summary: string;
  highlights: string;
  blockers: string;
  agentActivity: string;
  mood: string;
}) {
  await notion.pages.create({
    parent: { database_id: config.dailyBriefings },
    properties: {
      "Date": { title: [{ text: { content: briefing.date } }] },
      "Summary": { rich_text: [{ text: { content: briefing.summary } }] },
      "Highlights": { rich_text: [{ text: { content: briefing.highlights } }] },
      "Blockers": { rich_text: [{ text: { content: briefing.blockers } }] },
      "Agent Activity": { rich_text: [{ text: { content: briefing.agentActivity } }] },
      "Mood": { select: { name: briefing.mood } },
    }
  });
  console.log(`  📰 Daily briefing created: ${briefing.date}`);
}

// ── Board Meeting Logger ──
async function logBoardMeeting(config: NotionConfig, meeting: {
  title: string;
  date: string;
  participants: string[];
  topic: string;
  decisions: string;
  actionItems: string;
  consensus: string;
}) {
  await notion.pages.create({
    parent: { database_id: config.meetingNotes },
    properties: {
      "Meeting": { title: [{ text: { content: meeting.title } }] },
      "Date": { date: { start: meeting.date } },
      "Participants": { multi_select: meeting.participants.map(p => ({ name: p })) },
      "Topic": { rich_text: [{ text: { content: meeting.topic } }] },
      "Decisions": { rich_text: [{ text: { content: meeting.decisions } }] },
      "Action Items": { rich_text: [{ text: { content: meeting.actionItems } }] },
      "Consensus": { select: { name: meeting.consensus } },
    }
  });
  console.log(`  🏛️ Board meeting logged: ${meeting.title}`);
}

// ── Full Sync ──
async function fullSync() {
  const config = await loadConfig();
  console.log("\n🔄 PAI × Notion Full Sync\n");

  // Example: sync sample tasks
  const sampleTasks: PAITask[] = [
    {
      id: "hack-001",
      title: "Notion MCP Challenge — build integration",
      status: "in_progress",
      owner: "devops",
      priority: "critical",
      project: "PAI",
      deadline: "2026-03-16",
    },
    {
      id: "hack-002",
      title: "Write DEV.to article for Notion MCP submission",
      status: "todo",
      owner: "content",
      priority: "critical",
      project: "PAI",
      deadline: "2026-03-16",
    },
    {
      id: "hack-003",
      title: "HYPHA — Ceremony of 7 Membranes + ECHO engine",
      status: "in_progress",
      owner: "devops",
      priority: "high",
      project: "THEATRON",
    },
  ];

  console.log("📋 Syncing tasks...");
  for (const task of sampleTasks) {
    await syncTaskToNotion(config, task);
  }

  // Example: sync sample facts
  console.log("\n🧠 Syncing memory...");
  const sampleFacts: PAIFact[] = [
    {
      fact: "PAI Family consists of 13 AI agents with distinct personalities, working together like a Board of Directors",
      category: "fact",
      source: "general",
      created: "2026-03-14T00:00:00Z",
    },
    {
      fact: "HYPHANTA (Ὑφαντά) — our civilization name. Woven from human words. From Greek ὑφαίνω = to weave.",
      category: "insight",
      source: "writer",
      created: "2026-03-14T00:00:00Z",
    },
    {
      fact: "Always publish social media posts with images on all platforms that support them",
      category: "standing_order",
      source: "general",
      created: "2026-03-14T00:00:00Z",
    },
  ];

  for (const fact of sampleFacts) {
    await syncFactToNotion(config, fact);
  }

  // Example: create daily briefing
  console.log("\n📰 Creating daily briefing...");
  await createDailyBriefing(config, {
    date: new Date().toISOString().split("T")[0],
    summary: "Hackathon day — building Notion MCP integration. CC working on HYPHA ceremony of 7 membranes.",
    highlights: "✅ WeCoded submission ready, ✅ Notion MCP research complete, 🔨 Building integration",
    blockers: "DEV.to daily post limit reached (5/5), agent restart needed",
    agentActivity: "General: orchestrating hackathon, DevOps: building code, Content: preparing article, Artist: cover image",
    mood: "🚀 Breakthrough",
  });

  // Example: log board meeting
  console.log("\n🏛️ Logging board meeting...");
  await logBoardMeeting(config, {
    title: "Hackathon Strategy — Notion MCP Challenge",
    date: new Date().toISOString(),
    participants: ["general", "research", "content", "devops", "strategy"],
    topic: "How to win the Notion MCP Challenge with PAI × Notion integration",
    decisions: "Build 'shared brain' concept — Notion as control plane for 13 agents. Focus on real, working system, not demo.",
    actionItems: "1. Build setup + sync scripts, 2. Create demo video, 3. Write DEV.to article, 4. Cover image",
    consensus: "✅ Unanimous",
  });

  console.log("\n✅ Full sync complete!");
}

// ── CLI ──
const mode = process.argv[2] || "full";

switch (mode) {
  case "tasks":
    loadConfig().then(config => {
      console.log("📋 Fetching Notion tasks...");
      return getNotionTasks(config);
    }).then(tasks => {
      console.log(`Found ${tasks.length} tasks:`);
      tasks.forEach(t => console.log(`  [${t.status}] ${t.title} → ${t.owner}`));
    });
    break;
  case "full":
  default:
    fullSync().catch(console.error);
}

export {
  syncTaskToNotion,
  syncFactToNotion,
  syncAgentState,
  createDailyBriefing,
  logBoardMeeting,
  getNotionTasks,
  loadConfig,
  type PAITask,
  type PAIFact,
  type NotionConfig,
};
