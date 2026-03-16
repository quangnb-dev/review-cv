import { NextResponse } from "next/server";
import { buildRewritePrompt } from "@/lib/prompts";
import { callClaude, withRetry } from "@/lib/claude";
import { MAX_TEXT_LENGTH } from "@/lib/constants";

export async function POST(request: Request) {
  let body: { originalText?: string; jdText?: string; suggestionContext?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { originalText, jdText, suggestionContext } = body;

  if (!originalText || !jdText || !suggestionContext) {
    return NextResponse.json(
      { error: "Missing required fields: originalText, jdText, suggestionContext" },
      { status: 400 }
    );
  }

  if (originalText.length > MAX_TEXT_LENGTH || jdText.length > MAX_TEXT_LENGTH || suggestionContext.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text fields must not exceed ${MAX_TEXT_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    const prompt = buildRewritePrompt(originalText, jdText, suggestionContext);
    const rewrittenText = await withRetry(() => callClaude(prompt, 1024));
    return NextResponse.json({ rewrittenText });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: "Failed to rewrite text. Please try again." },
      { status: 502 }
    );
  }
}
