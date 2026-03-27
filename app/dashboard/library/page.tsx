import { redirect } from "next/navigation";
import { VideoLibraryList } from "@/components/video-library-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: videos, error } = await supabase
    .from("videos")
    .select(
      `
        id,
        status,
        video_url,
        created_at,
        projects!inner(name)
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const admin = createAdminClient();
  const initialVideos = await Promise.all(
    (videos ?? []).map(async (video) => {
      const project = Array.isArray(video.projects) ? video.projects[0] : video.projects;
      let signedUrl: string | null = null;

      if (video.status === "completed" && video.video_url) {
        const { data } = await admin.storage.from("videos").createSignedUrl(video.video_url, 3600);
        signedUrl = data?.signedUrl ?? null;
      }

      return {
        id: video.id,
        status: video.status,
        createdAt: video.created_at,
        projectName: project?.name ?? "Untitled Project",
        videoUrl: signedUrl
      };
    })
  );

  return <VideoLibraryList initialVideos={initialVideos} />;
}
