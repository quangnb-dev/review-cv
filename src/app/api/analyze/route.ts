import { NextResponse } from "next/server";
import { buildAnalysisPrompt } from "@/lib/prompts";
import { callClaude, withRetry } from "@/lib/claude";
import { MAX_FILE_SIZE_BYTES, MAX_TEXT_LENGTH, ALLOWED_MIME_TYPES } from "@/lib/constants";
import type { AnalysisResult } from "@/types";

// pdf-parse and mammoth are CJS modules — dynamic import for compatibility
// Note: pdf-parse/lib/pdf-parse.js is used directly to avoid the top-level
// test file read in pdf-parse/index.js that crashes in bundled environments.
async function parsePDF(buffer: Buffer): Promise<string> {
  const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const data = await pdf(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return parsePDF(buffer);
  }
  return parseDOCX(buffer);
}

function isValidAnalysisResult(obj: unknown): obj is AnalysisResult {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;

  if (typeof r.overallScore !== "number") return false;
  if (!Array.isArray(r.subScores)) return false;
  if (!Array.isArray(r.atsFindings)) return false;
  if (!Array.isArray(r.suggestions)) return false;

  for (const s of r.subScores as unknown[]) {
    const sub = s as Record<string, unknown>;
    if (typeof sub.name !== "string" || typeof sub.score !== "number" || typeof sub.explanation !== "string") return false;
  }

  for (const a of r.atsFindings as unknown[]) {
    const finding = a as Record<string, unknown>;
    if (typeof finding.category !== "string" || !["pass", "warning", "fail"].includes(finding.status as string) || typeof finding.description !== "string") return false;
  }

  for (const sug of r.suggestions as unknown[]) {
    const suggestion = sug as Record<string, unknown>;
    if (typeof suggestion.section !== "string" || typeof suggestion.improvement !== "string" || !["high", "medium", "low"].includes(suggestion.impact as string)) return false;
  }

  return true;
}

async function analyzeWithRetry(prompt: string): Promise<AnalysisResult> {
  return withRetry(async () => {
    const text = await callClaude(prompt, 16384);

    // Strip markdown code fences if Claude wraps the JSON
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Claude returned invalid JSON:", text.slice(0, 500));
      throw new Error("Claude returned invalid JSON");
    }

    if (!isValidAnalysisResult(parsed)) {
      console.error("Schema validation failed:", JSON.stringify(parsed).slice(0, 500));
      throw new Error("Claude response does not match expected schema");
    }

    return parsed;
  });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const jdText = formData.get("jdText");
  if (!jdText || typeof jdText !== "string" || jdText.trim() === "") {
    return NextResponse.json({ error: "jdText is required and must not be empty" }, { status: 400 });
  }

  let cvText: string | null = null;

  const file = formData.get("file");
  if (file && file instanceof File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      cvText = await extractTextFromFile(buffer, file.type);
    } catch (err) {
      console.error("File extraction error:", err);
      return NextResponse.json({ error: "Failed to extract text from file" }, { status: 422 });
    }
  }

  if (!cvText) {
    const rawCvText = formData.get("cvText");
    if (rawCvText && typeof rawCvText === "string" && rawCvText.trim() !== "") {
      cvText = rawCvText;
    }
  }

  if (!cvText || cvText.trim() === "") {
    return NextResponse.json({ error: "Either a file or cvText must be provided" }, { status: 400 });
  }

  if (cvText.length > MAX_TEXT_LENGTH || jdText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text fields must not exceed ${MAX_TEXT_LENGTH} characters` },
      { status: 400 }
    );
  }

  const prompt = buildAnalysisPrompt(cvText, jdText);

  let result: AnalysisResult;
  try {
    result = await analyzeWithRetry(prompt);
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 502 });
  }

  return NextResponse.json(result);
}
