import type { StoryMetric } from "./story"

export type InsightGroup = "categories" | "journey" | "trends"

export interface Insight {
  id: string
  group: InsightGroup
  kind: string // short label shown as a badge
  title: string // the insight
  evidence: StoryMetric[] // verified numbers
  explanation: string // plain-language explanation built only from the evidence
  investigation: string // what to look at next
}