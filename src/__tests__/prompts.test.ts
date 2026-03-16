import { describe, it, expect } from "vitest";
import { buildAnalysisPrompt, buildRewritePrompt } from "@/lib/prompts";

describe("buildAnalysisPrompt", () => {
  const cvText = "Experienced software engineer with 5 years in React and Node.js";
  const jdText = "Looking for a senior frontend engineer with React expertise";

  it("includes CV text in output", () => {
    const prompt = buildAnalysisPrompt(cvText, jdText);
    expect(prompt).toContain(cvText);
  });

  it("includes JD text in output", () => {
    const prompt = buildAnalysisPrompt(cvText, jdText);
    expect(prompt).toContain(jdText);
  });

  it("includes JSON schema instructions", () => {
    const prompt = buildAnalysisPrompt(cvText, jdText);
    expect(prompt).toContain("overallScore");
    expect(prompt).toContain("subScores");
    expect(prompt).toContain("atsFindings");
    expect(prompt).toContain("suggestions");
    expect(prompt).toContain("Respond ONLY with valid JSON");
  });
});

describe("buildRewritePrompt", () => {
  const originalText = "Worked on frontend features";
  const jdText = "Senior React developer needed with performance optimization skills";
  const suggestionContext = "Add metrics and use stronger action verbs";

  it("includes original text in output", () => {
    const prompt = buildRewritePrompt(originalText, jdText, suggestionContext);
    expect(prompt).toContain(originalText);
  });

  it("includes JD text in output", () => {
    const prompt = buildRewritePrompt(originalText, jdText, suggestionContext);
    expect(prompt).toContain(jdText);
  });

  it("includes suggestion context in output", () => {
    const prompt = buildRewritePrompt(originalText, jdText, suggestionContext);
    expect(prompt).toContain(suggestionContext);
  });

  it("includes rewrite instructions", () => {
    const prompt = buildRewritePrompt(originalText, jdText, suggestionContext);
    expect(prompt).toContain("Rewrite the text to maximize both ATS score and recruiter impression");
    expect(prompt).toContain("Return ONLY the rewritten text, no explanations or formatting");
  });
});
