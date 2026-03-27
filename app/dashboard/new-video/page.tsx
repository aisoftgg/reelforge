"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  TARGET_AUDIENCES,
  type GeneratedScript,
  type ProductInfo,
  type TargetAudience
} from "@/lib/script-engine";

const steps = [
  { id: 1, label: "Input" },
  { id: 2, label: "Script" },
  { id: 3, label: "Voice" },
  { id: 4, label: "Generate" }
] as const;

const voiceOptions = [
  {
    id: "atlas",
    name: "Atlas",
    tone: "Confident male",
    detail: "Clean startup-demo delivery with steady pacing."
  },
  {
    id: "nova",
    name: "Nova",
    tone: "Polished female",
    detail: "Bright promo voice for consumer and creator offers."
  },
  {
    id: "rally",
    name: "Rally",
    tone: "Energetic neutral",
    detail: "Fast, punchy rhythm for hooks and CTA lines."
  },
  {
    id: "sage",
    name: "Sage",
    tone: "Calm explainer",
    detail: "Softer tone for educational and trust-led videos."
  }
];

type ApiResponse = {
  projectId: string;
  scriptId: string;
  productInfo: ProductInfo | null;
  script: GeneratedScript;
};

type GenerateVideoResponse = {
  videoId?: string;
  status?: "processing" | "completed" | "failed";
  error?: string;
};

type VideoStatusResponse = {
  status?: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string | null;
  error?: string;
};

function StepBadge({
  step,
  currentStep
}: {
  step: (typeof steps)[number];
  currentStep: number;
}) {
  const isActive = currentStep === step.id;
  const isComplete = currentStep > step.id;

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition",
          isActive && "border-blue-500 bg-blue-500 text-white",
          isComplete && "border-blue-500/50 bg-blue-500/15 text-blue-200",
          !isActive && !isComplete && "border-zinc-800 bg-zinc-900 text-zinc-500"
        )}
      >
        {step.id}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{step.label}</p>
        <p className="text-xs text-zinc-500">
          {isComplete ? "Ready" : isActive ? "Current step" : "Upcoming"}
        </p>
      </div>
    </div>
  );
}

export default function NewVideoPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [productUrl, setProductUrl] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("SaaS founders");
  const [selectedHook, setSelectedHook] = useState(0);
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [proof, setProof] = useState("");
  const [cta, setCta] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(voiceOptions[0].id);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [hooks, setHooks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStage, setRenderStage] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  async function generateScript() {
    setIsGenerating(true);
    setError(null);
    setRenderStage(null);
    setActiveVideoId(null);
    setGeneratedVideoUrl(null);

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productUrl: productUrl.trim() || undefined,
          productDescription: productDescription.trim() || undefined,
          targetAudience
        })
      });

      const payload = (await response.json()) as ApiResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to generate script.");
      }

      setProjectId(payload.projectId);
      setScriptId(payload.scriptId);
      setProductInfo(payload.productInfo);
      setHooks(payload.script.hooks);
      setSelectedHook(0);
      setProblem(payload.script.problem);
      setSolution(payload.script.solution);
      setProof(payload.script.proof);
      setCta(payload.script.cta);
      setCurrentStep(2);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Script generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    if (!activeVideoId || !isRendering) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/video-status/${activeVideoId}`, {
          cache: "no-store"
        });
        const payload = (await response.json()) as VideoStatusResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to fetch video status.");
        }

        if (payload.status === "completed") {
          setGeneratedVideoUrl(payload.videoUrl ?? null);
          setRenderStage("Done!");
          setIsRendering(false);
          window.clearInterval(intervalId);
        }

        if (payload.status === "failed") {
          setError("Video generation failed. Please try again.");
          setRenderStage(null);
          setIsRendering(false);
          window.clearInterval(intervalId);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Status polling failed.");
        setRenderStage(null);
        setIsRendering(false);
        window.clearInterval(intervalId);
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [activeVideoId, isRendering]);

  async function generateVideo() {
    if (!projectId || !scriptId || !hooks.length) {
      setError("Generate a script first.");
      return;
    }

    setError(null);
    setGeneratedVideoUrl(null);
    setRenderStage("Searching for footage...");
    setIsRendering(true);

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          scriptId,
          selectedHook,
          voice: selectedVoice,
          hookText: hooks[selectedHook],
          problem,
          solution,
          proof,
          cta
        })
      });

      const payload = (await response.json()) as GenerateVideoResponse;

      if (!response.ok || !payload.videoId) {
        throw new Error(payload.error ?? "Failed to start video generation.");
      }

      setActiveVideoId(payload.videoId);
      setRenderStage("Assembling video...");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Video generation failed.");
      setRenderStage(null);
      setIsRendering(false);
    }
  }

  return (
    <main className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Phase 3</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Script Engine
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-zinc-400">
                Feed ReelForge a landing page or a manual product summary, generate five hook
                options, tighten the body copy, then hand the script off to voice selection.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {steps.map((step) => (
                <StepBadge key={step.id} step={step} currentStep={currentStep} />
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {error}
          </section>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Step 1</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Product Intake</h2>
                </div>
                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
                  URL or manual brief
                </span>
              </div>

              <div className="mt-6 space-y-6">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <label className="text-sm font-medium text-white" htmlFor="product-url">
                    Product URL
                  </label>
                  <div className="mt-3 flex flex-col gap-3 md:flex-row">
                    <input
                      id="product-url"
                      type="url"
                      value={productUrl}
                      onChange={(event) => setProductUrl(event.target.value)}
                      placeholder="https://yourproduct.com"
                      className="min-h-12 flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={generateScript}
                      disabled={isGenerating || !productUrl.trim()}
                      className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/40"
                    >
                      {isGenerating ? "Analyzing..." : "Analyze"}
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-zinc-500">
                    ReelForge pulls title, positioning, features, pricing, and audience clues from
                    the landing page before writing the script.
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
                  <label className="text-sm font-medium text-white" htmlFor="product-description">
                    Manual product description
                  </label>
                  <textarea
                    id="product-description"
                    value={productDescription}
                    onChange={(event) => setProductDescription(event.target.value)}
                    placeholder="Describe the product, who it is for, and the core outcome."
                    className="mt-3 min-h-36 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <label className="text-sm font-medium text-white" htmlFor="target-audience">
                      Target audience
                    </label>
                    <select
                      id="target-audience"
                      value={targetAudience}
                      onChange={(event) =>
                        setTargetAudience(event.target.value as TargetAudience)
                      }
                      className="mt-3 min-h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-white outline-none transition focus:border-blue-500"
                    >
                      {TARGET_AUDIENCES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={generateScript}
                    disabled={isGenerating || (!productUrl.trim() && !productDescription.trim())}
                    className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-5 py-3 text-sm font-medium text-blue-100 transition hover:border-blue-400 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-500"
                  >
                    {isGenerating ? "Generating..." : "Generate Script"}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Step 2</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Script Review</h2>
                </div>
                <button
                  type="button"
                  onClick={generateScript}
                  disabled={isGenerating || (!productUrl.trim() && !productDescription.trim())}
                  className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Regenerate
                </button>
              </div>

              {hooks.length ? (
                <div className="mt-6 space-y-6">
                  <div>
                    <p className="text-sm font-medium text-white">Choose your hook</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {hooks.map((hook, index) => (
                        <button
                          key={hook}
                          type="button"
                          onClick={() => setSelectedHook(index)}
                          className={cn(
                            "rounded-3xl border p-4 text-left transition",
                            selectedHook === index
                              ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-950/40"
                              : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                          )}
                        >
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                            Hook {index + 1}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-zinc-100">{hook}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
                      <label className="text-sm font-medium text-white" htmlFor="problem">
                        Problem
                      </label>
                      <textarea
                        id="problem"
                        value={problem}
                        onChange={(event) => setProblem(event.target.value)}
                        className="mt-3 min-h-28 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
                      <label className="text-sm font-medium text-white" htmlFor="solution">
                        Solution
                      </label>
                      <textarea
                        id="solution"
                        value={solution}
                        onChange={(event) => setSolution(event.target.value)}
                        className="mt-3 min-h-28 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
                      <label className="text-sm font-medium text-white" htmlFor="proof">
                        Proof
                      </label>
                      <textarea
                        id="proof"
                        value={proof}
                        onChange={(event) => setProof(event.target.value)}
                        className="mt-3 min-h-28 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5">
                      <label className="text-sm font-medium text-white" htmlFor="cta">
                        CTA
                      </label>
                      <textarea
                        id="cta"
                        value={cta}
                        onChange={(event) => setCta(event.target.value)}
                        className="mt-3 min-h-28 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400"
                    >
                      Continue to Voice
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-sm text-zinc-500">
                  Generate a script first. The hook selector and editable sections will appear
                  here.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Step 3</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Voice Selection</h2>
                </div>
                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
                  Stored for render settings
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {voiceOptions.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setCurrentStep(4);
                    }}
                    className={cn(
                      "rounded-3xl border p-5 text-left transition",
                      selectedVoice === voice.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    )}
                  >
                    <p className="text-lg font-semibold text-white">{voice.name}</p>
                    <p className="mt-1 text-sm text-blue-200">{voice.tone}</p>
                    <p className="mt-4 text-sm leading-6 text-zinc-400">{voice.detail}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Step 4</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Generate Video</h2>
                </div>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                  Stock footage + captions
                </span>
              </div>

              <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
                <p className="text-sm leading-7 text-zinc-400">
                  ReelForge will match each script section to vertical stock footage, then assemble
                  a captioned MP4 export for the library.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={generateVideo}
                    disabled={isRendering || !projectId || !scriptId}
                    className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/40"
                  >
                    {isRendering ? "Generating..." : "Generate Video"}
                  </button>
                  {renderStage ? <p className="text-sm text-blue-200">{renderStage}</p> : null}
                </div>

                {generatedVideoUrl ? (
                  <div className="mt-6 space-y-4">
                    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-black">
                      <video
                        src={generatedVideoUrl}
                        controls
                        className="aspect-[9/16] w-full max-w-sm"
                      />
                    </div>
                    <a
                      href={generatedVideoUrl}
                      download
                      className="inline-flex rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:text-white"
                    >
                      Download MP4
                    </a>
                  </div>
                ) : null}

                {!generatedVideoUrl && activeVideoId ? (
                  <p className="mt-4 break-all text-xs text-zinc-500">Video ID: {activeVideoId}</p>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Brief Snapshot</p>
              <div className="mt-5 space-y-5 text-sm">
                <div>
                  <p className="text-zinc-500">Audience</p>
                  <p className="mt-1 text-white">{targetAudience}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Selected Hook</p>
                  <p className="mt-1 text-white">
                    {hooks[selectedHook] ?? "No hook selected yet"}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Voice</p>
                  <p className="mt-1 text-white">
                    {voiceOptions.find((voice) => voice.id === selectedVoice)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Project</p>
                  <p className="mt-1 break-all text-white">{projectId ?? "Not saved yet"}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Script</p>
                  <p className="mt-1 break-all text-white">{scriptId ?? "Not saved yet"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400">Page Analysis</p>
              {productInfo ? (
                <div className="mt-5 space-y-5 text-sm">
                  <div>
                    <p className="text-zinc-500">Title</p>
                    <p className="mt-1 text-white">{productInfo.title || "Untitled page"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Description</p>
                    <p className="mt-1 leading-6 text-zinc-300">
                      {productInfo.description || "No description extracted."}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Key Features</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {productInfo.keyFeatures.length ? (
                        productInfo.keyFeatures.map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300"
                          >
                            {feature}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">No features extracted.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-500">Pricing</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {productInfo.pricingInfo.length ? (
                        productInfo.pricingInfo.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-100"
                          >
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">No pricing cues found.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-500">Audience Signals</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {productInfo.targetAudienceSignals.length ? (
                        productInfo.targetAudienceSignals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300"
                          >
                            {signal}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500">No audience signals extracted.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/70 p-6 text-sm text-zinc-500">
                  Run URL analysis to see extracted metadata, features, pricing, and audience cues.
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
