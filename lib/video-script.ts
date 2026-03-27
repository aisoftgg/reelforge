export type GeneratedVideoSection = {
  label: "hook" | "problem" | "solution" | "proof" | "cta";
  text: string;
};

type SavedScriptRecord = {
  hook_variations: unknown;
  body_text: string | null;
  cta_text: string | null;
};

function normalizeHooks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function extractBodySection(bodyText: string, label: string) {
  const expression = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]+:|$)`, "i");
  const match = bodyText.match(expression);
  return match?.[1]?.trim() ?? "";
}

export function buildVideoSections(script: SavedScriptRecord, selectedHook: number) {
  const hooks = normalizeHooks(script.hook_variations);
  const bodyText = script.body_text ?? "";
  const sections: GeneratedVideoSection[] = [
    { label: "hook", text: hooks[selectedHook] ?? hooks[0] ?? "" },
    { label: "problem", text: extractBodySection(bodyText, "Problem") },
    { label: "solution", text: extractBodySection(bodyText, "Solution") },
    { label: "proof", text: extractBodySection(bodyText, "Proof") },
    { label: "cta", text: script.cta_text?.trim() ?? "" }
  ];

  return sections.filter((section) => section.text);
}

export function calculateSectionDurations(sections: GeneratedVideoSection[]) {
  const wordCounts = sections.map((section) => Math.max(section.text.split(/\s+/).length, 1));
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  const targetTotal = Math.min(Math.max(totalWords * 0.62, 30), 60);

  return sections.map((section, index) => {
    const proportionalDuration = (targetTotal * wordCounts[index]) / totalWords;
    return {
      ...section,
      duration: Math.min(Math.max(proportionalDuration, 5), 12)
    };
  });
}
