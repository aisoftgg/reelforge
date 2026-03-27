import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: video, error } = await supabase
      .from("videos")
      .select("id, video_url")
      .eq("id", videoId)
      .single();

    if (error || !video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    const admin = createAdminClient();

    if (video.video_url) {
      await admin.storage.from("videos").remove([video.video_url]);
    }

    const { error: deleteError } = await admin.from("videos").delete().eq("id", videoId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected delete error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
