import type { components } from "./generated/apiTypes";

export type EvaluationStatus = components["schemas"]["EvaluateUrlResponse"]["status"];
export type SignalSeverity = components["schemas"]["SignalResponse"]["severity"];
export type ApiSignal = components["schemas"]["SignalResponse"];
export type ApiMatch = components["schemas"]["MatchResponse"];
export type EvaluateUrlResponse = components["schemas"]["EvaluateUrlResponse"];
