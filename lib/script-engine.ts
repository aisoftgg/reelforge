export const TARGET_AUDIENCES = [
  "SaaS founders",
  "indie hackers",
  "ecommerce sellers",
  "content creators",
  "general"
] as const;

export type TargetAudience = (typeof TARGET_AUDIENCES)[number];

export type ProductInfo = {
  url: string;
  title: string;
  description: string;
  keyFeatures: string[];
  pricingInfo: string[];
  targetAudienceSignals: string[];
  headings: string[];
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
  };
};

export type ScriptSection = {
  label: string;
  text: string;
};

export type GeneratedScript = {
  hooks: string[];
  problem: string;
  solution: string;
  proof: string;
  cta: string;
};

export type GenerateScriptRequest = {
  productUrl?: string;
  productDescription?: string;
  targetAudience: TargetAudience;
};
