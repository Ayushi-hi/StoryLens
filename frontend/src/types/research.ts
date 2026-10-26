import type { Story, StoryMetric } from "./story"

export type Condition = "TRADITIONAL" | "STORYTELLING"
export type TaskId = "T1" | "T2" | "T3" | "T4"
export type Exhibit = "trend" | "categories" | "funnel"

export interface TaskOption {
  id: string
  label: string
}

export interface TaskView {
  task_id: TaskId
  prompt: string
  hint: string | null
  exhibit: Exhibit
  options: TaskOption[]
  metrics: StoryMetric[]
  story: Story | null
  asks_reason: boolean
}

export interface ResearchSession {
  session_id: string
  participant_id: string
  condition: Condition
  is_preview: boolean
  tasks: TaskView[]
}

export interface ResponsePayload {
  session_id: string
  task_id: TaskId
  answer: string
  confidence: number
  started_at: string
  ended_at: string
  reason: string | null
}

export interface ResponseResult {
  recorded: boolean
  session_complete: boolean
}

export interface ConditionStats {
  condition: Condition
  participants: number
  completed: number
  responses: number
  comprehension_pct: number | null
  mean_time_seconds: number | null
  median_time_seconds: number | null
  mean_confidence: number | null
}

export interface TaskStats {
  task_id: TaskId
  condition: Condition
  n: number
  correct_pct: number | null
  mean_time_seconds: number | null
  mean_confidence: number | null
}

export interface ResearchResults {
  label: string
  conditions: ConditionStats[]
  by_task: TaskStats[]
  min_completed_per_condition: number
  conclusions_allowed: boolean
  note: string
}