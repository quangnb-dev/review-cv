## ADDED Requirements

### Requirement: Multi-dimensional CV scoring
The system SHALL analyze the CV against the JD and produce an overall score (0-100) composed of 5 sub-scores, each rated 0-100:
1. **Keyword Match** — percentage of important JD keywords/phrases found in the CV
2. **Skills Alignment** — how well the CV's listed skills match JD requirements
3. **Experience Relevance** — how relevant the CV's work experience is to the role
4. **Format & Structure** — how ATS-friendly the CV format and structure are
5. **Impact & Metrics** — whether achievements include quantifiable metrics and results

The overall score SHALL be a weighted average of the 5 sub-scores.

#### Scenario: Successful analysis
- **WHEN** user submits valid CV and JD content
- **THEN** system calls Claude API and returns an overall score (0-100) with 5 sub-scores, each including a numeric score and a brief explanation

#### Scenario: Score display
- **WHEN** analysis completes successfully
- **THEN** results page shows overall score prominently, with 5 sub-scores displayed as labeled progress bars with percentage values

### Requirement: ATS scan simulation
The system SHALL simulate an ATS scan and produce a report covering:
1. **Keyword density** — list of important JD keywords found/missing in the CV
2. **Format compatibility** — warnings if CV contains tables, images, complex headers, or other elements that ATS systems commonly misparse
3. **Section detection** — check for standard sections (Experience, Education, Skills, Summary/Objective) and flag missing ones
4. **Contact info check** — verify presence of email, phone number, and LinkedIn URL
5. **File format notes** — warnings about the source file format if relevant (e.g., image-based PDF)

#### Scenario: ATS report with issues
- **WHEN** analysis finds ATS compatibility issues
- **THEN** each finding is displayed with a status icon: ✅ (pass), ⚠️ (warning), ❌ (fail) and a description

#### Scenario: ATS report all clear
- **WHEN** CV has no ATS compatibility issues
- **THEN** report shows all items as ✅ with a summary "Your CV is well-formatted for ATS systems"

### Requirement: Actionable suggestions
The system SHALL provide a list of specific, actionable suggestions to improve the CV's match with the JD. Each suggestion SHALL include:
- The section of the CV it applies to (e.g., "Experience — Job #2", "Skills section")
- What to improve and why
- A "Rewrite this" button to request an AI-generated improved version

#### Scenario: Suggestions generated
- **WHEN** analysis completes
- **THEN** system displays a list of suggestions ordered by impact (highest impact first), each with section reference, improvement description, and a "Rewrite this" button

#### Scenario: No suggestions needed
- **WHEN** CV scores 90+ overall
- **THEN** system shows a congratulatory message with any minor optional improvements

### Requirement: Loading state during analysis
The system SHALL show a fake progress bar with rotating status messages while waiting for Claude API response. Messages rotate through: "Analyzing keywords...", "Checking ATS compatibility...", "Evaluating experience...", "Generating suggestions..."

#### Scenario: Analysis in progress
- **WHEN** user clicks Analyze and API call is in progress
- **THEN** system shows a progress bar that advances gradually with rotating status text, and the Analyze button is disabled

### Requirement: Analysis error handling
The system SHALL retry failed Claude API calls up to 2 times silently before showing an error.

#### Scenario: API fails after retries
- **WHEN** Claude API call fails 3 times (initial + 2 retries)
- **THEN** system shows inline error "Analysis failed. Please try again." with a retry button

#### Scenario: API succeeds on retry
- **WHEN** first API call fails but a retry succeeds
- **THEN** user sees normal results with no indication of the retry

### Requirement: Language-aware analysis
The system SHALL detect the language of the CV (English or Vietnamese) and provide analysis feedback in the same language as the CV.

#### Scenario: English CV
- **WHEN** CV is written in English
- **THEN** all scores, ATS report, suggestions, and rewrites are in English

#### Scenario: Vietnamese CV
- **WHEN** CV is written in Vietnamese
- **THEN** all scores, ATS report, suggestions, and rewrites are in Vietnamese
