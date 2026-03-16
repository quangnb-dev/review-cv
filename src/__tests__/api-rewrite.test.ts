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

import { POST } from "../app/api/rewrite/route";

function makeRequest(body: unknown, options: { invalidJson?: boolean } = {}): Request {
  if (options.invalidJson) {
    return new Request("http://localhost/api/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-valid-json{{{",
    });
  }
  return new Request("http://localhost/api/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/rewrite", () => {
  beforeEach(() => {
    mockCallClaude.mockReset();
  });

  it("returns 400 when body is invalid JSON", async () => {
    const response = await POST(makeRequest(null, { invalidJson: true }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/invalid json/i);
  });

  it("returns 400 when required fields are missing", async () => {
    const cases = [
      {},
      { originalText: "text" },
      { jdText: "jd" },
      { suggestionContext: "ctx" },
      { originalText: "text", jdText: "jd" },
      { originalText: "text", suggestionContext: "ctx" },
      { jdText: "jd", suggestionContext: "ctx" },
    ];

    for (const body of cases) {
      const response = await POST(makeRequest(body));
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/missing required fields/i);
    }
  });

  it("returns rewritten text on success", async () => {
    mockCallClaude.mockResolvedValue("Improved CV bullet point with metrics");

    const response = await POST(
      makeRequest({
        originalText: "Worked on features",
        jdText: "Senior React developer",
        suggestionContext: "Add metrics",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.rewrittenText).toBe("Improved CV bullet point with metrics");
  });

  it("returns 502 when Claude API fails after retries", async () => {
    mockCallClaude.mockRejectedValue(new Error("Service unavailable"));

    const response = await POST(
      makeRequest({
        originalText: "Worked on features",
        jdText: "Senior React developer",
        suggestionContext: "Add metrics",
      })
    );

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toMatch(/failed to rewrite/i);
    // rewriteWithRetry retries up to maxRetries=2, so callClaude is called 3 times total
    expect(mockCallClaude).toHaveBeenCalledTimes(3);
  });

  it("returns 200 when first attempt fails but retry succeeds", async () => {
    mockCallClaude
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("Improved text after retry");

    const response = await POST(
      makeRequest({
        originalText: "Worked on features",
        jdText: "Senior React developer",
        suggestionContext: "Add metrics",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.rewrittenText).toBe("Improved text after retry");
    expect(mockCallClaude).toHaveBeenCalledTimes(2);
  });
});
