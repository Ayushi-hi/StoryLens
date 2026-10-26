import { useEffect, useState } from "react"
import { Download, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { getResults } from "@/services/researchService"
import type { ConditionStats, ResearchResults, TaskStats } from "@/types/research"

const LABELS: Record<ConditionStats["condition"], string> = {
  TRADITIONAL: "Traditional",
  STORYTELLING: "Storytelling",
}

function value(n: number | null, suffix = "", digits = 1): string {
  return n === null ? "No data" : `${n.toFixed(digits)}${suffix}`
}

export default function ResultsPanel() {
  const [data, setData] = useState<ResearchResults | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getResults()
      .then((r) => {
        if (!cancelled) setData(r)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load results.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
  }
  if (!data) return <Skeleton className="h-64 rounded-2xl" />

  const taskIds = ["T1", "T2", "T3", "T4"] as const
  const find = (task: string, cond: string): TaskStats | undefined =>
    data.by_task.find((t) => t.task_id === task && t.condition === cond)

  const rows: { label: string; pick: (c: ConditionStats) => string }[] = [
    { label: "Participants who answered at least one task", pick: (c) => String(c.participants) },
    { label: "Participants who finished all tasks", pick: (c) => String(c.completed) },
    { label: "Comprehension (answers that were correct)", pick: (c) => value(c.comprehension_pct, "%") },
    { label: "Mean time per task", pick: (c) => value(c.mean_time_seconds, " s") },
    { label: "Median time per task", pick: (c) => value(c.median_time_seconds, " s") },
    { label: "Mean confidence (1 to 5)", pick: (c) => value(c.mean_confidence, "", 2) },
  ]

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-slate-900">{data.label}</h2>
        <a
          href="/api/research/export.csv"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
        >
          <Download className="h-4 w-4" />
          Download responses (CSV)
        </a>
      </div>

      <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {data.note} A study like this needs at least {data.min_completed_per_condition} finished participants per
          group in this app before figures are treated as meaningful. Preview sessions are not counted.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Measure</th>
              {data.conditions.map((c) => (
                <th key={c.condition} className="px-4 py-3 text-right font-semibold">
                  {LABELS[c.condition]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-700">{r.label}</td>
                {data.conditions.map((c) => (
                  <td key={c.condition} className="px-4 py-3 text-right font-semibold text-slate-900">
                    {r.pick(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-bold text-slate-900">By task (percentage correct, with n)</h3>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Task</th>
              {data.conditions.map((c) => (
                <th key={c.condition} className="px-4 py-3 text-right font-semibold">
                  {LABELS[c.condition]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {taskIds.map((id) => (
              <tr key={id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-700">{id}</td>
                {data.conditions.map((c) => {
                  const t = find(id, c.condition)
                  return (
                    <td key={c.condition} className="px-4 py-3 text-right text-slate-900">
                      {t ? `${value(t.correct_pct, "%", 0)} (n=${t.n})` : "No data"}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}