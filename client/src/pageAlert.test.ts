import { describe, expect, it } from "vitest";

import { buildPageAlert } from "./pageAlert";
import type { EvaluateUrlResponse } from "./apiTypes";

describe("buildPageAlert", () => {
  it("returns null when the backend has no match", () => {
    expect(
      buildPageAlert(
        {
          status: "no_match",
          evaluation: {
            raw_url: "https://example.test",
            normalized_url: "example.test",
            matches: [],
          },
          normalized_url: "example.test",
          matches: [],
          signals: [],
        },
        "https://example.test",
      ),
    ).toBeNull();
  });

  it("builds a high-severity page alert for dataset matches", () => {
    const alert = buildPageAlert(
      makeResponse({
        type: "resource_dataset",
        severity: "high",
        count: 1,
        message: "Questionable content.",
      }),
      "https://zerohedge.com",
    );

    expect(alert).toEqual({
      severity: "high",
      title: "Questionable resource detected",
      message: "Questionable content.",
      url: "https://zerohedge.com",
      normalizedUrl: "zerohedge.com",
      signalTypes: ["resource_dataset"],
    });
  });

  it("builds a warning page alert for monetization-only matches", () => {
    const alert = buildPageAlert(
      makeResponse({
        type: "affiliate_url",
        severity: "warning",
        count: 1,
        message: "Presence of URLs with referral programs.",
      }),
      "https://amazon.com?tag=abc-20",
    );

    expect(alert?.severity).toBe("warning");
    expect(alert?.title).toBe("Monetization signal detected");
  });
});

function makeResponse(signal: EvaluateUrlResponse["signals"][number]): EvaluateUrlResponse {
  return {
    status: "matched",
    evaluation: {
      raw_url: "https://zerohedge.com",
      normalized_url: "zerohedge.com",
      matches: [],
    },
    normalized_url: "zerohedge.com",
    matches: [],
    signals: [signal],
  };
}
