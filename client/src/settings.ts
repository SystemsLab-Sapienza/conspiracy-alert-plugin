export const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
export const SETTINGS_KEY = "settings";

export interface ExtensionSettings {
  apiBaseUrl: string;
  automaticChecksEnabled: boolean;
}

export interface SettingsStorage {
  get(keys: string[], callback: (items: Record<string, unknown>) => void): void;
  set(items: Record<string, unknown>, callback?: () => void): void;
}

export async function getExtensionSettings(
  storageArea: SettingsStorage = chrome.storage.sync,
): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    storageArea.get([SETTINGS_KEY], (result) => {
      resolve(readStoredSettings(result[SETTINGS_KEY]));
    });
  });
}

export async function saveExtensionSettings(
  settings: ExtensionSettings,
  storageArea: SettingsStorage = chrome.storage.sync,
): Promise<ExtensionSettings> {
  const normalized = {
    apiBaseUrl: normalizeApiBaseUrl(settings.apiBaseUrl),
    automaticChecksEnabled: settings.automaticChecksEnabled,
  };

  return new Promise((resolve) => {
    storageArea.set({ [SETTINGS_KEY]: normalized }, () => resolve(normalized));
  });
}

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Backend URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Backend URL must be a valid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Backend URL must use http or https.");
  }

  if (parsed.search || parsed.hash) {
    throw new Error("Backend URL must not include query parameters or fragments.");
  }

  return parsed.toString().replace(/\/+$/, "");
}

export function getBackendOriginPattern(apiBaseUrl: string): string {
  return `${new URL(normalizeApiBaseUrl(apiBaseUrl)).origin}/*`;
}

function readStoredSettings(value: unknown): ExtensionSettings {
  if (!isSettingsRecord(value)) {
    return defaultSettings();
  }

  try {
    return {
      apiBaseUrl: normalizeApiBaseUrl(value.apiBaseUrl),
      automaticChecksEnabled:
        typeof value.automaticChecksEnabled === "boolean" ? value.automaticChecksEnabled : true,
    };
  } catch {
    return defaultSettings();
  }
}

function isSettingsRecord(value: unknown): value is ExtensionSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    "apiBaseUrl" in value &&
    typeof value.apiBaseUrl === "string"
  );
}

function defaultSettings(): ExtensionSettings {
  return {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    automaticChecksEnabled: true,
  };
}
