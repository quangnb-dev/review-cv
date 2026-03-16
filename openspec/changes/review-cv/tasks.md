## 1. Project Setup

- [x] 1.1 Initialize Next.js 14+ project with App Router, TypeScript, Tailwind CSS
- [x] 1.2 Install dependencies: @anthropic-ai/sdk, pdf-parse, mammoth, shadcn/ui (button, card, progress, textarea, alert)
- [x] 1.3 Create .env.local with ANTHROPIC_API_KEY placeholder and .env.example
- [x] 1.4 Set up project structure: app/, components/, lib/, types/ ← (verify: project runs with `npm run dev`, all deps installed, env configured)

## 2. Types & Shared Utilities

- [x] 2.1 Define TypeScript types: AnalysisResult (overall score, sub-scores, ATS report, suggestions), RewriteResult, SubScore, ATSFinding, Suggestion
- [x] 2.2 Create Claude prompt templates: analysis prompt (returns structured JSON with scores, ATS, suggestions) and rewrite prompt (takes section + JD + suggestion context)

## 3. API Routes — CV Parsing & Analysis

- [x] 3.1 Create POST /api/analyze route: accept multipart form data (file or text) + JD text
- [x] 3.2 Implement file parsing: PDF via pdf-parse, DOCX via mammoth, with error handling for corrupt/image-based files
- [x] 3.3 Implement input validation: check file size (5MB), file type (PDF/DOCX), CV content length (warn <50 words), JD not empty
- [x] 3.4 Implement Claude API call: send CV text + JD to Claude, parse structured JSON response with scores, ATS report, suggestions
- [x] 3.5 Implement retry logic: silent retry up to 2 times on API failure, return error after 3rd failure ← (verify: API route handles PDF, DOCX, and text input correctly; returns valid AnalysisResult JSON; retry logic works on simulated failures)

## 4. API Routes — Section Rewrite

- [x] 4.1 Create POST /api/rewrite route: accept original section text, JD, suggestion context
- [x] 4.2 Implement Claude API call for rewrite with retry logic (2 silent retries) ← (verify: rewrite returns improved text, retry logic works, error response is correct)

## 5. UI — Input Page

- [x] 5.1 Create input page layout: two-column or stacked layout with CV input area (top) and JD input area (bottom)
- [x] 5.2 Implement file upload component: drag-and-drop zone + click-to-browse, accepts PDF/DOCX, shows file name after upload, 5MB client-side validation
- [x] 5.3 Implement CV text paste textarea with placeholder text
- [x] 5.4 Implement JD text paste textarea with placeholder text
- [x] 5.5 Implement input switching logic: most recent input wins (file replaces text, text replaces file)
- [x] 5.6 Implement Analyze button with validation: disabled when CV or JD missing, shows hint for missing input
- [x] 5.7 Implement CV too-short warning dialog (<50 words): "Results may not be accurate. Continue anyway?" ← (verify: all input scenarios from cv-input spec work — upload, paste, validation, errors, edge cases)

## 6. UI — Loading State

- [x] 6.1 Implement loading screen with fake progress bar and rotating status messages ("Analyzing keywords...", "Checking ATS compatibility...", "Evaluating experience...", "Generating suggestions...")
- [x] 6.2 Disable Analyze button during loading ← (verify: progress bar animates smoothly, messages rotate, button is disabled)

## 7. UI — Results Page

- [x] 7.1 Create results page layout with Back button to return to input
- [x] 7.2 Implement overall score display: large number (0-100) with circular or horizontal progress bar
- [x] 7.3 Implement 5 sub-score cards: labeled progress bars with percentage and brief explanation
- [x] 7.4 Implement ATS scan report section: list of findings with ✅/⚠️/❌ status icons and descriptions
- [x] 7.5 Implement suggestions list: ordered by impact, each with section reference, description, and "Rewrite this" button ← (verify: all cv-analysis spec scenarios covered — scores display, ATS report with issues/all-clear, suggestions ordered by impact)

## 8. UI — Rewrite Feature

- [x] 8.1 Implement "Rewrite this" button: calls /api/rewrite, shows spinner while loading
- [x] 8.2 Implement inline rewrite display: expanded section below suggestion with rewritten text and "Copy" button
- [x] 8.3 Implement copy-to-clipboard: "Copy" button copies text, shows "Copied!" for 2 seconds, fallback to text selection if clipboard API unavailable
- [x] 8.4 Implement rewrite error state: "Rewrite failed. Try again." with retry button ← (verify: full rewrite flow works — click rewrite, loading spinner, inline display, copy button, error handling matches section-rewrite spec)

## 9. Styling & Polish

- [x] 9.1 Apply clean minimal theme: consistent spacing, typography, color palette (neutral with accent for scores)
- [x] 9.2 Ensure basic accessibility: sufficient color contrast, focus states on all interactive elements, keyboard navigation for buttons and textareas
- [x] 9.3 Add responsive layout: usable on both desktop and tablet widths ← (verify: UI is clean, accessible focus states work, layout doesn't break on resize)

## 10. Testing

- [x] 10.1 Unit tests for /api/analyze: test with mock PDF, DOCX, and text input; test validation errors; test Claude API mock response parsing
- [x] 10.2 Unit tests for /api/rewrite: test successful rewrite; test retry logic; test error response
- [x] 10.3 Unit tests for file parsing utilities: test pdf-parse and mammoth extraction; test error cases (corrupt file, oversized file) ← (verify: all tests pass, cover happy paths and error paths from specs)
