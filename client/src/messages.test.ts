import { describe, expect, it } from "vitest";

import {
  EVALUATE_URL_MESSAGE,
  HIDE_PAGE_ALERT_MESSAGE,
  SHOW_PAGE_ALERT_MESSAGE,
  isEvaluateUrlMessage,
  isPageAlertMessage,
} from "./messages";

describe("extension messages", () => {
  it("accepts evaluate-url messages with an http URL", () => {
    expect(
      isEvaluateUrlMessage({
        type: EVALUATE_URL_MESSAGE,
        url: "https://example.test/report",
        tabId: 12,
        source: "automatic",
      }),
    ).toBe(true);
    expect(
      isEvaluateUrlMessage({
        type: EVALUATE_URL_MESSAGE,
        url: "https://example.test/report",
        source: "manual",
      }),
    ).toBe(true);
  });

  it("rejects malformed evaluate-url messages", () => {
    expect(isEvaluateUrlMessage({ type: EVALUATE_URL_MESSAGE, url: "chrome://extensions" })).toBe(
      false,
    );
    expect(
      isEvaluateUrlMessage({
        type: EVALUATE_URL_MESSAGE,
        url: "https://example.test",
        tabId: -1,
      }),
    ).toBe(false);
    expect(
      isEvaluateUrlMessage({
        type: EVALUATE_URL_MESSAGE,
        url: "https://example.test",
        source: "timer",
      }),
    ).toBe(false);
    expect(isEvaluateUrlMessage({ type: "unknown", url: "https://example.test" })).toBe(false);
  });
});

describe("page alert messages", () => {
  it("accepts show and hide page-alert messages", () => {
    expect(
      isPageAlertMessage({
        type: SHOW_PAGE_ALERT_MESSAGE,
        alert: {
          severity: "high",
          title: "Questionable resource detected",
          message: "Questionable content.",
          url: "https://example.test",
          normalizedUrl: "example.test",
          signalTypes: ["resource_dataset"],
        },
      }),
    ).toBe(true);

    expect(isPageAlertMessage({ type: HIDE_PAGE_ALERT_MESSAGE })).toBe(true);
  });

  it("rejects malformed page-alert messages", () => {
    expect(isPageAlertMessage({ type: SHOW_PAGE_ALERT_MESSAGE })).toBe(false);
    expect(
      isPageAlertMessage({
        type: SHOW_PAGE_ALERT_MESSAGE,
        alert: {
          severity: "critical",
          title: "Bad",
          message: "Bad",
          url: "https://example.test",
          normalizedUrl: "example.test",
          signalTypes: [],
        },
      }),
    ).toBe(false);
  });
});
