export function buildAnalysisPrompt(cvText: string, jdText: string): string {
  return `You are an expert CV/resume reviewer and ATS (Applicant Tracking System) specialist with deep knowledge of how real ATS systems (Workday, Greenhouse, Lever, iCIMS, Taleo) parse and rank resumes.

Analyze the following CV against the provided Job Description. Respond ONLY with a raw JSON object. CRITICAL: Do NOT wrap in markdown code fences (\`\`\`). Do NOT add any text before or after the JSON.

For "explanation" and "description" fields: be specific and actionable. Use compact format like "Matched: X, Y, Z. Missing: A, B, C" instead of full sentences. No filler phrases. Maximum 2-3 short sentences per field.

For "suggestions": limit to top 5 most impactful suggestions only. Each "improvement" field should be 1-2 sentences max.

## CV Content:
${cvText}

## Job Description:
${jdText}

## Required JSON Response Schema:
{
  "overallScore": <number 0-100, weighted: Keywords 40% + Experience 25% + Structure 10% + Education 10% + Recency 10% + Soft Skills 5%>,
  "subScores": [
    {"name": "Hard Skills Match", "score": <0-100>, "explanation": "<list matched/missing hard skills: tools, technologies, certifications>"},
    {"name": "Soft Skills Match", "score": <0-100>, "explanation": "<list matched/missing soft skills: leadership, communication, etc>"},
    {"name": "Experience Relevance", "score": <0-100>, "explanation": "<how relevant is work history to the role, consider seniority level match>"},
    {"name": "Keyword Optimization", "score": <0-100>, "explanation": "<keyword density, placement in high-visibility sections, semantic variations>"},
    {"name": "Impact & Metrics", "score": <0-100>, "explanation": "<quantified achievements, action verbs, measurable results>"},
    {"name": "Format & ATS Compatibility", "score": <0-100>, "explanation": "<parseable structure, standard sections, date formats, no tables/images>"}
  ],
  "atsFindings": [
    {"category": "<category name>", "status": "pass"|"warning"|"fail", "description": "<detail>"}
  ],
  "suggestions": [
    {"section": "<CV section>", "improvement": "<what to improve and why>", "impact": "high"|"medium"|"low", "originalText": "<the original text from CV that should be improved, if applicable>"}
  ]
}

## Scoring Instructions:

### 1. Hard Skills Match (weight: high)
- Extract ALL hard skills from JD (tools, technologies, programming languages, frameworks, certifications, methodologies)
- Check EXACT matches first, then SEMANTIC matches (e.g., "Python development" matches "Python programming")
- Differentiate between REQUIRED vs PREFERRED/NICE-TO-HAVE skills from JD
- Missing a required hard skill = major penalty; missing preferred = minor penalty
- List specific matched and missing skills in explanation

### 2. Soft Skills Match (weight: low)
- Extract soft skills from JD (leadership, teamwork, communication, problem-solving, etc.)
- Check if CV demonstrates these through descriptions, not just lists
- ATS systems weight soft skills at ~5% — don't over-penalize

### 3. Experience Relevance (weight: high)
- Does the job title progression align with the target role?
- Is the years of experience appropriate for the seniority level?
- Are the industries/domains relevant?
- Recency matters: recent relevant experience scores higher than old experience

### 4. Keyword Optimization (weight: highest)
- Real ATS systems weight keyword placement: Summary/Title > Skills section > Experience bullets > Education
- Check keyword DENSITY — are important terms repeated naturally across sections?
- Check for SEMANTIC VARIATIONS (e.g., JD says "project management" — does CV also mention "scrum", "agile", "stakeholder management"?)
- Target: 70-80% keyword alignment = good score
- Flag important JD keywords completely absent from CV

### 5. Impact & Metrics
- Check for quantifiable results (%, $, numbers, timeframes)
- Check for strong action verbs (Led, Developed, Increased, Reduced, Implemented)
- Generic duties ("Responsible for...") = low score; specific achievements = high score
- Each bullet point should follow: Action Verb + Task + Result/Impact format

### 6. Format & ATS Compatibility
- Standard section headers: Summary/Objective, Experience, Education, Skills, Certifications
- Consistent date format (MM/YYYY or Month YYYY)
- No tables, text boxes, images, columns, headers/footers (ATS can't parse these)
- Standard fonts (Arial, Calibri, Times New Roman)
- Contact info: email, phone, LinkedIn — all present and parseable?
- File format concerns from the source

### ATS Findings — check ALL of these:
- "Hard Skills Gap": List specific required skills from JD missing in CV
- "Keyword Density": Important JD keywords found vs missing, with placement quality
- "Section Headers": Are standard ATS-parseable section names used?
- "Contact Information": Email, phone, LinkedIn — present and correctly formatted?
- "Date Formatting": Consistent, parseable date formats?
- "Format Compatibility": Tables, images, columns, special characters that break ATS parsing?
- "Job Title Alignment": Does CV job title match or relate to target role title?
- "Education & Certifications": Required qualifications present?

Only include findings with status "warning" or "fail". Skip all "pass" findings to keep response compact.

### Suggestions:
- Order by impact (high first)
- For each suggestion, be SPECIFIC: don't say "add more keywords" — say WHICH keywords to add and WHERE
- Include "originalText" when suggesting a rewrite for a specific bullet point or paragraph
- Focus on changes that will have the biggest impact on ATS score and recruiter impression

### Overall Score Calculation:
Use weighted formula reflecting real ATS behavior:
- Keywords/Skills Match: 40% (hard skills + keyword optimization combined)
- Experience Relevance: 25%
- Format & Structure: 10%
- Education/Certifications: 10%
- Recency & Seniority fit: 10%
- Soft Skills: 5%

Detect the CV language (English or Vietnamese) and provide ALL explanations, descriptions, and suggestions in that same language.

IMPORTANT: Output raw JSON only. No \`\`\`json fences. No text before/after.`;
}

export function buildRewritePrompt(
  originalText: string,
  jdText: string,
  suggestionContext: string
): string {
  return `You are an expert CV/resume writer who understands how ATS systems parse and rank resumes.

## Original CV Text:
${originalText}

## Job Description:
${jdText}

## Improvement Context:
${suggestionContext}

## Instructions:
- Rewrite the text to maximize both ATS score and recruiter impression
- Naturally incorporate relevant keywords from the JD (exact terms the ATS will scan for)
- Use strong action verbs: Led, Developed, Implemented, Increased, Reduced, Optimized, Delivered
- Follow the format: Action Verb + What You Did + Measurable Result (e.g., "Reduced deployment time by 40% by implementing CI/CD pipeline")
- Add quantifiable metrics where possible (%, $, numbers, timeframes)
- Replace generic duties ("Responsible for...") with specific achievements
- Keep the same general meaning and scope — don't fabricate experience
- Maintain the same language as the original text (English or Vietnamese)
- Return ONLY the rewritten text, no explanations or formatting

Rewritten text:`;
}
