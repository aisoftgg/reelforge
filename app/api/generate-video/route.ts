import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { buildKeywordSections, downloadClipToTmp, searchPexelsVideos } from "@/lib/pexels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { assembleVideo, getVideoDuration } from "@/lib/video-assembler";
import { buildVideoSections, calculateSectionDurations } from "@/lib/video-script";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateVideoRequest = {
  projectId?: string;
  scriptId?: string;
  selectedHook?: number;
  voice?: string;
  hookText?: string;
  problem?: string;
  solution?: string;
  proof?: string;
  cta?: string;
};

async function ensureVideoBucket() {
  const admin = createAdminClient();
  const { error } = await admin.storage.createBucket("videos", {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: ["video/mp4"]
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }
}

async function updateVideoFailure(videoId: string, message: string) {
  const admin = createAdminClient();
  await admin
    .from("videos")
    .update({ status: "failed" })
    .eq("id", videoId);

  console.error(`Video generation failed for ${videoId}: ${message}`);
}

async function runGenerationPipeline(params: {
  userId: string;
  videoId: string;
  script: {
    id: string;
    project_id: string;
    hook_variations: unknown;
    body_text: string | null;
    cta_text: string | null;
  };
  selectedHook: number;
}) {
  const tempPaths: string[] = [];

  try {
    await ensureVideoBucket();

    const sections = buildKeywordSections(
      calculateSectionDurations(
        buildVideoSections(params.script, params.selectedHook)
      )
    );

    const clips = [];

    for (const section of sections) {
      const candidates = await searchPexelsVideos(section.keywords);
      let selectedClipPath: string | null = null;

      for (const candidate of candidates) {
        const clipPath = await downloadClipToTmp(candidate.file.link, `${params.videoId}-${section.label}`);
        tempPaths.push(clipPath);

        try {
          const sourceDuration = await getVideoDuration(clipPath);

          if (sourceDuration >= section.duration) {
            selectedClipPath = clipPath;
            break;
          }
        } catch {
          selectedClipPath = clipPath;
          break;
        }
      }

      if (!selectedClipPath) {
        throw new Error(`No usable clips found for section "${section.label}".`);
      }

      clips.push({
        clipPath: selectedClipPath,
        text: section.text,
        duration: section.duration
      });
    }

    const outputPath = await assembleVideo({
      clips,
      outputPath: `/tmp/${params.videoId}-${randomUUID()}.mp4`
    });

    tempPaths.push(outputPath);

    const videoBuffer = await readFile(outputPath);
    const storagePath = `${params.userId}/${params.videoId}.mp4`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from("videos").upload(storagePath, videoBuffer, {
      contentType: "video/mp4",
      upsert: true
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: updateError } = await admin
      .from("videos")
      .update({
        status: "completed",
        video_url: storagePath
      })
      .eq("id", params.videoId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    await updateVideoFailure(
      params.videoId,
      error instanceof Error ? error.message : "Unknown video generation error."
    );
  } finally {
    await Promise.all(tempPaths.map((path) => unlink(path).catch(() => undefined)));
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateVideoRequest;
    const projectId = body.projectId?.trim();
    const scriptId = body.scriptId?.trim();
    const selectedHook = Number.isInteger(body.selectedHook) ? Number(body.selectedHook) : 0;
    const voice = body.voice?.trim() ?? null;
    const hookText = body.hookText?.trim();
    const problem = body.problem?.trim();
    const solution = body.solution?.trim();
    const proof = body.proof?.trim();
    const cta = body.cta?.trim();

    if (!projectId || !scriptId) {
      return NextResponse.json({ error: "Project ID and script ID are required." }, { status: 400 });
    }

    const { data: script, error: scriptError } = await supabase
      .from("scripts")
      .select(
        `
          id,
          project_id,
          hook_variations,
          body_text,
          cta_text,
          projects!inner(id, user_id, name)
        `
      )
      .eq("id", scriptId)
      .eq("project_id", projectId)
      .single();

    if (scriptError || !script) {
      return NextResponse.json({ error: "Script not found." }, { status: 404 });
    }

    const project = Array.isArray(script.projects) ? script.projects[0] : script.projects;

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nextHooks = Array.isArray(script.hook_variations) ? [...script.hook_variations] : [];

    if (hookText) {
      nextHooks[selectedHook] = hookText;
    }

    const renderScript = {
      ...script,
      hook_variations: nextHooks,
      body_text: [`Problem: ${problem ?? ""}`, `Solution: ${solution ?? ""}`, `Proof: ${proof ?? ""}`].join(
        "\n\n"
      ),
      cta_text: cta ?? script.cta_text
    };

    const sections = buildVideoSections(renderScript, selectedHook);

    if (!sections.length) {
      return NextResponse.json({ error: "Script is missing renderable sections." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: video, error: videoError } = await admin
      .from("videos")
      .insert({
        project_id: projectId,
        script_id: scriptId,
        status: "processing"
      })
      .select("id")
      .single();

    if (videoError || !video) {
      throw new Error(videoError?.message ?? "Failed to create video record.");
    }

    const { error: scriptUpdateError } = await admin
      .from("scripts")
      .update({
        selected_hook: selectedHook,
        voice_id: voice,
        hook_variations: nextHooks,
        body_text: renderScript.body_text,
        cta_text: renderScript.cta_text
      })
      .eq("id", scriptId);

    if (scriptUpdateError) {
      throw new Error(scriptUpdateError.message);
    }

    void runGenerationPipeline({
      userId: user.id,
      videoId: video.id,
      script: renderScript,
      selectedHook
    });

    return NextResponse.json({ videoId: video.id, status: "processing" }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected video generation error.";
    const status =
      message.includes("Unauthorized") ? 401 : message.includes("configured") ? 501 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
