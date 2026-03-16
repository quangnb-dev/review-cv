## Why

Job seekers often submit CVs that don't match the job description, missing critical keywords and formatting that ATS (Applicant Tracking Systems) look for. Manual CV review is time-consuming and subjective. This tool uses AI to analyze a CV against a specific job description, providing a multi-dimensional score, ATS compatibility report, and actionable suggestions — including AI-powered rewrites of weak sections.

## What Changes

- Add a Next.js web application with two screens: Input page and Results page
- Implement server-side CV parsing for PDF (pdf-parse) and DOCX (mammoth) files
- Integrate Claude API for multi-dimensional CV analysis against job descriptions
- Provide ATS scan simulation (keyword density, format compatibility, section detection, contact info, file format warnings)
- Provide on-demand AI rewrite for individual CV sections
- Support both English and Vietnamese CVs

## Capabilities

### New Capabilities
- `cv-input`: Handle CV input via file upload (PDF/DOCX, max 5MB) and text paste, plus JD text paste. Includes file parsing, validation, and error handling with fallback to text paste.
- `cv-analysis`: Analyze CV against JD using Claude API. Produce overall score (0-100) with 5 sub-scores (Keyword Match, Skills Alignment, Experience Relevance, Format & Structure, Impact & Metrics). Includes ATS scan report and actionable suggestions.
- `section-rewrite`: On-demand AI rewrite of individual CV sections. User clicks "Rewrite this" on a suggestion, Claude API generates improved text, displayed inline with copy button.

### Modified Capabilities

(none — greenfield project)

## Impact

- New Next.js project with App Router, Tailwind CSS, shadcn/ui
- Dependencies: next, react, tailwindcss, @anthropic-ai/sdk, pdf-parse, mammoth, shadcn/ui components
- Requires ANTHROPIC_API_KEY environment variable
- Two API routes: POST /api/analyze, POST /api/rewrite
- No database, no authentication — stateless personal tool
