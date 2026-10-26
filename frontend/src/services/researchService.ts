import type {
  Condition,
  ResearchResults,
  ResearchSession,
  ResponsePayload,
  ResponseResult,
} from "@/types/research"
import { apiGet, apiPost } from "./api"

// Research Mode always uses the real backend. A study needs real recorded data, never demo data.

export function startSession(preview?: Condition): Promise<ResearchSession> {
  return apiPost<ResearchSession>("/api/research/session", {
    consent: true,
    preview_condition: preview ?? null,
  })
}

export function submitResponse(payload: ResponsePayload): Promise<ResponseResult> {
  return apiPost<ResponseResult>("/api/research/response", payload)
}

export function getResults(): Promise<ResearchResults> {
  return apiGet<ResearchResults>("/api/research/results")
}