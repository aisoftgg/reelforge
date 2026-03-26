# PRD: ReelForge - AI Product Videos That Sell

**Version:** 1.0
**Date:** 2026-03-26
**Status:** Draft
**Owner:** Kai + Chris

---

## 1. Problem

Small SaaS founders, indie hackers, and e-commerce sellers know short-form video (Reels, TikTok, Shorts) is the #1 organic distribution channel in 2026. But they can't make videos because:

- They don't want to be on camera
- Hiring a UGC creator costs $150-500 per video
- Existing AI tools are either too expensive ($49-200/mo) or too generic (Reddit stories, motivational quotes)
- No tool is specifically built for **product marketing** videos

**Nobody is solving "faceless product marketing video" at an affordable price point.**

## 2. Solution

ReelForge takes a product URL or description and generates ready-to-post vertical videos optimized for selling. No camera, no editing, no creator needed.

**Input:** Product URL, description, or landing page
**Output:** 30-60 second vertical video with hook, voiceover, stock footage, and animated captions

## 3. Target Users

- Solo SaaS founders (our exact network)
- Indie hackers launching products
- Small e-commerce sellers
- Digital product creators (courses, ebooks, templates)
- Agencies managing multiple small brands

## 4. Core Features (MVP - v1.0)

### 4.1 Script Generator
- User provides: product URL or description + target audience
- AI analyzes the product and generates a script using proven frameworks:
  - **Hook** (first 3 seconds - the make-or-break moment)
  - **Problem** (agitate the pain point)
  - **Solution** (introduce the product naturally)
  - **Proof/Demo** (key feature or result)
  - **CTA** (soft, non-cringe call to action)
- Generates **5 hook variations** per video so users can A/B test
- User can edit the script before generating video

### 4.2 Video Assembly Engine
- Pulls relevant stock footage from Pexels API (free, no attribution needed for video)
- Matches footage to script segments using AI keyword extraction
- Assembles clips into 9:16 vertical format (1080x1920)
- Smooth transitions between clips (crossfade, cut)
- Background music from royalty-free library
- Total length: 30-60 seconds (configurable)
- Built with **ffmpeg** - no GPU, no heavy infra

### 4.3 AI Voiceover
- ElevenLabs API for natural-sounding voiceover
- 3-5 voice options (male/female, different tones)
- Auto-syncs voiceover timing to video segments
- Supports pauses for emphasis on hook lines

### 4.4 Animated Captions
- Auto-generated word-by-word captions (like CapCut trending style)
- Bold, high-contrast text on dark background strip
- Highlight keywords in accent color
- Positioned in lower third (standard Reels placement)
- Built with ffmpeg drawtext + ASS subtitles

### 4.5 Export & Download
- Direct MP4 download (1080x1920, H.264)
- Optimized file size for social uploads (<50MB)
- No watermark on paid plans

## 5. User Flow

```
Landing Page --> Sign Up (email + password)
    |
    v
Dashboard (list of projects/videos)
    |
    v
New Video --> Enter product URL or description
    |         Select target audience
    |         Select video style (testimonial, demo, problem-solve)
    v
Script Review --> AI-generated script with 5 hook options
    |              Edit any section
    |              Pick voice
    v
Generate --> Processing (30-90 seconds)
    |
    v
Preview --> Watch the video
    |         Regenerate specific sections
    |         Download MP4
    v
Library --> All generated videos, re-downloadable
```

## 6. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 + Tailwind | We know it, fast to build |
| Backend | Next.js API routes | Serverless, no server management |
| Database | Supabase (Postgres + Auth) | Already set up, proven |
| Video Assembly | ffmpeg (server-side) | Free, powerful, no GPU needed |
| Voiceover | ElevenLabs API | Best quality TTS available |
| Stock Footage | Pexels API | Free, high quality, no attribution in video |
| AI Scripts | Claude API (Sonnet) | Fast, cheap, great at copywriting |
| Hosting | Vercel | Already using it |
| Storage | Supabase Storage or R2 | Video file hosting |
| Payments | Stripe | Already integrated |

### 6.1 Architecture Note - Video Processing

ffmpeg can't run on Vercel serverless (10s timeout, no binary). Options:
- **Option A:** Dedicated worker on a $5/mo VPS (Hetzner/Railway) that pulls jobs from a queue
- **Option B:** Modal.com serverless functions (pay per use, has ffmpeg)
- **Option C:** Replicate.com custom model (ffmpeg container)

**Decision:** Option A - small VPS worker ($5/mo Hetzner or Railway). Queue via Supabase table polling. Keeps costs fixed and predictable. Can scale up later if needed.

## 7. Pricing

| Plan | Price | Videos/mo | Features |
|------|-------|-----------|----------|
| Free | $0 | 2 | Watermark, 1 voice, basic captions |
| Starter | $19/mo | 15 | No watermark, 5 voices, all caption styles |
| Pro | $49/mo | Unlimited | Priority rendering, custom brand colors, bulk generation |

**BYOK option:** Users can bring their own ElevenLabs + Anthropic API keys to reduce our costs.

## 8. Competitive Positioning

| Feature | ReelForge | AutoShorts | Faceless.so | MakeUGC |
|---------|-----------|------------|-------------|---------|
| Product-focused scripts | YES | No | No | Partial |
| Price | $19/mo | $30/mo | $27/mo | $49/mo |
| Hook A/B variations | 5 per video | No | No | No |
| Product URL input | YES | No | No | Yes |
| Faceless (no avatar) | YES | Yes | Yes | No (avatar) |
| Promo ratio tracking | YES | No | No | No |

**Our angle:** "The only video tool built specifically for selling products - not making content channels."

## 9. Success Metrics

- **Week 1:** MVP live, generate first 10 videos for our own products
- **Week 2:** 5 beta users from Reddit/X outreach
- **Month 1:** 20 paying users, $380-980 MRR
- **Month 3:** 100 paying users, $1,900-4,900 MRR

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| ElevenLabs costs eat margins | High | BYOK option, cache common voices, use shorter clips |
| Stock footage feels generic | Medium | AI-powered clip selection, allow user uploads in v2 |
| ffmpeg assembly quality | Medium | Invest in template system with proven transitions |
| Pexels API rate limits | Low | Cache popular clips, fallback to Pixabay |
| Video rendering too slow | Medium | Queue system with status updates, async generation |

## 11. MVP Build Plan (Builder Cron Tasks)

### Phase 1: Foundation (Day 1-2)
- [ ] Initialize Next.js project from SaaS Starter Kit
- [ ] Supabase schema: users, projects, videos, scripts
- [ ] Landing page with value prop and waitlist
- [ ] Auth flow (signup/login)
- [ ] Stripe integration (copy from starter kit)

### Phase 2: Script Engine (Day 2-3)
- [ ] Product URL scraper (fetch + extract key info)
- [ ] Claude-powered script generator with 5 hook variations
- [ ] Script editor UI (edit sections, pick hooks)
- [ ] Target audience selector

### Phase 3: Video Assembly (Day 3-5)
- [ ] Pexels API integration (search + download clips)
- [ ] ffmpeg video assembly pipeline (clips + transitions)
- [ ] ElevenLabs voiceover generation
- [ ] Caption generation (word-level timestamps + ffmpeg overlay)
- [ ] Audio mixing (voice + background music)
- [ ] Worker queue for async video generation

### Phase 4: Polish & Launch (Day 5-7)
- [ ] Video preview player
- [ ] Download flow
- [ ] Dashboard with video library
- [ ] Free tier watermark logic
- [ ] Usage tracking and limits
- [ ] Production deployment

## 12. What We're NOT Building (v1)

- AI avatars / talking heads (too complex, MakeUGC's territory)
- Direct posting to social platforms (v2)
- Video templates marketplace (v2)
- Team / collaboration features (v2)
- Mobile app (v2)
- Video analytics / performance tracking (v2)

## 13. Dogfooding Plan

Before public launch, we generate videos for:
1. SaaS Starter Kit ($99) - 5 variations
2. OpenClaw Guide ($29) - 5 variations
3. Reply Engine (waitlist) - 3 variations
4. KaiShips brand awareness - 3 variations

Post these across Instagram, TikTok, YouTube Shorts. Track which hooks and styles convert. Use those learnings to improve the product before selling it.

---

*"We use ReelForge to sell ReelForge."* - The ultimate dogfood loop.
