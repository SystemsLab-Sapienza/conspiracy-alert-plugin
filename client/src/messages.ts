import type { PageAlert } from "./pageAlert";

export const EVALUATE_URL_MESSAGE = "evaluate-url";
export const SHOW_PAGE_ALERT_MESSAGE = "show-page-alert";
export const HIDE_PAGE_ALERT_MESSAGE = "hide-page-alert";

export interface EvaluateUrlMessage {
  type: typeof EVALUATE_URL_MESSAGE;
  url: string;
  tabId?: number;
  source?: "automatic" | "manual";
}

export interface EvaluateUrlMessageResponse {
  ok: boolean;
}

export interface ShowPageAlertMessage {
  type: typeof SHOW_PAGE_ALERT_MESSAGE;
  alert: PageAlert;
}

export interface HidePageAlertMessage {
  type: typeof HIDE_PAGE_ALERT_MESSAGE;
}

export type PageAlertMessage = ShowPageAlertMessage | HidePageAlertMessage;

export function isEvaluateUrlMessage(value: unknown): value is EvaluateUrlMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "url" in value &&
    value.type === EVALUATE_URL_MESSAGE &&
    typeof value.url === "string" &&
    isHttpUrl(value.url) &&
    hasValidOptionalTabId(value as Record<string, unknown>) &&
    hasValidOptionalSource(value as Record<string, unknown>)
  );
}

export function isPageAlertMessage(value: unknown): value is PageAlertMessage {
  if (!isRecord(value) || typeof value["type"] !== "string") {
    return false;
  }

  if (value["type"] === HIDE_PAGE_ALERT_MESSAGE) {
    return true;
  }

  return value["type"] === SHOW_PAGE_ALERT_MESSAGE && isPageAlert(value["alert"]);
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasValidOptionalTabId(value: Record<string, unknown>): boolean {
  const tabId = value["tabId"];
  return (
    tabId === undefined || (typeof tabId === "number" && Number.isInteger(tabId) && tabId >= 0)
  );
}

function hasValidOptionalSource(value: Record<string, unknown>): boolean {
  const source = value["source"];
  return source === undefined || source === "automatic" || source === "manual";
}

function isPageAlert(value: unknown): value is PageAlert {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value["severity"] === "high" || value["severity"] === "warning") &&
    typeof value["title"] === "string" &&
    typeof value["message"] === "string" &&
    typeof value["url"] === "string" &&
    typeof value["normalizedUrl"] === "string" &&
    Array.isArray(value["signalTypes"]) &&
    value["signalTypes"].every((signalType) => typeof signalType === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
