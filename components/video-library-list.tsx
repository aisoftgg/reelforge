"use client";

import { useState } from "react";

type LibraryVideo = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  projectName: string;
  videoUrl: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function statusClasses(status: LibraryVideo["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-100";
    case "processing":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

export function VideoLibraryList({ initialVideos }: { initialVideos: LibraryVideo[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(videoId: string) {
    setDeletingId(videoId);
    setError(null);

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete video.");
      }

      setVideos((current) => current.filter((video) => video.id !== videoId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!videos.length) {
    return (
      <main className="p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Library</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Rendered videos
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              No exports yet. Generate a video from the new-video flow and it will show up here.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Library</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Rendered videos</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Track completed exports, review in-browser previews, and download or delete old renders.
          </p>
        </section>

        {error ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {error}
          </section>
        ) : null}

        <section className="grid gap-4">
          {videos.map((video) => (
            <article
              key={video.id}
              className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-white">{video.projectName}</h2>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusClasses(video.status)}`}
                    >
                      {video.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">Created {formatDate(video.createdAt)}</p>
                  <p className="break-all text-xs text-zinc-600">{video.id}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {video.videoUrl ? (
                    <>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-600 hover:text-white"
                      >
                        View
                      </a>
                      <a
                        href={video.videoUrl}
                        download
                        className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
                      >
                        Download
                      </a>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(video.id)}
                    disabled={deletingId === video.id}
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === video.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {video.videoUrl ? (
                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-black">
                  <video src={video.videoUrl} controls className="aspect-[9/16] w-full max-w-sm" />
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-5 text-sm text-zinc-500">
                  {video.status === "processing"
                    ? "This render is still processing."
                    : video.status === "failed"
                      ? "This render failed. Try generating it again from the wizard."
                      : "Video file is not available yet."}
                </div>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
