import { describe, expect, it } from "vitest";

import {
  DEFAULT_API_BASE_URL,
  SETTINGS_KEY,
  getBackendOriginPattern,
  getExtensionSettings,
  normalizeApiBaseUrl,
  saveExtensionSettings,
  type SettingsStorage,
} from "./settings";

describe("extension settings", () => {
  it("returns the default backend URL when storage is empty", async () => {
    const settings = await getExtensionSettings(createMemoryStorage());

    expect(settings.apiBaseUrl).toBe(DEFAULT_API_BASE_URL);
    expect(settings.automaticChecksEnabled).toBe(true);
  });

  it("normalizes stored backend URLs", async () => {
    const settings = await getExtensionSettings(
      createMemoryStorage({
        [SETTINGS_KEY]: { apiBaseUrl: " https://checker.example/api/ " },
      }),
    );

    expect(settings.apiBaseUrl).toBe("https://checker.example/api");
    expect(settings.automaticChecksEnabled).toBe(true);
  });

  it("loads stored automatic check preferences", async () => {
    const settings = await getExtensionSettings(
      createMemoryStorage({
        [SETTINGS_KEY]: {
          apiBaseUrl: "https://checker.example/api",
          automaticChecksEnabled: false,
        },
      }),
    );

    expect(settings.automaticChecksEnabled).toBe(false);
  });

  it("falls back to the default backend URL when stored settings are invalid", async () => {
    const settings = await getExtensionSettings(
      createMemoryStorage({
        [SETTINGS_KEY]: { apiBaseUrl: "chrome://extensions" },
      }),
    );

    expect(settings.apiBaseUrl).toBe(DEFAULT_API_BASE_URL);
  });

  it("saves validated backend URLs", async () => {
    const storage = createMemoryStorage();

    const saved = await saveExtensionSettings(
      { apiBaseUrl: "http://localhost:9000/", automaticChecksEnabled: false },
      storage,
    );
    const loaded = await getExtensionSettings(storage);

    expect(saved.apiBaseUrl).toBe("http://localhost:9000");
    expect(saved.automaticChecksEnabled).toBe(false);
    expect(loaded.apiBaseUrl).toBe("http://localhost:9000");
    expect(loaded.automaticChecksEnabled).toBe(false);
  });

  it("rejects unsupported backend URL schemes", async () => {
    expect(() => normalizeApiBaseUrl("ftp://checker.example")).toThrow(
      "Backend URL must use http or https.",
    );
  });

  it("builds an optional host permission origin pattern", () => {
    expect(getBackendOriginPattern("https://checker.example/api")).toBe(
      "https://checker.example/*",
    );
  });
});

function createMemoryStorage(initial: Record<string, unknown> = {}): SettingsStorage {
  const store = { ...initial };

  return {
    get(keys, callback) {
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        result[key] = store[key];
      }
      callback(result);
    },
    set(items, callback) {
      Object.assign(store, items);
      callback?.();
    },
  };
}
