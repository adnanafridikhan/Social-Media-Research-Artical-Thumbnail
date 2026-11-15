# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A local-first Next.js 14 app that takes a YouTube video idea through a 5-stage pipeline (idea → titles → package → thumbnail → export) using VidIQ data + AI. Internal tool, single user, BYOK via `.env.local`, no auth.

## Commands

```powershell
npm run dev            # next dev (localhost:3000)
npm run build          # next build (typechecks via tsconfig strict)
npm run start          # next start (after build)
npm run lint           # next lint (eslint-config-next)

node scripts/test-vidiq.mjs   # standalone VidIQ MCP smoke test, reads .env.local directly
```

There is no test framework installed. `tsc --noEmit` happens as part of `npm run build`. There is no single-test runner — verify changes by running the dev server and exercising the pipeline end-to-end, or by hitting the API routes directly with curl/Postman.

Required env vars (see [.env.local.example](.env.local.example)): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `VIDIQ_API_KEY`. Routes check these via `assertEnv` in [lib/errors.ts](lib/errors.ts) and return a 500 with the missing list if any are absent.

Database schema lives in [supabase-schema.sql](supabase-schema.sql). Run it once in the Supabase SQL editor and create a public `thumbnails` storage bucket.

## Architecture

### Pipeline data flow

A "project" (`video_projects` row) advances through `status`: `research` → `titles_generated` → `package_ready` → `thumbnail_ready` → `exported`. Each stage writes to its own child table (`title_suggestions`, `video_packages`, `thumbnails`) and updates `video_projects.status`. The user can jump between stages freely via the step indicator; status reflects "furthest reached," not "current view."

Four API routes drive the pipeline, all in [app/api/](app/api/):

1. **`POST /api/research/generate-titles`** — Takes `{ seedIdea, projectId? }`. Creates a project if needed, runs `vidiq.keywordResearch` and `vidiq.getOutliers` in parallel via `Promise.allSettled` (so either failing doesn't sink the request), passes results to `generateTitles` which calls GPT-4o for 8 titles, then scores each via `vidiq.scoreTitle` in parallel.
2. **`POST /api/package/generate`** — Takes `{ projectId, titleId }`. Marks the selected title, runs 3 GPT-4o calls in parallel (`generateDescription`, `generateTags`, `generateThumbnailBrief` in [lib/text.ts](lib/text.ts)).
3. **`POST /api/thumbnail/generate`** — Takes `{ projectId, engine, brief, variations }`. Generates N images in parallel, uploads to Supabase storage, scores each via `vidiq.scoreThumbnail`.
4. **`GET/PATCH/DELETE /api/project/[id]`** and **`GET /api/projects`** — Standard CRUD with related rows nested.

### Two-tier VidIQ client with GPT fallback (important)

[lib/vidiq.ts](lib/vidiq.ts) is **not** a REST client. VidIQ is accessed via its official **MCP server** at `https://mcp.vidiq.com/mcp` using `@modelcontextprotocol/sdk` (`StreamableHTTPClientTransport`, Bearer token auth, requires a VidIQ Max plan). A single MCP client is lazily connected and reused via `clientPromise`.

**Every public function has a GPT-4o fallback.** If `VIDIQ_API_KEY` is missing/placeholder, or the MCP call throws, the function logs a warning and falls back to a GPT-4o JSON-mode call that fabricates plausible data in the same shape. This means:
- The pipeline never hard-fails on VidIQ outages, but scores/volumes may be hallucinated. Don't trust low-confidence scores in dev without a real key.
- `scoreThumbnail` requires `title` AND `videoId` to use the MCP path; otherwise it always uses the GPT-4o vision fallback. Generated thumbnails have no `videoId`, so in practice they're always scored by GPT-4o vision.
- `getOutliers` has no fallback — it returns `[]` on failure.

The internal normalization (`compBucket`, field aliases like `viewCount ?? views`) exists because MCP response shapes are loose; preserve these when editing.

### Text generation is OpenAI, not Anthropic

Despite the original spec mentioning "Claude (Anthropic SDK)", **the codebase uses OpenAI `gpt-4o` for all text generation**. There is no `lib/claude.ts` and no `@anthropic-ai/sdk` dependency. All text prompts live in [lib/text.ts](lib/text.ts) (`generateTitles`, `generateDescription`, `generateTags`, `generateThumbnailBrief`). If adding new text generation, follow the existing pattern: a thin `chat(prompt, maxTokens)` helper around `gpt-4o`, returning either raw text or JSON parsed from a regex-extracted array.

The image model in [lib/openai.ts](lib/openai.ts) is `gpt-image-2-2026-04-21` at `1536x1024` (16:9). It returns either `url` or `b64_json`; the wrapper normalizes both to a string the route can hand to Supabase storage.

### Supabase clients

[lib/supabase.ts](lib/supabase.ts) exposes two factories: `getSupabaseAdmin()` (service role, server-only, used by every API route) and `getSupabase()` (anon, for client components if needed). API routes always use admin because RLS isn't configured for v1.

### Frontend

App Router pages under [app/dashboard/](app/dashboard/). Project pages share [app/dashboard/project/[id]/layout.tsx](app/dashboard/project/%5Bid%5D/layout.tsx) which renders the clickable [StepIndicator](components/pipeline/StepIndicator.tsx). UI primitives in [components/ui/](components/ui/) are shadcn-style (button/card/badge/textarea only — add more as needed via the shadcn CLI pattern, not a runtime dependency). Toasts via `sonner`.

## Conventions

- **No em dashes in any generated copy or UI text.** This is a user preference and every prompt in `lib/text.ts` enforces it; keep it when adding prompts.
- API routes wrap their handler body in try/catch and return `{ error: extractError(err) }` with status 500. `extractError` in [lib/errors.ts](lib/errors.ts) handles Supabase-style errors (`message`/`code`/`details`/`hint`) — use it instead of `String(err)`.
- TypeScript strict mode is on. Shared types live in [types/index.ts](types/index.ts); request/response shapes are named `Generate*Request` / `Generate*Response`.
- Server-side only for all API keys. Never import from `lib/openai.ts`, `lib/vidiq.ts`, or `lib/text.ts` in a client component.
- Parallelize independent AI/VidIQ calls with `Promise.all` (when one failure should abort) or `Promise.allSettled` (when partial results are acceptable — see `generate-titles`).
