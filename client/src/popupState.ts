import type { EvaluateUrlResponse } from "./apiTypes";

export type PopupTone = "danger" | "warning" | "neutral" | "loading" | "error";

export interface StoredEvaluation extends EvaluateUrlResponse {
  url: string;
  checkedAt: string;
}

export interface StoredError {
  url: string;
  message: string;
  checkedAt: string;
}

export interface PopupState {
  tone: PopupTone;
  title: string;
  description: string;
}

export function buildPopupState(evaluation: StoredEvaluation | null): PopupState {
  if (evaluation === null) {
    return {
      tone: "loading",
      title: "Waiting for analysis",
      description: "Open a tab to evaluate its URL.",
    };
  }

  if (evaluation.status === "no_match") {
    return {
      tone: "neutral",
      title: "No dataset match",
      description: "The current URL did not match the configured datasets.",
    };
  }

  if (evaluation.signals.some((signal) => signal.severity === "high")) {
    return {
      tone: "danger",
      title: "Questionable URL detected",
      description: evaluation.signals[0].message,
    };
  }

  return {
    tone: "warning",
    title: "Monetization signal detected",
    description: evaluation.signals[0]?.message ?? "Review this URL before sharing.",
  };
}

export function selectActiveEvaluation(
  storedEvaluation: StoredEvaluation | null,
  currentUrl: string | null,
): StoredEvaluation | null {
  if (storedEvaluation === null || currentUrl === null) {
    return null;
  }

  return urlsMatch(storedEvaluation.url, currentUrl) ? storedEvaluation : null;
}

export function selectActiveError(
  storedError: StoredError | null,
  currentUrl: string | null,
): StoredError | null {
  if (storedError === null || currentUrl === null) {
    return null;
  }

  return urlsMatch(storedError.url, currentUrl) ? storedError : null;
}

export function isStoredError(value: unknown): value is StoredError {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    "message" in value &&
    "checkedAt" in value &&
    typeof value.url === "string" &&
    typeof value.message === "string" &&
    typeof value.checkedAt === "string"
  );
}

function urlsMatch(left: string, right: string): boolean {
  return stripTrailingSlash(left) === stripTrailingSlash(right);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
