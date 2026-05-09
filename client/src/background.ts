import { evaluateUrl } from "./backendClient";
import {
  HIDE_PAGE_ALERT_MESSAGE,
  SHOW_PAGE_ALERT_MESSAGE,
  isEvaluateUrlMessage,
  type EvaluateUrlMessageResponse,
  type PageAlertMessage,
} from "./messages";
import { buildPageAlert } from "./pageAlert";
import type { StoredError, StoredEvaluation } from "./popupState";
import { getExtensionSettings } from "./settings";

const STORAGE_KEY = "lastEvaluation";
const ERROR_KEY = "lastError";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isEvaluateUrlMessage(message)) {
    return false;
  }

  const tabId = message.tabId ?? sender.tab?.id;
  void checkTabUrl(message.url, tabId, message.source ?? "manual").then(() => {
    const response: EvaluateUrlMessageResponse = { ok: true };
    sendResponse(response);
  });
  return true;
});

async function checkTabUrl(
  url: string,
  tabId: number | undefined,
  source: "automatic" | "manual",
): Promise<void> {
  try {
    const settings = await getExtensionSettings();
    if (source === "automatic" && !settings.automaticChecksEnabled) {
      setBadge(tabId, "", "#b91c1c");
      sendPageAlert(tabId, null);
      return;
    }

    const evaluation = await evaluateUrl(url, { apiBaseUrl: settings.apiBaseUrl });
    const stored: StoredEvaluation = {
      ...evaluation,
      url,
      checkedAt: new Date().toISOString(),
    };

    await setLocalStorage({ [STORAGE_KEY]: stored, [ERROR_KEY]: null });
    setBadge(tabId, evaluation.status === "matched" ? "!" : "", "#b91c1c");
    sendPageAlert(tabId, buildPageAlert(evaluation, url));
  } catch (error) {
    const storedError: StoredError = {
      url,
      message: error instanceof Error ? error.message : "Unknown backend error",
      checkedAt: new Date().toISOString(),
    };
    await setLocalStorage({
      [ERROR_KEY]: storedError,
    });
    setBadge(tabId, "?", "#92400e");
    sendPageAlert(tabId, null);
  }
}

function setLocalStorage(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => resolve());
  });
}

function setBadge(tabId: number | undefined, text: string, color: string): void {
  const target = tabId === undefined ? {} : { tabId };
  chrome.action.setBadgeText({ ...target, text });
  chrome.action.setBadgeBackgroundColor({ ...target, color });
}

function sendPageAlert(tabId: number | undefined, alert: ReturnType<typeof buildPageAlert>): void {
  if (tabId === undefined) {
    return;
  }

  const message: PageAlertMessage =
    alert === null
      ? { type: HIDE_PAGE_ALERT_MESSAGE }
      : { type: SHOW_PAGE_ALERT_MESSAGE, alert };

  chrome.tabs.sendMessage(tabId, message, () => {
    void chrome.runtime.lastError;
  });
}
