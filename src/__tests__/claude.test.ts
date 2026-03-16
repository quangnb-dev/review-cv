import { describe, it, expect, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

import { callClaude, withRetry } from "@/lib/claude";

describe("callClaude", () => {
  it("returns text content from Claude response", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "Hello world" }],
    });

    const result = await callClaude("test prompt");
    expect(result).toBe("Hello world");
  });

  it("throws when response content is not text type", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "image", source: {} }],
    });

    await expect(callClaude("test prompt")).rejects.toThrow("Unexpected response type from Claude");
  });

  it("passes maxTokens to the API call", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "result" }],
    });

    await callClaude("test prompt", 1024);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 1024 })
    );
  });
});

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValueOnce("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("retries on failure and returns on success", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));
    await expect(withRetry(fn, 2)).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
