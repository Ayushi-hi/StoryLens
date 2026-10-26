export type Confidence = "high" | "medium" | "low"

export interface StoryMetric {
  label: string
  value: number | string
}

// Same shape the AI will return in Step 7 (validated with Pydantic on the backend).
export interface Story {
  headline: string
  summary: string
  what: string
  so_what: string
  now_what: string
  supporting_metrics: StoryMetric[]
  confidence: Confidence
  data_limitations: string[]
  source: "ai" | "template"
}

export interface FunnelStage {
  key: "view" | "cart" | "purchase"
  label: string
  count: number
  pct_of_views: number
  step_rate: number | null // % of the previous stage that continued
  drop_off: number | null // 100 - step_rate
}

export interface FunnelData {
  stages: FunnelStage[]
  removed_from_cart: number
  overall_conversion: number // purchases / views, in percent
}

export type StoryType = "funnel" | "categories" | "trend"

export interface GenerateStoryResponse {
  story: Story
  status: "ai" | "cached" | "fallback" | "demo"
  model: string | null
  message: string | null
}