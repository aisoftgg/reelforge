import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { scrapeProductUrl } from "@/lib/scraper";
import type {
  GenerateScriptRequest,
  GeneratedScript,
  ProductInfo
} from "@/lib/script-engine";
import { createClient } from "@/lib/supabase/server";

function buildContext(productInfo: ProductInfo | null, productDescription: string | undefined) {
  if (productInfo) {
    return {
      source: "url",
      title: productInfo.title,
      description: productInfo.description,
      keyFeatures: productInfo.keyFeatures,
      pricingInfo: productInfo.pricingInfo,
      targetAudienceSignals: productInfo.targetAudienceSignals,
      headings: productInfo.headings
    };
  }

  return {
    source: "manual",
    description: productDescription?.trim() ?? ""
  };
}

function buildBodyText(script: GeneratedScript) {
  return [
    `Problem: ${script.problem}`,
    `Solution: ${script.solution}`,
    `Proof: ${script.proof}`
  ].join("\n\n");
}

function extractTextFromResponse(response: any) {
  const textBlocks = Array.isArray(response?.content)
    ? response.content
        .filter((item: any) => item?.type === "text" && typeof item?.text === "string")
        .map((item: any) => item.text)
    : [];

  return textBlocks.join("\n").trim();
}

function parseScriptPayload(rawText: string): GeneratedScript {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Claude response did not contain valid JSON.");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  const hooks = Array.isArray(parsed.hooks)
    ? parsed.hooks.map((hook: unknown) => String(hook).trim()).filter(Boolean).slice(0, 5)
    : [];

  if (hooks.length !== 5) {
    throw new Error("Claude response did not include 5 hooks.");
  }

  return {
    hooks,
    problem: String(parsed.problem ?? "").trim(),
    solution: String(parsed.solution ?? "").trim(),
    proof: String(parsed.proof ?? "").trim(),
    cta: String(parsed.cta ?? "").trim()
  };
}

async function generateScriptWithClaude(payload: {
  targetAudience: string;
  productInfo: ProductInfo | null;
  productDescription?: string;
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const context = buildContext(payload.productInfo, payload.productDescription);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 900,
    temperature: 0.8,
    system:
      "You write short-form product marketing video scripts. Return only valid JSON with keys hooks, problem, solution, proof, cta. Hooks must be an array of exactly 5 strings. Each section should sound specific, punchy, and native to TikTok/Reels/Shorts, but never cringe.",
    messages: [
      {
        role: "user",
        content: `Generate a 30-60 second product promo script for target audience "${payload.targetAudience}".

Product context:
${JSON.stringify(context, null, 2)}

Constraints:
- Hooks are first 3-second scroll-stoppers.
- Problem should agitate the pain.
- Solution should introduce the product naturally.
- Proof should give one believable result, feature, or demo beat.
- CTA should be soft and low-pressure.
- Keep each section concise enough for a short-form video.
- Return JSON only.`
      }
    ]
  });

  return parseScriptPayload(extractTextFromResponse(response));
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

    const body = (await request.json()) as GenerateScriptRequest;
    const productUrl = body.productUrl?.trim();
    const productDescription = body.productDescription?.trim();
    const targetAudience = body.targetAudience?.trim();

    if (!targetAudience) {
      return NextResponse.json({ error: "Target audience is required." }, { status: 400 });
    }

    if (!productUrl && !productDescription) {
      return NextResponse.json(
        { error: "Provide either a product URL or a manual description." },
        { status: 400 }
      );
    }

    const productInfo = productUrl ? await scrapeProductUrl(productUrl) : null;
    const script = await generateScriptWithClaude({
      targetAudience,
      productInfo,
      productDescription
    });

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name:
          productInfo?.title ||
          productUrl ||
          productDescription?.slice(0, 60) ||
          "Untitled Project",
        product_url: productUrl ?? null,
        product_description: productDescription ?? productInfo?.description ?? null,
        target_audience: targetAudience
      })
      .select("id")
      .single();

    if (projectError || !project) {
      throw new Error(projectError?.message ?? "Failed to save project.");
    }

    const { data: savedScript, error: scriptError } = await supabase
      .from("scripts")
      .insert({
        project_id: project.id,
        hook_variations: script.hooks,
        body_text: buildBodyText(script),
        cta_text: script.cta,
        selected_hook: 0
      })
      .select("id")
      .single();

    if (scriptError || !savedScript) {
      throw new Error(scriptError?.message ?? "Failed to save script.");
    }

    return NextResponse.json({
      projectId: project.id,
      scriptId: savedScript.id,
      productInfo,
      script
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected script generation error.";
    const status = message.includes("Unauthorized")
      ? 401
      : message.includes("configured")
        ? 501
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
