import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import * as vidiq from "@/lib/vidiq";
import { generateThumbnailImages } from "@/lib/openai";
import { extractError, assertEnv } from "@/lib/errors";
import type { GenerateThumbnailRequest } from "@/types";

const BUCKET = "thumbnails";

async function ensureBucket(db: ReturnType<typeof getSupabaseAdmin>) {
  const { data } = await db.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });
  if (error && !/already exists/i.test(error.message)) throw error;
}

export async function POST(req: NextRequest) {
  try {
    const missing = assertEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]);
    if (missing) return NextResponse.json({ error: missing }, { status: 500 });

    const body: GenerateThumbnailRequest = await req.json();
    const { projectId, engine, brief, variations } = body;
    const db = getSupabaseAdmin();

    if (!projectId || !brief || !engine) {
      return NextResponse.json({ error: "projectId, engine, and brief are required" }, { status: 400 });
    }

    await ensureBucket(db);

    let imageUrls: string[] = [];

    if (engine === "openai") {
      imageUrls = await generateThumbnailImages(brief, variations ?? 1);
    } else {
      throw new Error("VidIQ image generation not yet integrated");
    }

    const uploadedUrls = await Promise.all(
      imageUrls.map(async (url, i) => {
        if (url.startsWith("data:")) {
          const base64 = url.split(",")[1];
          const buffer = Buffer.from(base64, "base64");
          const path = `${projectId}/${Date.now()}-${i}.png`;
          const { error } = await db.storage
            .from(BUCKET)
            .upload(path, buffer, { contentType: "image/png", upsert: true });
          if (error) throw error;
          const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(path);
          return publicUrl;
        }
        return url;
      })
    );

    const scored = await Promise.all(
      uploadedUrls.map(async (imageUrl) => {
        try {
          const score = await vidiq.scoreThumbnail(imageUrl);
          return { imageUrl, ctr_score: score.score };
        } catch {
          return { imageUrl, ctr_score: null };
        }
      })
    );

    const rows = scored.map((t) => ({
      project_id: projectId,
      image_url: t.imageUrl,
      engine,
      prompt_used: brief,
      ctr_score: t.ctr_score,
    }));

    const { data: inserted, error: insertErr } = await db
      .from("thumbnails")
      .insert(rows)
      .select();
    if (insertErr) throw insertErr;

    await db.from("video_projects").update({ status: "thumbnail_ready" }).eq("id", projectId);

    return NextResponse.json({ thumbnails: inserted });
  } catch (err) {
    console.error("[thumbnail/generate]", err);
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}
