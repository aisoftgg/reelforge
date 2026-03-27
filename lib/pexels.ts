import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";

export type ScriptKeywordSection = {
  label: string;
  text: string;
  keywords: string[];
};

type PexelsVideoFile = {
  id: number;
  width: number;
  height: number;
  link: string;
  file_type: string;
};

type PexelsVideo = {
  id: number;
  duration: number;
  width: number;
  height: number;
  video_files: PexelsVideoFile[];
};

type PexelsSearchResponse = {
  videos: PexelsVideo[];
};

const STOP_WORDS = new Set([
  "a",
  "about",
  "after",
  "again",
  "all",
  "also",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "been",
  "before",
  "but",
  "by",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "get",
  "got",
  "had",
  "has",
  "have",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "like",
  "make",
  "more",
  "most",
  "need",
  "not",
  "now",
  "of",
  "on",
  "or",
  "our",
  "out",
  "so",
  "still",
  "than",
  "that",
  "the",
  "their",
  "them",
  "there",
  "they",
  "this",
  "to",
  "up",
  "use",
  "using",
  "very",
  "want",
  "was",
  "we",
  "well",
  "what",
  "when",
  "with",
  "work",
  "your"
]);

function normalizeToken(token: string) {
  return token.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeQuery(text: string) {
  return encodeURIComponent(text.trim());
}

function getPexelsApiKey() {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    throw new Error("PEXELS_API_KEY is not configured.");
  }

  return apiKey;
}

export function extractKeywords(text: string, limit = 4) {
  const wordCounts = new Map<string, number>();

  for (const rawToken of text.split(/\s+/)) {
    const token = normalizeToken(rawToken);

    if (token.length < 4 || STOP_WORDS.has(token)) {
      continue;
    }

    wordCounts.set(token, (wordCounts.get(token) ?? 0) + 1);
  }

  const keywords = [...wordCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([token]) => token)
    .slice(0, limit);

  return keywords.length ? keywords : ["startup", "product", "business"];
}

export function buildKeywordSections<T extends { label: string; text: string }>(sections: T[]) {
  return sections.map((section) => ({
    ...section,
    keywords: extractKeywords(section.text)
  }));
}

function pickVideoFile(video: PexelsVideo) {
  const portraitFiles = video.video_files.filter(
    (file) => file.file_type === "video/mp4" && file.height >= file.width
  );

  const candidates = portraitFiles.length ? portraitFiles : video.video_files;

  return [...candidates]
    .filter((file) => file.file_type === "video/mp4")
    .sort((left, right) => {
      const leftScore = Math.abs(left.height - 1920) + Math.abs(left.width - 1080);
      const rightScore = Math.abs(right.height - 1920) + Math.abs(right.width - 1080);
      return leftScore - rightScore;
    })[0];
}

export async function searchPexelsVideos(keywords: string[]) {
  const apiKey = getPexelsApiKey();
  const query = keywords.join(" ");
  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${escapeQuery(query)}&per_page=10&orientation=portrait&size=large`,
    {
      headers: {
        Authorization: apiKey
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as PexelsSearchResponse;
  const selected = payload.videos
    .map((video) => {
      const file = pickVideoFile(video);
      return file ? { video, file } : null;
    })
    .filter((value): value is { video: PexelsVideo; file: PexelsVideoFile } => Boolean(value));

  if (!selected.length) {
    throw new Error(`No Pexels videos found for query "${query}".`);
  }

  return selected;
}

export async function downloadClipToTmp(url: string, prefix: string) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Clip download failed with status ${response.status}.`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = extname(new URL(url).pathname) || ".mp4";
  const safePrefix = basename(prefix).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const outputPath = `/tmp/${safePrefix}-${randomUUID()}${extension}`;

  await writeFile(outputPath, buffer);

  return outputPath;
}
