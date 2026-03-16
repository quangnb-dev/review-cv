import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCallClaude } = vi.hoisted(() => ({
  mockCallClaude: vi.fn(),
}));

vi.mock("@/lib/claude", () => ({
  callClaude: mockCallClaude,
  withRetry: async <T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try { return await fn(); }
      catch (err) { lastError = err instanceof Error ? err : new Error(String(err)); }
    }
    throw lastError ?? new Error("Failed after retries");
  },
}));

// Mock pdf-parse and mammoth (dynamic imports inside the route)
vi.mock("pdf-parse/lib/pdf-parse.js", () => ({
  default: vi.fn().mockResolvedValue({ text: "Mocked PDF text" }),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: "Mocked DOCX text" }),
  },
}));

import { POST } from "../app/api/analyze/route";

const VALID_RESULT = {
  overallScore: 75,
  subScores: [
    { name: "Keyword Match", score: 80, explanation: "Good keyword coverage" },
    { name: "Skills Alignment", score: 70, explanation: "Most skills match" },
    { name: "Experience Relevance", score: 75, explanation: "Relevant experience" },
    { name: "Format & Structure", score: 65, explanation: "Needs improvement" },
    { name: "Impact & Metrics", score: 85, explanation: "Good use of metrics" },
  ],
  atsFindings: [
    { category: "Keyword Density", status: "pass", description: "Good keyword match" },
  ],
  suggestions: [
    { section: "Skills", improvement: "Add Docker", impact: "high" },
  ],
};

function makeRequest(formData: FormData): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    mockCallClaude.mockReset();
  });

  it("returns 400 when jdText is missing", async () => {
    const fd = new FormData();
    fd.append("cvText", "Some CV content");

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/jdText/i);
  });

  it("returns 400 when neither file nor cvText is provided", async () => {
    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/file|cvText/i);
  });

  it("returns 400 when file exceeds 5MB", async () => {
    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");

    const largeContent = new Uint8Array(6 * 1024 * 1024);
    const oversizedFile = new File([largeContent], "cv.pdf", { type: "application/pdf" });
    fd.append("file", oversizedFile);

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/5MB/i);
  });

  it("returns 400 when file type is unsupported", async () => {
    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");

    const txtFile = new File(["plain text content"], "cv.txt", { type: "text/plain" });
    fd.append("file", txtFile);

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/PDF|DOCX/i);
  });

  it("successfully processes text CV input", async () => {
    mockCallClaude.mockResolvedValueOnce(JSON.stringify(VALID_RESULT));

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer with Docker experience.");
    fd.append("cvText", "Experienced developer with Node.js and TypeScript skills.");

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overallScore).toBe(75);
    expect(body.subScores).toHaveLength(5);
    expect(body.atsFindings).toHaveLength(1);
    expect(body.suggestions).toHaveLength(1);
    expect(mockCallClaude).toHaveBeenCalledOnce();
  });

  it("returns 502 when Claude API fails after retries", async () => {
    mockCallClaude.mockRejectedValue(new Error("Service unavailable"));

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    fd.append("cvText", "Experienced developer with Node.js skills.");

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(502);
    // analyzeWithRetry retries up to maxRetries=2, so callClaude is called 3 times total
    expect(mockCallClaude).toHaveBeenCalledTimes(3);
  });

  it("successfully processes PDF file upload", async () => {
    mockCallClaude.mockResolvedValueOnce(JSON.stringify(VALID_RESULT));

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    const pdfFile = new File(["fake pdf content"], "cv.pdf", { type: "application/pdf" });
    fd.append("file", pdfFile);

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overallScore).toBe(75);
    expect(mockCallClaude).toHaveBeenCalledOnce();
  });

  it("successfully processes DOCX file upload", async () => {
    mockCallClaude.mockResolvedValueOnce(JSON.stringify(VALID_RESULT));

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    const docxFile = new File(["fake docx content"], "cv.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fd.append("file", docxFile);

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overallScore).toBe(75);
    expect(mockCallClaude).toHaveBeenCalledOnce();
  });

  it("returns 422 when PDF parsing fails", async () => {
    const pdfParse = await import("pdf-parse/lib/pdf-parse.js");
    (pdfParse.default as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Corrupt PDF"));

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    const pdfFile = new File(["corrupt"], "cv.pdf", { type: "application/pdf" });
    fd.append("file", pdfFile);

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toMatch(/extract text/i);
  });

  it("returns 422 when DOCX parsing fails", async () => {
    const mammoth = await import("mammoth");
    (mammoth.default.extractRawText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Corrupt DOCX")
    );

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    const docxFile = new File(["corrupt"], "cv.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fd.append("file", docxFile);

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toMatch(/extract text/i);
  });

  it("returns 200 when first attempt fails but retry succeeds", async () => {
    mockCallClaude
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(JSON.stringify(VALID_RESULT));

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    fd.append("cvText", "Experienced developer with Node.js skills.");

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overallScore).toBe(75);
    expect(mockCallClaude).toHaveBeenCalledTimes(2);
  });

  it("returns 502 when Claude returns non-JSON text", async () => {
    mockCallClaude.mockResolvedValue("Sorry, I cannot help with that.");

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    fd.append("cvText", "Experienced developer with Node.js skills.");

    const res = await POST(makeRequest(fd));

    expect(res.status).toBe(502);
    expect(mockCallClaude).toHaveBeenCalledTimes(3);
  });

  it("returns 502 when Claude returns invalid schema", async () => {
    mockCallClaude.mockResolvedValue('{"overallScore": "not-a-number"}');

    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    fd.append("cvText", "Experienced developer with Node.js skills.");

    const res = await POST(makeRequest(fd));

    expect(res.status).toBe(502);
    expect(mockCallClaude).toHaveBeenCalledTimes(3);
  });

  it("includes language detection instruction in analysis prompt", async () => {
    mockCallClaude.mockResolvedValueOnce(JSON.stringify(VALID_RESULT));

    const fd = new FormData();
    fd.append("jdText", "Tuyển lập trình viên React.");
    fd.append("cvText", "Lập trình viên có 5 năm kinh nghiệm.");

    await POST(makeRequest(fd));

    const promptArg = mockCallClaude.mock.calls[0][0] as string;
    expect(promptArg).toContain("Detect the CV language");
  });

  it("returns 400 when cvText exceeds MAX_TEXT_LENGTH", async () => {
    const fd = new FormData();
    fd.append("jdText", "We are looking for a software engineer.");
    fd.append("cvText", "a".repeat(50_001));

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/characters/i);
  });

  it("returns 400 when jdText exceeds MAX_TEXT_LENGTH", async () => {
    const fd = new FormData();
    fd.append("jdText", "a".repeat(50_001));
    fd.append("cvText", "Experienced developer with Node.js skills.");

    const res = await POST(makeRequest(fd));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/characters/i);
  });
});
