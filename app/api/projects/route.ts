import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { extractError } from "@/lib/errors";

export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("video_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}
