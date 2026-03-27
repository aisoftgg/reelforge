import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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
      .select("id, status, video_url")
      .eq("id", videoId)
      .single();

    if (error || !video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    let signedUrl: string | null = null;

    if (video.status === "completed" && video.video_url) {
      const admin = createAdminClient();
      const { data: signed, error: signedError } = await admin.storage
        .from("videos")
        .createSignedUrl(video.video_url, 60 * 60);

      if (signedError) {
        throw new Error(signedError.message);
      }

      signedUrl = signed.signedUrl;
    }

    return NextResponse.json({
      status: video.status,
      videoUrl: signedUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected status lookup error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
