## Context

Greenfield project — no existing codebase. Building a personal CV review web app that analyzes CVs against job descriptions using AI. The app is stateless (no database, no auth) and runs as a Next.js application with server-side API routes.

Target user: single developer (personal tool). Supports English and Vietnamese CVs.

## Goals / Non-Goals

**Goals:**
- Parse CV files (PDF/DOCX) and extract text server-side
- Analyze CV against JD using Claude API with structured JSON output
- Provide multi-dimensional scoring (5 categories + overall)
- Simulate ATS scanning (keyword density, format, sections, contact info)
- Offer on-demand AI rewrite for individual suggestions
- Clean, minimal UI (Notion/Linear style)

**Non-Goals:**
- User authentication or multi-tenancy
- Persistent storage (no database, no history)
- CV template generation or formatting
- Direct CV editing within the app
- Batch processing of multiple CVs
- Mobile-native app

## Decisions

### 1. Next.js App Router with API Routes
**Choice**: Next.js 14+ with App Router for both frontend and API.
**Why**: Single deployment, server-side API routes handle file parsing and API keys securely. No need for a separate backend.
**Alternatives**: Separate React + Express (unnecessary complexity), Vite + serverless functions (more deployment config).

### 2. Server-side file parsing
**Choice**: `pdf-parse` for PDF, `mammoth` for DOCX — both run in API routes.
**Why**: Server-side parsing keeps file handling secure and consistent. Client-side PDF.js works but DOCX parsing in browser is unreliable.
**Alternatives**: Client-side pdfjs-dist (DOCX support poor), external parsing service (overkill).

### 3. Single Claude API call + on-demand rewrite
**Choice**: One main API call returns all scores, ATS report, and suggestions as structured JSON. Separate calls for rewrite only when user requests.
**Why**: Minimizes token usage and latency. Most users want the overview first; rewrites are optional.
**Alternatives**: Multiple parallel calls (faster but 3-5x token cost), all-in-one including rewrites (wasteful — most sections won't be rewritten).

### 4. Claude model selection
**Choice**: `claude-sonnet-4-6` for both analysis and rewrite.
**Why**: Good balance of quality and speed for structured analysis. Opus would be higher quality but slower and more expensive for a personal tool.

### 5. Structured JSON output from Claude
**Choice**: Use Claude's structured output to return a typed JSON response with scores, ATS findings, and suggestions.
**Why**: Reliable parsing, type-safe on the frontend, no regex/string parsing needed.

### 6. UI framework
**Choice**: Tailwind CSS + shadcn/ui components.
**Why**: Rapid development, consistent clean aesthetic, accessible components out of the box. shadcn/ui is copy-paste (no heavy dependency).

### 7. No state management library
**Choice**: React useState/useReducer only.
**Why**: Two-screen app with no shared global state. Input page collects data, results page displays it. Props/state is sufficient.

## Risks / Trade-offs

- **PDF parsing quality varies** → Mitigation: Show clear error when parsing fails, offer text paste fallback. Warn if extracted text is suspiciously short.
- **Claude API latency (5-15s)** → Mitigation: Fake progress bar with rotating status messages to keep user engaged.
- **Token cost for long CVs + JDs** → Mitigation: Sonnet model keeps cost low (~$0.01-0.05 per analysis). No persistent usage tracking needed for personal tool.
- **Structured JSON output may occasionally malform** → Mitigation: Validate response shape, show error + retry if parsing fails.
- **mammoth DOCX parsing loses some formatting info** → Mitigation: Acceptable — we need text content, not formatting. ATS format checks will be based on structural analysis in the prompt, not raw formatting.
