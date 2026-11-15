import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import * as vidiq from "@/lib/vidiq";
import { generateTitles } from "@/lib/text";
import { extractError, assertEnv } from "@/lib/errors";
import type { GenerateTitlesRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const missing = assertEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]);
    if (missing) return NextResponse.json({ error: missing }, { status: 500 });

    const body: GenerateTitlesRequest = await req.json();
    const { seedIdea, projectId } = body;
    const db = getSupabaseAdmin();

    if (!seedIdea?.trim()) {
      return NextResponse.json({ error: "seedIdea is required" }, { status: 400 });
    }

    let pid = projectId;

    if (!pid) {
      const { data, error } = await db
        .from("video_projects")
        .insert({ seed_idea: seedIdea, status: "research" })
        .select("id")
        .single();
      if (error) throw error;
      pid = data.id;
    }

    const [keywordData, outliers] = await Promise.allSettled([
      vidiq.keywordResearch(seedIdea),
      vidiq.getOutliers({ niche: seedIdea, maxSubs: 200000, timeframe: "thisMonth" }),
    ]);

    const kd = keywordData.status === "fulfilled" ? keywordData.value : { keyword: seedIdea, searchVolume: 0, competition: "unknown", relatedKeywords: [] };
    const ol = outliers.status === "fulfilled" ? outliers.value : [];

    const rawTitles = await generateTitles(seedIdea, kd, ol);

    const scored = await Promise.all(
      rawTitles.map(async (t) => {
        try {
          const score = await vidiq.scoreTitle(t.title);
          return { ...t, ...score };
        } catch {
          return { ...t, score: null, searchVolume: null, competition: null };
        }
      })
    );

    const rows = scored.map((t) => ({
      project_id: pid,
      title: t.title,
      ctr_score: t.score ?? null,
      search_volume: t.searchVolume ?? null,
      competition: t.competition ?? null,
      raw_data: { reasoning: t.reasoning },
    }));

    const { data: inserted, error: insertErr } = await db
      .from("title_suggestions")
      .insert(rows)
      .select();
    if (insertErr) throw insertErr;

    await db
      .from("video_projects")
      .update({ status: "titles_generated" })
      .eq("id", pid);

    return NextResponse.json({ projectId: pid, titles: inserted });
  } catch (err) {
    console.error("[generate-titles]", err);
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}
