export function buildAnalysisPrompt(cvText: string, jdText: string): string {
  return `You are an expert CV/resume reviewer and ATS (Applicant Tracking System) specialist.

Analyze the following CV against the provided Job Description. Respond ONLY with valid JSON matching the exact schema below. No markdown, no explanation outside JSON.

## CV Content:
${cvText}

## Job Description:
${jdText}

## Required JSON Response Schema:
{
  "overallScore": <number 0-100>,
  "subScores": [
    {"name": "Keyword Match", "score": <0-100>, "explanation": "<brief explanation>"},
    {"name": "Skills Alignment", "score": <0-100>, "explanation": "<brief explanation>"},
    {"name": "Experience Relevance", "score": <0-100>, "explanation": "<brief explanation>"},
    {"name": "Format & Structure", "score": <0-100>, "explanation": "<brief explanation>"},
    {"name": "Impact & Metrics", "score": <0-100>, "explanation": "<brief explanation>"}
  ],
  "atsFindings": [
    {"category": "<category name>", "status": "pass"|"warning"|"fail", "description": "<detail>"}
  ],
  "suggestions": [
    {"section": "<CV section>", "improvement": "<what to improve and why>", "impact": "high"|"medium"|"low", "originalText": "<the original text from CV that should be improved, if applicable>"}
  ]
}

## Instructions:
1. **Keyword Match**: Check what percentage of important keywords/phrases from the JD appear in the CV.
2. **Skills Alignment**: Compare required/preferred skills in JD vs skills listed in CV.
3. **Experience Relevance**: Evaluate how relevant the work experience is to the target role.
4. **Format & Structure**: Check if the CV is ATS-friendly (no tables, images, complex headers; has standard sections).
5. **Impact & Metrics**: Check if achievements include quantifiable results and metrics.

For ATS findings, check these categories:
- "Keyword Density": List important JD keywords found/missing
- "Format Compatibility": Warn about tables, images, complex formatting
- "Section Detection": Check for standard sections (Experience, Education, Skills, Summary)
- "Contact Information": Verify email, phone, LinkedIn presence
- "File Format": Note any concerns about the source format

For suggestions, order by impact (high first). Include the original CV text in "originalText" when suggesting a rewrite for a specific bullet point or section.

Detect the CV language (English or Vietnamese) and provide ALL explanations, descriptions, and suggestions in that same language.

Respond with ONLY the JSON object.`;
}

export function buildRewritePrompt(
  originalText: string,
  jdText: string,
  suggestionContext: string
): string {
  return `You are an expert CV/resume writer. Rewrite the following CV section to better match the job description.

## Original CV Text:
${originalText}

## Job Description:
${jdText}

## Improvement Context:
${suggestionContext}

## Instructions:
- Rewrite the text to be more impactful and better aligned with the job description
- Include quantifiable metrics where possible
- Use strong action verbs
- Keep the same general meaning but optimize for ATS keyword matching
- Maintain the same language as the original text (English or Vietnamese)
- Return ONLY the rewritten text, no explanations or formatting

Rewritten text:`;
}
