import {
  EVALUATE_URL_MESSAGE,
  HIDE_PAGE_ALERT_MESSAGE,
  SHOW_PAGE_ALERT_MESSAGE,
  isHttpUrl,
  isPageAlertMessage,
  type PageAlertMessage,
} from "./messages";
import type { PageAlert } from "./pageAlert";

const HOST_ID = "conspiracy-alert-banner-host";

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isPageAlertMessage(message)) {
    return false;
  }

  handlePageAlertMessage(message);
  return false;
});

requestCurrentPageEvaluation();

function requestCurrentPageEvaluation(): void {
  const url = window.location.href;
  if (!isHttpUrl(url)) {
    return;
  }

  chrome.runtime.sendMessage({ type: EVALUATE_URL_MESSAGE, url, source: "automatic" }, () => {
    void chrome.runtime.lastError;
  });
}

function handlePageAlertMessage(message: PageAlertMessage): void {
  if (message.type === HIDE_PAGE_ALERT_MESSAGE) {
    removeAlert();
    return;
  }

  if (message.type === SHOW_PAGE_ALERT_MESSAGE) {
    renderAlert(message.alert);
  }
}

function renderAlert(alert: PageAlert): void {
  const host = ensureHost();
  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  root.replaceChildren(buildAlertElement(alert));
}

function buildAlertElement(alert: PageAlert): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("role", "status");
  wrapper.innerHTML = `
    <style>
      :host {
        all: initial;
      }

      .banner {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: min(360px, calc(100vw - 32px));
        border: 1px solid ${alert.severity === "high" ? "#fecaca" : "#fde68a"};
        border-left: 4px solid ${alert.severity === "high" ? "#b91c1c" : "#d97706"};
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
        color: #0f172a;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }

      .content {
        padding: 12px 12px 10px;
      }

      .topline {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 12px;
      }

      .title {
        font-weight: 700;
      }

      .close {
        appearance: none;
        border: 0;
        background: transparent;
        color: #475569;
        cursor: pointer;
        font: inherit;
        line-height: 1;
        padding: 2px 4px;
      }

      .message {
        margin-top: 6px;
        color: #334155;
      }

      .url {
        margin-top: 8px;
        overflow-wrap: anywhere;
        color: #64748b;
        font-size: 12px;
      }

      .signals {
        margin-top: 8px;
        color: #64748b;
        font-size: 12px;
      }
    </style>
    <aside class="banner">
      <div class="content">
        <div class="topline">
          <div class="title"></div>
          <button class="close" type="button" aria-label="Dismiss Conspiracy Alert">x</button>
        </div>
        <div class="message"></div>
        <div class="url"></div>
        <div class="signals"></div>
      </div>
    </aside>
  `;

  wrapper.querySelector(".title")!.textContent = alert.title;
  wrapper.querySelector(".message")!.textContent = alert.message;
  wrapper.querySelector(".url")!.textContent = alert.normalizedUrl;
  wrapper.querySelector(".signals")!.textContent = alert.signalTypes.join(", ");
  wrapper.querySelector(".close")!.addEventListener("click", removeAlert);

  return wrapper;
}

function ensureHost(): HTMLElement {
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    return existing;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.documentElement.append(host);
  return host;
}

function removeAlert(): void {
  document.getElementById(HOST_ID)?.remove();
}
