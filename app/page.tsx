import Link from "next/link";
import { PricingCard } from "@/components/pricing-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const steps = [
  {
    title: "Paste URL",
    description: "Drop in a product URL or description and tell ReelForge who you want to convert."
  },
  {
    title: "AI Script",
    description: "Generate a product-focused video script with five hook variations and a ready-to-edit structure."
  },
  {
    title: "Download Video",
    description: "Render a faceless vertical promo with captions, stock footage, and voiceover."
  }
];

const plans = [
  {
    name: "Try It Free",
    price: "Free",
    priceLabel: "for 3 days",
    description: "2 videos, full features, no credit card required.",
    features: ["2 videos included", "All voices & caption styles", "Full quality export", "No watermark"]
  },
  {
    name: "Starter",
    price: "$29",
    description: "For solo founders shipping product videos weekly.",
    features: ["10 videos / month", "All voices & caption styles", "Priority rendering", "No watermark"],
    featured: true
  },
  {
    name: "Pro",
    price: "$49",
    description: "For teams and agencies running continuous campaigns.",
    features: ["30 videos / month", "Everything in Starter", "Bulk generation", "Custom brand colors"]
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-zinc-900">
          <div className="absolute inset-0 bg-hero-grid bg-[size:100%_100%,32px_32px,32px_32px] opacity-30" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 py-24 md:py-32">
            <div className="max-w-3xl space-y-8">
              <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                Built for SaaS founders, indie hackers, and product marketers
              </div>
              <div className="space-y-5">
                <h1 className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
                  AI Product Videos That Sell
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-zinc-300 md:text-xl">
                  Turn any product URL into a faceless short-form video designed for Reels,
                  TikTok, and Shorts. No creator. No editing backlog. No camera.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-blue-400"
                >
                  Try Free - No Card Needed
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
                >
                  See How It Works
                </Link>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {["5 hook variations", "30-60 second vertical exports", "Stock footage + AI voiceover"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-300"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 max-w-2xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-400">
              How It Works
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              From product page to ready-to-post video in three moves
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-sm font-semibold text-blue-300">
                  0{index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-y border-zinc-900 bg-zinc-950/70">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-12 max-w-2xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-400">
                Pricing
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Simple plans for founders shipping video every week
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <PricingCard key={plan.name} {...plan} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-24">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8 text-center md:p-12">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-400">
              Launch List
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Get early access to faceless product videos
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Join the list for launch updates, early pricing, and the first round of beta access.
            </p>
            <form className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="you@company.com"
                className="min-w-0 flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Join Waitlist
              </button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
