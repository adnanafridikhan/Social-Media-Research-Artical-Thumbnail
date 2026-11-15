// Standalone smoke test: run with `node scripts/test-vidiq.mjs`
// Loads .env.local manually so we don't need next.js running.

import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const env = readFileSync(".env.local", "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.vidiq.com/mcp"), {
  requestInit: { headers: { Authorization: `Bearer ${process.env.VIDIQ_API_KEY}` } },
});

const client = new Client({ name: "smoke-test", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);
console.log("✅ Connected to vidIQ MCP");

const tools = await client.listTools();
console.log(`✅ ${tools.tools.length} tools available`);

const kw = await client.callTool({
  name: "vidiq_keyword_research",
  arguments: { keyword: "no code ai applications", includeRelated: true },
});
const parsed = JSON.parse(kw.content[0].text);
console.log("✅ keyword_research seed:", parsed.seedKeyword);
console.log("   top related:", parsed.relatedKeywords.slice(0, 3).map((k) => k.keyword));

const ts = await client.callTool({
  name: "vidiq_score_title",
  arguments: { title: "I Built an AI App in 24 Hours (No Code)", type: "long" },
});
console.log("✅ score_title:", JSON.parse(ts.content[0].text));

await client.close();
console.log("✅ All good.");
