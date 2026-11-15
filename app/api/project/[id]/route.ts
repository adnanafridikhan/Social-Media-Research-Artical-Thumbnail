import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { extractError } from "@/lib/errors";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("video_projects")
      .select(`*, title_suggestions(*), video_packages(*), thumbnails(*)`)
      .eq("id", params.id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getSupabaseAdmin();
    const body = await req.json();
    const { data, error } = await db
      .from("video_projects")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from("video_projects").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: extractError(err) }, { status: 500 });
  }
}
