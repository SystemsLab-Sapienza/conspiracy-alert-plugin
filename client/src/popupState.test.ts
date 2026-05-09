import { describe, expect, it } from "vitest";

import {
  buildPopupState,
  selectActiveError,
  selectActiveEvaluation,
  type StoredError,
  type StoredEvaluation,
} from "./popupState";

describe("buildPopupState", () => {
  it("shows high severity matches as questionable", () => {
    const state = buildPopupState({
      url: "https://zerohedge.com",
      checkedAt: "2026-05-09T08:00:00.000Z",
      status: "matched",
      evaluation: {
        raw_url: "https://zerohedge.com",
        normalized_url: "zerohedge.com",
        matches: [],
      },
      normalized_url: "zerohedge.com",
      matches: [],
      signals: [
        {
          type: "known_conspiracy_url",
          severity: "high",
          count: 1,
          message: "Questionable URL.",
        },
      ],
    });

    expect(state.tone).toBe("danger");
    expect(state.title).toBe("Questionable URL detected");
  });

  it("shows no-match results neutrally", () => {
    const state = buildPopupState({
      url: "https://example.test",
      checkedAt: "2026-05-09T08:00:00.000Z",
      status: "no_match",
      evaluation: {
        raw_url: "https://example.test",
        normalized_url: "example.test",
        matches: [],
      },
      normalized_url: "example.test",
      matches: [],
      signals: [],
    });

    expect(state.tone).toBe("neutral");
    expect(state.title).toBe("No dataset match");
  });
});

describe("active popup storage selectors", () => {
  it("selects the stored evaluation only when it belongs to the active tab", () => {
    const evaluation = makeEvaluation("https://example.test/report/");

    expect(selectActiveEvaluation(evaluation, "https://example.test/report")).toBe(evaluation);
    expect(selectActiveEvaluation(evaluation, "https://other.test/report")).toBeNull();
  });

  it("selects backend errors only when they belong to the active tab", () => {
    const error: StoredError = {
      url: "https://example.test/report",
      message: "Backend unavailable",
      checkedAt: "2026-05-09T08:00:00.000Z",
    };

    expect(selectActiveError(error, "https://example.test/report/")).toBe(error);
    expect(selectActiveError(error, "https://other.test/report")).toBeNull();
  });
});

function makeEvaluation(url: string): StoredEvaluation {
  return {
    url,
    checkedAt: "2026-05-09T08:00:00.000Z",
    status: "no_match",
    evaluation: {
      raw_url: url,
      normalized_url: "example.test/report",
      matches: [],
    },
    normalized_url: "example.test/report",
    matches: [],
    signals: [],
  };
}
