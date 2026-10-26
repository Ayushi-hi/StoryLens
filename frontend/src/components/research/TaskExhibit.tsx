import { useEffect, useState } from "react"
import CategoryChart from "@/charts/CategoryChart"
import FunnelChart from "@/charts/FunnelChart"
import PurchaseTrendChart from "@/charts/PurchaseTrendChart"
import StoryBlocks from "@/components/common/StoryBlocks"
import { Skeleton } from "@/components/ui/skeleton"
import { getFunnel, getOverviewBundle } from "@/services/dataService"
import type { OverviewBundle } from "@/types/analytics"
import type { TaskView } from "@/types/research"
import type { FunnelData } from "@/types/story"
import { formatNumber } from "@/utils/format"

interface Loaded {
  bundle: OverviewBundle
  funnel: FunnelData
}

export default function TaskExhibit({ task }: { task: TaskView }) {
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getOverviewBundle(), getFunnel()])
      .then(([bundle, funnel]) => {
        if (!cancelled) setData({ bundle, funnel })
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the data.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
  }
  if (!data) return <Skeleton className="h-72 rounded-2xl" />

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {task.exhibit === "trend" && <PurchaseTrendChart data={data.bundle.daily} />}
        {task.exhibit === "categories" && <CategoryChart data={data.bundle.categories} />}
        {task.exhibit === "funnel" && <FunnelChart funnel={data.funnel} />}
      </div>

      {task.metrics.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {task.metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="mt-0.5 text-lg font-bold text-slate-900">
                {typeof m.value === "number" ? formatNumber(m.value) : m.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {task.story && (
        <div className="mt-5">
          <StoryBlocks story={task.story} />
        </div>
      )}
    </div>
  )
}