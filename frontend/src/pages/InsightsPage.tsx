import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, Compass, Sparkles } from "lucide-react"
import PageHeader from "@/components/common/PageHeader"
import DemoBadge from "@/components/common/DemoBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getInsights, IS_DEMO } from "@/services/dataService"
import type { InsightGroup } from "@/types/insights"
import { formatNumber } from "@/utils/format"

type GroupFilter = "all" | InsightGroup

const GROUPS: { key: GroupFilter; label: string }[] = [
  { key: "all", label: "All insights" },
  { key: "journey", label: "Journey" },
  { key: "categories", label: "Categories" },
  { key: "trends", label: "Trends" },
]

const header = (
  <PageHeader
    eyebrow="AI Insights"
    title="AI Insights"
    description="Patterns detected automatically, with evidence and cautious AI explanations."
    actions={IS_DEMO ? <DemoBadge /> : undefined}
  />
)

export default function InsightsPage() {
  const { data, error, loading } = useAsyncData(getInsights)
  const [group, setGroup] = useState<GroupFilter>("all")

  if (loading) {
    return (
      <div>
        {header}
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load the insights. {error}
        </div>
      </div>
    )
  }

  const visible = group === "all" ? data : data.filter((i) => i.group === group)

  return (
    <div>
      {header}

      <div className="mb-6 flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const count = g.key === "all" ? data.length : data.filter((i) => i.group === g.key).length
          const active = group === g.key
          return (
            <button
              key={g.key}
              onClick={() => setGroup(g.key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {g.label} <span className={active ? "text-violet-200" : "text-slate-400"}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {visible.map((insight, i) => (
          <motion.article
            key={insight.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="w-fit rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              {insight.kind}
            </span>
            <h2 className="mt-3 text-lg font-extrabold leading-snug text-slate-900">{insight.title}</h2>

            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Calculator className="h-3.5 w-3.5" />
                Supporting evidence
              </p>
              <div className="grid grid-cols-2 gap-2">
                {insight.evidence.map((m) => (
                  <div key={m.label} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className="text-base font-bold text-slate-900">
                      {typeof m.value === "number" ? formatNumber(m.value) : m.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                Explanation
              </p>
              <p className="text-sm leading-relaxed text-slate-700">{insight.explanation}</p>
              <p className="mt-1 text-xs text-slate-400">
                Built only from the evidence above. Written by a template, not by an AI model.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/60 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-800">
                <Compass className="h-3.5 w-3.5" />
                Suggested investigation
              </p>
              <p className="text-sm text-teal-900/80">{insight.investigation}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  )
}