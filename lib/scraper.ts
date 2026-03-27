import * as cheerio from "cheerio";
import type { ProductInfo } from "@/lib/script-engine";

const USER_AGENT =
  "Mozilla/5.0 (compatible; ReelForgeBot/1.0; +https://reelforge.local/script-engine)";
type ScraperApi = any;

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function pickBestDescription($: ScraperApi) {
  const candidates = [
    $('meta[property="og:description"]').attr("content"),
    $('meta[name="description"]').attr("content"),
    $('meta[name="twitter:description"]').attr("content"),
    $("p").first().text()
  ];

  return normalizeText(candidates.find(Boolean) ?? "");
}

function pickBestTitle($: ScraperApi) {
  const candidates = [
    $('meta[property="og:title"]').attr("content"),
    $("title").first().text(),
    $("h1").first().text()
  ];

  return normalizeText(candidates.find(Boolean) ?? "");
}

function extractHeadings($: ScraperApi) {
  return unique(
    $("h1, h2, h3")
      .toArray()
      .map((element: any) => normalizeText($(element).text()))
      .filter((text: string) => text.length > 3)
  ).slice(0, 12);
}

function extractKeyFeatures($: ScraperApi) {
  const listItems = $("ul li, ol li")
    .toArray()
    .map((element: any) => normalizeText($(element).text()))
    .filter((text: string) => text.length >= 12 && text.length <= 180);

  const headingBlocks = $("section, div")
    .toArray()
    .flatMap((element: any) => {
      const node = $(element);
      const heading = normalizeText(node.find("h2, h3").first().text());
      const copy = normalizeText(node.find("p").first().text());

      if (!heading || !copy) {
        return [];
      }

      return [`${heading}: ${copy}`];
    });

  return unique([...listItems, ...headingBlocks]).slice(0, 8);
}

function extractPricingInfo($: ScraperApi) {
  const priceRegex =
    /(\$\s?\d[\d.,]*|usd\s?\d[\d.,]*|\d[\d.,]*\s?(?:\/mo|per month|monthly|year|yr|\/year))/i;

  const candidates = $(
    '[class*="price"], [class*="pricing"], [id*="price"], [id*="pricing"], [data-price]'
  )
    .toArray()
    .map((element: any) => normalizeText($(element).text()));

  const textMatches = $("body *")
    .toArray()
    .map((element: any) => normalizeText($(element).text()))
    .filter((text: string) => priceRegex.test(text));

  return unique([...candidates, ...textMatches]).slice(0, 6);
}

function extractAudienceSignals(
  title: string,
  description: string,
  headings: string[],
  features: string[]
) {
  const corpus = [title, description, ...headings, ...features].join(" ").toLowerCase();

  const signals = [
    "saas",
    "founders",
    "indie hackers",
    "ecommerce",
    "creators",
    "marketers",
    "agencies",
    "teams",
    "developers",
    "small business"
  ];

  return signals.filter((signal) => corpus.includes(signal));
}

export async function scrapeProductUrl(inputUrl: string): Promise<ProductInfo> {
  const url = new URL(inputUrl).toString();
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product page (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const title = pickBestTitle($);
  const description = pickBestDescription($);
  const headings = extractHeadings($);
  const keyFeatures = extractKeyFeatures($);
  const pricingInfo = extractPricingInfo($);
  const targetAudienceSignals = extractAudienceSignals(title, description, headings, keyFeatures);

  return {
    url,
    title,
    description,
    keyFeatures,
    pricingInfo,
    targetAudienceSignals,
    headings,
    openGraph: {
      title: $('meta[property="og:title"]').attr("content"),
      description: $('meta[property="og:description"]').attr("content"),
      image: $('meta[property="og:image"]').attr("content"),
      siteName: $('meta[property="og:site_name"]').attr("content")
    }
  };
}
