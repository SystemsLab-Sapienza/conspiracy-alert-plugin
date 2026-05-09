import type { ApiSignal, EvaluateUrlResponse, SignalSeverity } from "./apiTypes";

export interface PageAlert {
  severity: Extract<SignalSeverity, "high" | "warning">;
  title: string;
  message: string;
  url: string;
  normalizedUrl: string;
  signalTypes: string[];
}

export function buildPageAlert(
  evaluation: EvaluateUrlResponse,
  url: string,
): PageAlert | null {
  if (evaluation.status !== "matched" || evaluation.signals.length === 0) {
    return null;
  }

  const primarySignal = selectPrimarySignal(evaluation.signals);
  const severity = primarySignal.severity === "high" ? "high" : "warning";

  return {
    severity,
    title:
      severity === "high"
        ? "Questionable resource detected"
        : "Monetization signal detected",
    message: primarySignal.message,
    url,
    normalizedUrl: evaluation.normalized_url,
    signalTypes: evaluation.signals.map((signal) => signal.type),
  };
}

function selectPrimarySignal(signals: ApiSignal[]): ApiSignal {
  return signals.find((signal) => signal.severity === "high") ?? signals[0];
}
