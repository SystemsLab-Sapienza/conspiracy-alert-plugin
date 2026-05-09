import type { EvaluateUrlResponse } from "./apiTypes";
import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl } from "./settings";

export interface EvaluateUrlOptions {
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

export async function evaluateUrl(
  url: string,
  options: EvaluateUrlOptions = {},
): Promise<EvaluateUrlResponse> {
  const apiBaseUrl = normalizeApiBaseUrl(options.apiBaseUrl ?? DEFAULT_API_BASE_URL);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${apiBaseUrl}/v1/evaluate-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`Channel Checker backend returned ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as EvaluateUrlResponse;
}
