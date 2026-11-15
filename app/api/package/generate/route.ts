import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import * as vidiq from "@/lib/vidiq";
import { generateDescription, generateTags, generateThumbnailBrief } from "@/lib/text";
import { extractError, assertEnv } from "@/lib/errors";
import type { GeneratePackageRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const missing = assertEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]);
    if (missing) return NextResponse.json({ error: missing }, { status: 500 });

    const body: GeneratePackageRequest = await req.json();
    const { projectId, titleId } = body;
    const db = getSupabaseAdmin();

    if (!projectId || !titleId) {
      return NextResponse.json({ error: "projectId and titleId are required" }, { status: 400 });
    }

    await db.from("title_suggestions").update({ selected: false }).eq("project_id", projectId);
    await db.from("title_suggestions").update({ selected: true }).eq("id", titleId);

    const { data: titleRow, error: titleErr } = await db
      .from("title_suggestions")
      .select("title")
      .eq("id", titleId)
      .single();
    if (titleErr) throw titleErr;

    const title = titleRow.title;

    await db.from("video_projects").update({ current_title: title }).eq("id", projectId);

    let keywords: string[] = [];
    try {
      const kd = await vidiq.keywordResearch(title);
      keywords = [kd.keyword, ...(kd.relatedKeywords ?? [])].slice(0, 10);
    } catch {
      keywords = title.split(" ").filter((w: string) => w.length > 3);
    }

    const [description, tags, thumbnailBrief] = await Promise.all([
      generateDescription(title, keywords),
      generateTags(title, keywords),
      generateThumbnailBrief(title, keywords),
    ]);

    const { data: pkg, error: pkgErr } = await db
      .from("video_packages")
      .insert({ project_id: projectId, description, tags, thumbnail_brief: thumbnailBrief })
      .select()
      .single();
    if (pkgErr) throw pkgErr;

    await db.from("video_projects").update({ status: "package_ready" }).eq("id", projectId);

    return NextResponse.json({ description: pkg.description, tags: pkg.tags, thumbnailBrief: pkg.thumbnail_brief });
  } catch (err) {
    console.error("[package/generate]", err);
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}
