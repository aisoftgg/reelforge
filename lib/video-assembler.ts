import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { exec as execCallback } from "node:child_process";

const exec = promisify(execCallback);
const FFMPEG_BIN = "/opt/homebrew/bin/ffmpeg";
const FFPROBE_BIN = "/opt/homebrew/bin/ffprobe";
const FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
const TRANSITION_DURATION = 0.5;

export type VideoSectionInput = {
  clipPath: string;
  text: string;
  duration: number;
};

function escapeFilterText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\n/g, " ");
}

async function runCommand(command: string) {
  await exec(command, {
    maxBuffer: 1024 * 1024 * 20
  });
}

export async function getVideoDuration(inputPath: string) {
  const { stdout } = await exec(
    `${FFPROBE_BIN} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`,
    {
      maxBuffer: 1024 * 1024
    }
  );

  const duration = Number.parseFloat(stdout.trim());

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not determine video duration for ${inputPath}.`);
  }

  return duration;
}

function splitCaptionWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function buildSectionFilter(section: VideoSectionInput, index: number) {
  const words = splitCaptionWords(section.text);
  const wordWindow = Math.max(section.duration / Math.max(words.length, 1), 0.35);
  const baseLabel = `v${index}`;
  const filters = [
    `[${index}:v]trim=duration=${section.duration.toFixed(2)},setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p,drawbox=x=0:y=h*0.72:w=w:h=h*0.18:color=black@0.6:t=fill[${baseLabel}base]`
  ];

  let previousLabel = `${baseLabel}base`;

  words.forEach((word, wordIndex) => {
    const start = (wordIndex * wordWindow).toFixed(2);
    const end = Math.min(section.duration, (wordIndex + 1) * wordWindow + 0.05).toFixed(2);
    const nextLabel = `${baseLabel}txt${wordIndex}`;
    const escapedWord = escapeFilterText(word);
    filters.push(
      `[${previousLabel}]drawtext=fontfile='${FONT_PATH}':text='${escapedWord}':fontcolor=white:fontsize=48:borderw=2:bordercolor=black@0.2:x=(w-text_w)/2:y=h*0.78:enable='between(t,${start},${end})'[${nextLabel}]`
    );
    previousLabel = nextLabel;
  });

  if (!words.length) {
    filters.push(`[${previousLabel}]null[${baseLabel}out]`);
  } else {
    filters.push(`[${previousLabel}]null[${baseLabel}out]`);
  }

  return {
    label: `${baseLabel}out`,
    filter: filters.join(";")
  };
}

function buildXfadeGraph(sections: VideoSectionInput[]) {
  const sectionFilters = sections.map(buildSectionFilter);
  const filters = sectionFilters.map((item) => item.filter);

  if (sections.length === 1) {
    filters.push(`[${sectionFilters[0].label}]format=yuv420p[finalv]`);
    return filters.join(";");
  }

  let currentLabel = sectionFilters[0].label;
  let elapsed = sections[0].duration;

  for (let index = 1; index < sectionFilters.length; index += 1) {
    const nextLabel = sectionFilters[index].label;
    const outputLabel = index === sectionFilters.length - 1 ? "finalv" : `xfade${index}`;
    const offset = Math.max(0, elapsed - TRANSITION_DURATION).toFixed(2);
    filters.push(
      `[${currentLabel}][${nextLabel}]xfade=transition=fade:duration=${TRANSITION_DURATION}:offset=${offset}[${outputLabel}]`
    );
    currentLabel = outputLabel;
    elapsed += sections[index].duration - TRANSITION_DURATION;
  }

  return filters.join(";");
}

export async function assembleVideo({
  clips,
  outputPath
}: {
  clips: VideoSectionInput[];
  outputPath?: string;
}) {
  if (!clips.length) {
    throw new Error("No clips were provided for assembly.");
  }

  const tempFilterPath = `/tmp/reelforge-filter-${randomUUID()}.txt`;
  const finalOutputPath = outputPath ?? `/tmp/reelforge-output-${randomUUID()}.mp4`;
  const filterGraph = buildXfadeGraph(clips);
  const inputArgs = clips.map((clip) => `-i "${clip.clipPath}"`).join(" ");

  await writeFile(tempFilterPath, filterGraph, "utf8");

  try {
    await runCommand(
      `${FFMPEG_BIN} -y ${inputArgs} -filter_complex_script "${tempFilterPath}" -map "[finalv]" -an -c:v libx264 -pix_fmt yuv420p -preset medium -crf 24 -movflags +faststart -maxrate 4M -bufsize 8M "${finalOutputPath}"`
    );
  } finally {
    await unlink(tempFilterPath).catch(() => undefined);
  }

  return finalOutputPath;
}
