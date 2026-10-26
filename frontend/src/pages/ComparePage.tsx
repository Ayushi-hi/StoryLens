import { useState } from "react"
import { BookOpen, LayoutDashboard, ShieldCheck } from "lucide-react"
import PageHeader from "@/components/common/PageHeader"
import DemoBadge from "@/components/common/DemoBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getFunnel, IS_DEMO } from "@/services/dataService"
import type { FunnelData } from "@/types/story"
import { formatCompact, formatPercent } from "@/utils/format"
import { buildFunnelStory } from "@/utils/stories"

type Mode = "split" | "traditional" | "storytelling"

const MODES: { key: Mode; label: string }[] = [
  { key: "split", label: "Side by side" },
  { key: "traditional", label: "Traditional View" },
  { key: "storytelling", label: "Storytelling View" },
]

const header = (
  <PageHeader
    eyebrow="Research"
    title="Traditional vs Storytelling"
    description="Switch between a classic dashboard view and an AI storytelling view."
    actions={IS_DEMO ? <DemoBadge /> : undefined}
  />
)

function TraditionalPanel({ funnel }: { funnel: FunnelData }) {
  const [views, carts, purchases] = funnel.stages
  const tiles = [
    { label: "Conversion Rate", value: formatPercent(funnel.overall_conversion) },
    { label: "Views", value: formatCompact(views.count) },
    { label: "Cart", value: formatCompact(carts.count) },
    { label: "Purchases", value: formatCompact(purchases.count) },
  ]

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
        <LayoutDashboard className="h-4 w-4" />
        Traditional dashboard
      </p>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">{t.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{t.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">Numbers only. The reader decides what they mean.</p>
    </div>
  )
}

function StoryPanel({ funnel }: { funnel: FunnelData }) {
  const story = buildFunnelStory(funnel, "template")

  return (
    <div className="h-full rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm">
      <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-600">
        <BookOpen className="h-4 w-4" />
        Storytelling
      </p>
      <h2 className="text-2xl font-extrabold leading-snug text-slate-900">{story.headline}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{story.what}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{story.so_what}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{story.now_what}</p>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
        Generated from verified dataset statistics
      </p>
    </div>
  )
}

export default function ComparePage() {
  const { data, error, loading } = useAsyncData(getFunnel)
  const [mode, setMode] = useState<Mode>("split")

  if (loading) {
    return (
      <div>
        {header}
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load the comparison. {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      {header}

      <div className="mb-6 inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === m.key ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${mode === "split" ? "md:grid-cols-2" : "max-w-3xl"}`}>
        {mode !== "storytelling" && <TraditionalPanel funnel={data} />}
        {mode !== "traditional" && <StoryPanel funnel={data} />}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Why this page matters for the study</p>
        <p className="mt-1">
          Both views use the same verified numbers. Only the presentation differs, so any difference in how
          participants answer questions can be linked to the presentation and not to different data. In Research
          Mode (Step 8), each participant sees one of these two conditions.
        </p>
      </div>
    </div>
  )
}