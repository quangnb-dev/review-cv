## [2026-03-16] Round 1 (from spx-apply auto-verify)

### spx-verifier
- Fixed: CRITICAL-2 — Rewrite error message changed from "Rewrite failed." to "Rewrite failed. Try again." and "Rewrite this" button now hidden when error shows (results-view.tsx)
- Fixed: CRITICAL-3 — Added congratulatory message for 90+ score with no suggestions, and "optional improvements" header when 90+ with suggestions (results-view.tsx)
- Fixed: CRITICAL-4 — Added 7 new test cases: PDF upload success, DOCX upload success, PDF parse failure (422), retry recovery, non-JSON response, invalid schema response, retry recovery for rewrite route
- Fixed: WARNING-1 — Removed unused jdText prop from ResultsViewProps and ResultsView call site
- Fixed: SUGGESTION-1 — Fixed prompts.test.ts assertion from "Rewrite the text" to "Rewrite the following CV section"

### spx-arch-verifier
- Fixed: WARNING — Removed dead validation code in FileUpload component (validate function that was never acted upon)
- Fixed: WARNING — Strengthened weak assertion in api-analyze.test.ts from toBeDefined() to toMatch(/service unavailable/i)

### spx-uiux-verifier
- Fixed: CRITICAL — Added htmlFor attributes to form labels ("cv-text", "jd-text") with matching ids on Textarea components
- Fixed: CRITICAL — Added role="status" and aria-label to loading overlay, aria-live="polite" to rotating status message
- Fixed: CRITICAL — Added focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 to file upload drop zone

### spx-test-verifier
- Fixed: C4 — Added retry-recovery tests for both analyze and rewrite routes
- Fixed: C5 — Added PDF parse failure test (422 path)
- Fixed: C6 — Added tests for non-JSON and invalid schema Claude responses
- Fixed: C10 — Strengthened weak 502 error assertion
- Fixed: C11 — Added PDF and DOCX file upload success tests

## [2026-03-16] Round 2 (from spx-apply auto-verify)

### spx-arch-verifier
- Fixed: Extracted shared `callClaude` helper to `src/lib/claude.ts` eliminating DRY violation between analyze and rewrite routes
- Fixed: Extracted shared file validation constants to `src/lib/constants.ts` eliminating triple-definition across page.tsx, file-upload.tsx, and analyze/route.ts
- Fixed: Removed dead `validate` function and unused local constants from file-upload.tsx

### spx-uiux-verifier
- Fixed: Added `<h1 className="sr-only">CV Review Results</h1>` for heading hierarchy on results page
- Fixed: Added `aria-hidden="true"` on ATS emoji spans + sr-only text for screen readers
- Fixed: Added `role="img"` and `aria-label` to CircularScore SVG
- Fixed: Changed hardcoded `stroke="#e5e7eb"` to `stroke="currentColor"` with `className="text-gray-200"` for design token consistency
- Fixed: Added `motion-reduce:!transition-none` class for prefers-reduced-motion support
- Fixed: Added ATS all-clear summary message when all findings pass
- Fixed: Increased remove-file button touch target from p-1 to p-2.5
- Fixed: Added `aria-label="Upload CV file"` to file upload drop zone
- Fixed: Changed layout.tsx body classes from `bg-white text-gray-900` to `bg-background text-foreground` for design tokens

### spx-test-verifier
- Fixed: Rewrote api-analyze.test.ts to mock `@/lib/claude` instead of `@anthropic-ai/sdk` after route refactoring
- Fixed: Updated all mock return values from SDK response objects to plain strings (matching `callClaude` return type)
- Fixed: Added DOCX parse failure test (422 path)
- Fixed: Added language detection instruction test for analysis prompt

## [2026-03-16] Round 3 (from spx-apply auto-verify)

### spx-verifier
- Fixed: CRITICAL-2 — Strengthened prompts.test.ts assertions to match full instruction strings instead of partial substrings
- Fixed: WARNING-1 — Moved ATS all-clear summary message above individual findings for visual prominence
- Noted: CRITICAL-1 (short CV warning for file uploads) — intentionally text-only; file word count is unknown until server-side parsing. Added clarifying comment.

### spx-arch-verifier
- Fixed: WARNING-1 — Extracted generic `withRetry<T>` utility to `src/lib/claude.ts`, both routes now use it instead of duplicated retry loops
- Fixed: WARNING-2 — Added `MAX_TEXT_LENGTH` (50k chars) constant and validation in both API routes for text fields
- Fixed: WARNING-3 — Removed no-op `handleFile` wrapper in file-upload.tsx, handlers now call `onFileSelect` directly

### spx-uiux-verifier
- Fixed: CRITICAL-2 — Replaced hardcoded `ring-blue-500` with `ring-ring` design token on file upload drop zone
- Fixed: CRITICAL-3 — Replaced all hardcoded gray/blue colors in file-upload.tsx with design tokens (border-border, bg-muted, text-foreground, text-primary, text-muted-foreground, text-destructive, bg-accent, etc.)
- Fixed: CRITICAL-4 — Replaced all hardcoded gray colors in results-view.tsx with design tokens (text-card-foreground, text-muted-foreground, text-foreground, bg-muted, divide-border, text-destructive)
- Fixed: WARNING-5 — Added `aria-hidden="true"` to Loader2 spinner icon during rewrite
- Fixed: WARNING-6 — Restored padding on Retry button (`px-2 py-1`) for adequate touch target
- Fixed: WARNING-7 — Added `role="alert"` to validation hint messages in page.tsx
- Fixed: WARNING-8 — Added `role="alert"` to file error message in file-upload.tsx

### spx-test-verifier
- Fixed: C1 — Created `src/__tests__/claude.test.ts` with tests for `callClaude` (text response, non-text response throw, maxTokens passthrough) and `withRetry` (first success, retry recovery, exhausted retries)
