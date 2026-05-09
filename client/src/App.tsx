import React, { useEffect, useMemo, useState } from "react";

import logo from "./logo.png";
import { EVALUATE_URL_MESSAGE, isHttpUrl, type EvaluateUrlMessage } from "./messages";
import {
  buildPopupState,
  isStoredError,
  selectActiveError,
  selectActiveEvaluation,
  type PopupTone,
  type StoredError,
  type StoredEvaluation,
} from "./popupState";

const STORAGE_KEY = "lastEvaluation";
const ERROR_KEY = "lastError";

const toneClasses: Record<PopupTone, string> = {
  danger: "border-red-200 bg-red-50 text-red-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  neutral: "border-slate-200 bg-slate-50 text-slate-950",
  loading: "border-sky-200 bg-sky-50 text-sky-950",
  error: "border-amber-300 bg-amber-50 text-amber-950",
};

function App() {
  const [storedEvaluation, setStoredEvaluation] = useState<StoredEvaluation | null>(null);
  const [storedError, setStoredError] = useState<StoredError | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY, ERROR_KEY], (result) => {
      setStoredEvaluation((result[STORAGE_KEY] as StoredEvaluation | undefined) ?? null);
      setStoredError(isStoredError(result[ERROR_KEY]) ? result[ERROR_KEY] : null);
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== "local") {
        return;
      }
      if (changes[STORAGE_KEY]) {
        setStoredEvaluation((changes[STORAGE_KEY].newValue as StoredEvaluation | undefined) ?? null);
      }
      if (changes[ERROR_KEY]) {
        const newError = changes[ERROR_KEY].newValue;
        setStoredError(isStoredError(newError) ? newError : null);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      setCurrentUrl(activeTab?.url ?? null);
      setCurrentTabId(activeTab?.id ?? null);
    });
  }, []);

  const activeEvaluation = useMemo(() => {
    return selectActiveEvaluation(storedEvaluation, currentUrl);
  }, [storedEvaluation, currentUrl]);

  const activeError = useMemo(() => {
    return selectActiveError(storedError, currentUrl);
  }, [storedError, currentUrl]);

  const state = useMemo(() => {
    if (activeError) {
      return {
        tone: "error" as const,
        title: "Backend unavailable",
        description: activeError.message,
      };
    }
    return buildPopupState(activeEvaluation);
  }, [activeEvaluation, activeError]);

  const displayUrl = activeEvaluation?.normalized_url ?? currentUrl ?? "No active tab URL";
  const canCheckCurrentUrl = currentUrl !== null && isHttpUrl(currentUrl);

  function handleCheckNow(): void {
    if (!canCheckCurrentUrl || currentUrl === null) {
      return;
    }

    const message: EvaluateUrlMessage = {
      type: EVALUATE_URL_MESSAGE,
      url: currentUrl,
      source: "manual",
      ...(currentTabId === null ? {} : { tabId: currentTabId }),
    };
    setIsChecking(true);
    chrome.runtime.sendMessage(message, () => setIsChecking(false));
  }

  return (
    <main className="min-w-80 max-w-sm p-4 text-slate-950">
      <header className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <img src={logo} alt="" className="h-10 w-10" />
        <div>
          <h1 className="text-lg font-semibold leading-tight">Conspiracy Alert</h1>
          <p className="text-xs text-slate-500">Channel Checker backend</p>
        </div>
      </header>

      <section className={`mt-4 rounded-md border p-3 ${toneClasses[state.tone]}`}>
        <h2 className="text-sm font-semibold">{state.title}</h2>
        <p className="mt-1 text-sm leading-snug">{state.description}</p>
      </section>

      <section className="mt-4">
        <p className="text-xs font-medium uppercase text-slate-500">Current URL</p>
        <p className="mt-1 break-all rounded border border-slate-200 bg-white p-2 text-xs text-slate-700">
          {displayUrl}
        </p>
      </section>

      {activeEvaluation?.signals.length ? (
        <section className="mt-4">
          <p className="text-xs font-medium uppercase text-slate-500">Signals</p>
          <ul className="mt-2 space-y-2">
            {activeEvaluation.signals.map((signal) => (
              <li key={signal.type} className="rounded border border-slate-200 bg-white p-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{signal.type}</span>
                  <span className="text-xs uppercase text-slate-500">{signal.severity}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{signal.message}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <button
        className="mt-4 w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!canCheckCurrentUrl || isChecking}
        onClick={handleCheckNow}
        type="button"
      >
        {isChecking ? "Checking..." : "Check now"}
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800"
          onClick={() => chrome.runtime.openOptionsPage()}
          type="button"
        >
          Settings
        </button>
        <button
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          onClick={() => window.close()}
          type="button"
        >
          Close
        </button>
      </div>
    </main>
  );
}

export default App;
