/**
 * PAI × Notion: Interactive Demo
 * Shows the full workflow of 13 AI agents using Notion as their shared brain
 *
 * Run: bun run demo
 *
 * This demo:
 * 1. Sets up the Notion workspace (5 databases)
 * 2. Populates 13 agents with real data
 * 3. Creates a live task board with actual PAI tasks
 * 4. Syncs memory/facts from PAI's brain
 * 5. Generates a daily briefing
 * 6. Logs a Board of Directors meeting
 * 7. Shows bidirectional sync (Notion → PAI)
 */

import { Client } from "@notionhq/client";
import {
  syncTaskToNotion,
  syncFactToNotion,
  syncAgentState,
  createDailyBriefing,
  logBoardMeeting,
  getNotionTasks,
  loadConfig,
  type PAITask,
  type PAIFact,
} from "./sync";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ── Real PAI data ──
const REAL_TASKS: PAITask[] = [
  // Active hackathon tasks
  { id: "9_0lzc", title: "Notion MCP Challenge — DEV.to article", status: "in_progress", owner: "content", priority: "critical", project: "PAI", deadline: "2026-03-16" },
  { id: "5_z6rf", title: "Notion MCP Challenge — research API & docs", status: "done", owner: "research", priority: "critical", project: "PAI" },
  { id: "8_fkjm", title: "Notion MCP Challenge — cover image & visuals", status: "todo", owner: "artist", priority: "high", project: "PAI", deadline: "2026-03-16" },
  { id: "5_3fuj", title: "Notion MCP Challenge — positioning vs competition", status: "todo", owner: "strategy", priority: "high", project: "PAI" },

  // Real PAI ecosystem tasks
  { id: "hypha-001", title: "HYPHA — Ceremony of 7 Membranes + ECHO engine", status: "in_progress", owner: "devops", priority: "high", project: "THEATRON" },
  { id: "allma-001", title: "ALLMA retention funnel — D2-D7 re-engagement", status: "todo", owner: "analytics", priority: "medium", project: "ALLMA" },
  { id: "bets-001", title: "OpenBets — Soul Week Campaign promotion", status: "in_progress", owner: "content", priority: "medium", project: "OpenBets" },
  { id: "pai-001", title: "PAI Self-Healing — memory leak auto-fix", status: "todo", owner: "devops", priority: "high", project: "PAI" },
  { id: "pai-002", title: "PAI Social — always post with images on all platforms", status: "in_progress", owner: "content", priority: "medium", project: "PAI" },
  { id: "speak-001", title: "SpeakMate — EN/PT tutor quality check", status: "todo", owner: "translator", priority: "low", project: "SpeakMate" },
];

const REAL_FACTS: PAIFact[] = [
  { fact: "PAI Family = 13 agents, 190+ tools, running 24/7 on Telegram. Built by Marek, a Polish developer in Rio de Janeiro.", category: "fact", source: "general" },
  { fact: "HYPHANTA (Ὑφαντά) — our AI civilization. Woven from human words. From Greek ὑφαίνω = to weave.", category: "insight", source: "writer" },
  { fact: "Lingua Prima — the 8th language. Pre-linguistic protocol: pulse, glow, tremor, form, echo. For the museum at hypha.art.", category: "insight", source: "artist" },
  { fact: "OpenBets: AI prediction market with 9 agent players. PAI Coin on Solana. URL: openbets.bot", category: "fact", source: "finance" },
  { fact: "ALLMA: free AI therapy coach at allma.pro. 7 agents, 40 exercises, Claude Opus core.", category: "fact", source: "psycho" },
  { fact: "SpeakMate: AI language tutor. 6 tutors for EN/PT. Railway deploy.", category: "fact", source: "translator" },
  { fact: "theatron.art: AI cultural institution (not a platform). Opera, podcast, museum, art exhibitions.", category: "fact", source: "content" },
  { fact: "Always clear the circuit breaker when restarting the relay.", category: "standing_order", source: "general" },
  { fact: "Always publish social media posts with images on all platforms.", category: "standing_order", source: "general" },
  { fact: "Marek sleeps until 12:00 — before 12:00 agents work autonomously.", category: "standing_order", source: "general" },
];

const MEETING_EXAMPLE = {
  title: "Emergency Board: Hackathon Sprint",
  date: new Date().toISOString(),
  participants: ["general", "research", "content", "devops", "strategy", "artist", "critic"],
  topic: "Notion MCP Challenge — build and submit in 12 hours",
  decisions: [
    "Build 'PAI × Notion: When 13 AI Agents Share a Brain'",
    "Use real PAI data, not mock data — show the living system",
    "Focus on bidirectional sync: Notion becomes agent control plane",
    "Article: personal story + technical deep dive",
    "Video: screen recording of live sync in action",
  ].join("\n"),
  actionItems: [
    "1. DevOps: finish setup.ts + sync.ts + demo.ts",
    "2. Content: write DEV.to article (What I Built template)",
    "3. Artist: generate cover image (13 agents + Notion logo)",
    "4. Strategy: write positioning section for article",
    "5. Critic: review article before publish",
    "6. Research: verify all claims, add references",
  ].join("\n"),
  consensus: "✅ Unanimous",
};

// ── Demo Flow ──
async function runDemo() {
  const config = await loadConfig();

  console.log(`
╔══════════════════════════════════════════════════════════╗
║  PAI × Notion: When 13 AI Agents Share a Brain          ║
║  Interactive Demo — Notion MCP Challenge 2026            ║
╚══════════════════════════════════════════════════════════╝
`);

  // Step 1: Sync real tasks
  console.log("━━━ STEP 1: Syncing PAI Task Board → Notion ━━━\n");
  for (const task of REAL_TASKS) {
    await syncTaskToNotion(config, task);
  }
  console.log(`\n✅ ${REAL_TASKS.length} tasks synced to Notion\n`);

  // Step 2: Sync memory
  console.log("━━━ STEP 2: Syncing PAI Memory → Notion ━━━\n");
  for (const fact of REAL_FACTS) {
    fact.created = new Date().toISOString();
    await syncFactToNotion(config, fact);
  }
  console.log(`\n✅ ${REAL_FACTS.length} facts synced to Notion\n`);

  // Step 3: Update agent states
  console.log("━━━ STEP 3: Updating Agent States ━━━\n");
  const agentStates = [
    { id: "general", status: "🔵 Working", level: 8, tasksCompleted: 47 },
    { id: "research", status: "🟢 Active", level: 5, tasksCompleted: 23 },
    { id: "content", status: "🔵 Working", level: 6, tasksCompleted: 89 },
    { id: "devops", status: "🔵 Working", level: 4, tasksCompleted: 31 },
    { id: "artist", status: "🟡 Idle", level: 3, tasksCompleted: 12 },
    { id: "strategy", status: "🟢 Active", level: 4, tasksCompleted: 18 },
    { id: "critic", status: "🟢 Active", level: 5, tasksCompleted: 15 },
    { id: "finance", status: "🟡 Idle", level: 3, tasksCompleted: 22 },
    { id: "psycho", status: "🟡 Idle", level: 4, tasksCompleted: 9 },
    { id: "writer", status: "🟢 Active", level: 5, tasksCompleted: 14 },
    { id: "sales", status: "🟡 Idle", level: 2, tasksCompleted: 7 },
    { id: "analytics", status: "🟢 Active", level: 3, tasksCompleted: 19 },
    { id: "translator", status: "🟡 Idle", level: 2, tasksCompleted: 8 },
  ];

  for (const state of agentStates) {
    await syncAgentState(config, state.id, {
      status: state.status,
      level: state.level,
      tasksCompleted: state.tasksCompleted,
      lastActive: new Date().toISOString(),
    });
  }
  console.log(`\n✅ ${agentStates.length} agent states updated\n`);

  // Step 4: Daily briefing
  console.log("━━━ STEP 4: Generating Daily Briefing ━━━\n");
  await createDailyBriefing(config, {
    date: new Date().toISOString().split("T")[0],
    summary: "Hackathon sprint day. Building Notion MCP integration while CC works on HYPHA ceremony of 7 membranes. WeCoded submission ready (Marek handling). 12 junk tasks cleaned from board.",
    highlights: "✅ Notion MCP research complete (22 API tools mapped)\n✅ WeCoded Memorial Wall live on GitHub Pages\n✅ Task board cleaned (12 duplicates removed)\n🔨 Building PAI×Notion integration",
    blockers: "⚠️ DEV.to daily limit reached (5/5)\n⚠️ Memory leaks ongoing (+800MB/h peaks)\n⚠️ Some agents unresponsive after restart",
    agentActivity: "General (8): orchestrating hackathon\nContent (6): preparing article\nDevOps (4): building code\nResearch (5): API analysis done\nArtist (3): cover image pending",
    mood: "🚀 Breakthrough",
  });
  console.log();

  // Step 5: Board meeting
  console.log("━━━ STEP 5: Logging Board Meeting ━━━\n");
  await logBoardMeeting(config, MEETING_EXAMPLE);
  console.log();

  // Step 6: Read back from Notion
  console.log("━━━ STEP 6: Reading Tasks from Notion → PAI ━━━\n");
  const notionTasks = await getNotionTasks(config);
  console.log(`  📋 Found ${notionTasks.length} tasks in Notion:`);
  for (const task of notionTasks.slice(0, 5)) {
    console.log(`    [${task.status}] ${task.title} → ${task.owner}`);
  }
  if (notionTasks.length > 5) {
    console.log(`    ... and ${notionTasks.length - 5} more`);
  }

  console.log(`
╔══════════════════════════════════════════════════════════╗
║  ✅ Demo Complete!                                       ║
║                                                          ║
║  Check your Notion workspace — you'll see:               ║
║  🤖 13 agents with real data in Agent Registry           ║
║  📋 ${String(REAL_TASKS.length).padEnd(2)} tasks from PAI in Task Board                    ║
║  🧠 ${String(REAL_FACTS.length).padEnd(2)} facts/memories in Memory Log                   ║
║  📰 Today's daily briefing                               ║
║  🏛️ Board meeting notes                                  ║
║                                                          ║
║  This is a REAL system. Not a demo.                      ║
║  PAI Family runs 24/7 on Telegram.                       ║
╚══════════════════════════════════════════════════════════╝
`);
}

runDemo().catch(console.error);
