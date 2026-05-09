import { describe, expect, it, vi } from "vitest";

import { evaluateUrl } from "./backendClient";

describe("evaluateUrl", () => {
  it("posts to the backend evaluate-url endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "matched",
        evaluation: {
          raw_url: "https://zerohedge.com/covid-19/example",
          normalized_url: "zerohedge.com/covid-19/example",
          matches: [],
        },
        normalized_url: "zerohedge.com/covid-19/example",
        matches: [],
        signals: [
          {
            type: "known_conspiracy_url",
            severity: "high",
            count: 1,
            message: "Questionable URL.",
          },
        ],
      }),
    });

    const result = await evaluateUrl("https://zerohedge.com/covid-19/example", {
      apiBaseUrl: "http://127.0.0.1:8000",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/evaluate-url",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ url: "https://zerohedge.com/covid-19/example" }),
      }),
    );
    expect(result.status).toBe("matched");
    expect(result.signals[0].type).toBe("known_conspiracy_url");
  });

  it("raises a useful error when the backend rejects the request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Down" });

    await expect(evaluateUrl("https://example.test", { fetchImpl })).rejects.toThrow(
      "Channel Checker backend returned 503 Down",
    );
  });
});
