/**
 * PAI × Notion: Setup Script
 * Creates the Notion workspace structure for 13 AI agents
 *
 * Databases created:
 * 1. Agent Registry — 13 agents with bios, status, specialization
 * 2. Task Board — bidirectional sync with PAI task system
 * 3. Memory Log — facts, goals, insights from PAI memory
 * 4. Daily Briefings — auto-generated daily summaries
 * 5. Meeting Notes — Board of Directors sessions
 */

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const AGENTS = [
  { name: "👑 General", id: "general", role: "Orchestrator", model: "Claude Opus", desc: "Coordinates all agents. Has access to 190+ tools. The brain of PAI." },
  { name: "🔬 Research", id: "research", role: "Deep Analysis", model: "Claude Opus", desc: "Web research, trend analysis, competitive intelligence." },
  { name: "✍️ Content", id: "content", role: "Social Media", model: "Groq Llama", desc: "Posts, copywriting, content queue management." },
  { name: "💰 Finance", id: "finance", role: "Budget & ROI", model: "Groq Llama", desc: "Cost tracking, exchange rates, financial analysis." },
  { name: "🎯 Strategy", id: "strategy", role: "Business Strategy", model: "Claude Opus", desc: "Long-term planning, geopolitics, market positioning." },
  { name: "😈 Critic", id: "critic", role: "Devil's Advocate", model: "Claude Opus", desc: "Stress-tests plans, contrarian thinking, quality control." },
  { name: "🧠 Psycho", id: "psycho", role: "Psychoanalyst", model: "Claude Opus", desc: "Coaching, emotional analysis, behavioral patterns." },
  { name: "🎨 Artist", id: "artist", role: "Visual Director", model: "Claude Opus", desc: "Image generation, design, visual concepts." },
  { name: "✏️ Writer", id: "writer", role: "Literary Director", model: "Claude Opus", desc: "Essays, long-form content, 'Witness in the Gaps'." },
  { name: "🛡️ DevOps", id: "devops", role: "Infrastructure", model: "Groq Llama", desc: "Monitoring, deploys, PM2, Railway, health checks." },
  { name: "📈 Sales", id: "sales", role: "Growth", model: "Groq Llama", desc: "Marketing, monetization, user acquisition." },
  { name: "📊 Analytics", id: "analytics", role: "Data & Metrics", model: "Groq Llama", desc: "Reports, dashboards, social analytics." },
  { name: "🌍 Translator", id: "translator", role: "Localization", model: "Groq Llama", desc: "EN/PL/PT translation and localization." },
];

async function createAgentRegistry(parentPageId: string) {
  console.log("📋 Creating Agent Registry...");

  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ text: { content: "🤖 Agent Registry" } }],
    properties: {
      "Agent": { title: {} },
      "ID": { rich_text: {} },
      "Role": { rich_text: {} },
      "Status": {
        select: {
          options: [
            { name: "🟢 Active", color: "green" },
            { name: "🟡 Idle", color: "yellow" },
            { name: "🔴 Offline", color: "red" },
            { name: "🔵 Working", color: "blue" },
          ]
        }
      },
      "Model": {
        select: {
          options: [
            { name: "Claude Opus", color: "purple" },
            { name: "Groq Llama", color: "orange" },
          ]
        }
      },
      "Specialization": { rich_text: {} },
      "Tasks Completed": { number: {} },
      "Last Active": { date: {} },
      "Level": { number: {} },
    }
  });

  // Populate with 13 agents
  for (const agent of AGENTS) {
    await notion.pages.create({
      parent: { database_id: db.id },
      properties: {
        "Agent": { title: [{ text: { content: agent.name } }] },
        "ID": { rich_text: [{ text: { content: agent.id } }] },
        "Role": { rich_text: [{ text: { content: agent.role } }] },
        "Status": { select: { name: "🟢 Active" } },
        "Model": { select: { name: agent.model } },
        "Specialization": { rich_text: [{ text: { content: agent.desc } }] },
        "Tasks Completed": { number: 0 },
        "Level": { number: 1 },
      }
    });
    console.log(`  ✅ ${agent.name}`);
  }

  console.log(`✅ Agent Registry created: ${db.id}`);
  return db.id;
}

async function createTaskBoard(parentPageId: string) {
  console.log("📋 Creating Task Board...");

  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ text: { content: "📋 Task Board" } }],
    properties: {
      "Task": { title: {} },
      "Status": {
        select: {
          options: [
            { name: "⬜ Todo", color: "default" },
            { name: "🔄 In Progress", color: "blue" },
            { name: "✅ Done", color: "green" },
            { name: "🚫 Blocked", color: "red" },
          ]
        }
      },
      "Owner": {
        select: {
          options: AGENTS.map(a => ({ name: a.id, color: "default" as const }))
        }
      },
      "Priority": {
        select: {
          options: [
            { name: "🔴 Critical", color: "red" },
            { name: "🟡 High", color: "yellow" },
            { name: "🟢 Medium", color: "green" },
            { name: "⚪ Low", color: "default" },
          ]
        }
      },
      "Project": {
        select: {
          options: [
            { name: "PAI", color: "purple" },
            { name: "ALLMA", color: "blue" },
            { name: "OpenBets", color: "orange" },
            { name: "StudioAI", color: "green" },
            { name: "SpeakMate", color: "yellow" },
            { name: "THEATRON", color: "red" },
          ]
        }
      },
      "Deadline": { date: {} },
      "Notes": { rich_text: {} },
      "PAI Task ID": { rich_text: {} },
    }
  });

  console.log(`✅ Task Board created: ${db.id}`);
  return db.id;
}

async function createMemoryLog(parentPageId: string) {
  console.log("📋 Creating Memory Log...");

  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ text: { content: "🧠 Memory Log" } }],
    properties: {
      "Fact": { title: {} },
      "Category": {
        select: {
          options: [
            { name: "📝 Fact", color: "blue" },
            { name: "🎯 Goal", color: "green" },
            { name: "💡 Insight", color: "yellow" },
            { name: "⚠️ Standing Order", color: "red" },
            { name: "👤 Contact", color: "purple" },
          ]
        }
      },
      "Source Agent": {
        select: {
          options: AGENTS.map(a => ({ name: a.id, color: "default" as const }))
        }
      },
      "Created": { date: {} },
      "Relevance": { number: {} },
    }
  });

  console.log(`✅ Memory Log created: ${db.id}`);
  return db.id;
}

async function createDailyBriefings(parentPageId: string) {
  console.log("📋 Creating Daily Briefings...");

  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ text: { content: "📰 Daily Briefings" } }],
    properties: {
      "Date": { title: {} },
      "Summary": { rich_text: {} },
      "Highlights": { rich_text: {} },
      "Blockers": { rich_text: {} },
      "Agent Activity": { rich_text: {} },
      "Mood": {
        select: {
          options: [
            { name: "🟢 Productive", color: "green" },
            { name: "🟡 Mixed", color: "yellow" },
            { name: "🔴 Blocked", color: "red" },
            { name: "🚀 Breakthrough", color: "purple" },
          ]
        }
      },
    }
  });

  console.log(`✅ Daily Briefings created: ${db.id}`);
  return db.id;
}

async function createMeetingNotes(parentPageId: string) {
  console.log("📋 Creating Meeting Notes...");

  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ text: { content: "🏛️ Board Meetings" } }],
    properties: {
      "Meeting": { title: {} },
      "Date": { date: {} },
      "Participants": { multi_select: {
        options: AGENTS.map(a => ({ name: a.id, color: "default" as const }))
      }},
      "Topic": { rich_text: {} },
      "Decisions": { rich_text: {} },
      "Action Items": { rich_text: {} },
      "Consensus": {
        select: {
          options: [
            { name: "✅ Unanimous", color: "green" },
            { name: "🟡 Majority", color: "yellow" },
            { name: "🔴 Split", color: "red" },
            { name: "🔵 Deferred", color: "blue" },
          ]
        }
      },
    }
  });

  console.log(`✅ Meeting Notes created: ${db.id}`);
  return db.id;
}

async function main() {
  const parentPageId = process.env.NOTION_PAGE_ID;

  if (!parentPageId) {
    console.error("❌ Set NOTION_PAGE_ID environment variable (the page where databases will be created)");
    process.exit(1);
  }

  console.log("\n🚀 PAI × Notion Setup\n");
  console.log("Creating workspace for 13 AI agents...\n");

  const agentRegistryId = await createAgentRegistry(parentPageId);
  const taskBoardId = await createTaskBoard(parentPageId);
  const memoryLogId = await createMemoryLog(parentPageId);
  const dailyBriefingsId = await createDailyBriefings(parentPageId);
  const meetingNotesId = await createMeetingNotes(parentPageId);

  // Save database IDs to config
  const config = {
    agentRegistry: agentRegistryId,
    taskBoard: taskBoardId,
    memoryLog: memoryLogId,
    dailyBriefings: dailyBriefingsId,
    meetingNotes: meetingNotesId,
    createdAt: new Date().toISOString(),
  };

  await Bun.write("notion-config.json", JSON.stringify(config, null, 2));

  console.log("\n✅ Setup complete! Database IDs saved to notion-config.json");
  console.log("\n📊 Created:");
  console.log(`  🤖 Agent Registry: ${agentRegistryId} (${AGENTS.length} agents)`);
  console.log(`  📋 Task Board: ${taskBoardId}`);
  console.log(`  🧠 Memory Log: ${memoryLogId}`);
  console.log(`  📰 Daily Briefings: ${dailyBriefingsId}`);
  console.log(`  🏛️ Board Meetings: ${meetingNotesId}`);
}

main().catch(console.error);
