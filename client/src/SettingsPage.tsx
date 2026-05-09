import React, { useEffect, useState } from "react";

import logo from "./logo.png";
import {
  DEFAULT_API_BASE_URL,
  getBackendOriginPattern,
  getExtensionSettings,
  normalizeApiBaseUrl,
  saveExtensionSettings,
} from "./settings";

type SaveStatus =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string }
  | null;

function SettingsPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [automaticChecksEnabled, setAutomaticChecksEnabled] = useState(true);
  const [status, setStatus] = useState<SaveStatus>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getExtensionSettings().then((settings) => {
      setApiBaseUrl(settings.apiBaseUrl);
      setAutomaticChecksEnabled(settings.automaticChecksEnabled);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      const normalized = normalizeApiBaseUrl(apiBaseUrl);
      const granted = await requestBackendPermission(normalized);
      if (!granted) {
        throw new Error("Browser permission for this backend origin was not granted.");
      }

      const saved = await saveExtensionSettings({
        apiBaseUrl: normalized,
        automaticChecksEnabled,
      });
      setApiBaseUrl(saved.apiBaseUrl);
      setAutomaticChecksEnabled(saved.automaticChecksEnabled);
      setStatus({ tone: "success", message: "Settings saved." });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <img src={logo} alt="" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-semibold leading-tight">Conspiracy Alert</h1>
            <p className="text-sm text-slate-500">Backend settings</p>
          </div>
        </header>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block" htmlFor="apiBaseUrl">
            <span className="text-sm font-medium text-slate-700">Channel Checker backend URL</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              id="apiBaseUrl"
              inputMode="url"
              onChange={(event) => setApiBaseUrl(event.target.value)}
              placeholder={DEFAULT_API_BASE_URL}
              type="url"
              value={apiBaseUrl}
            />
          </label>

          <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3">
            <input
              checked={automaticChecksEnabled}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
              onChange={(event) => setAutomaticChecksEnabled(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Automatic page checks
              </span>
            </span>
          </label>

          {status ? (
            <p
              className={`rounded-md border px-3 py-2 text-sm ${
                status.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-amber-300 bg-amber-50 text-amber-950"
              }`}
            >
              {status.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
              onClick={() => setApiBaseUrl(DEFAULT_API_BASE_URL)}
              type="button"
            >
              Use local default
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function requestBackendPermission(apiBaseUrl: string): Promise<boolean> {
  if (!chrome.permissions?.request) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    chrome.permissions.request({ origins: [getBackendOriginPattern(apiBaseUrl)] }, (granted) => {
      if (chrome.runtime.lastError) {
        resolve(false);
        return;
      }
      resolve(granted);
    });
  });
}

export default SettingsPage;
