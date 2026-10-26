import { Compass, Eye, Info, Lightbulb, ShieldCheck } from "lucide-react"
import type { Story } from "@/types/story"
import { formatNumber } from "@/utils/format"

const BLOCKS = [
  { key: "what", title: "WHAT?", question: "What happened?", icon: Eye, tone: "border-blue-100 bg-blue-50/60", iconTone: "bg-blue-100 text-blue-700" },
  { key: "so_what", title: "SO WHAT?", question: "Why does it matter?", icon: Lightbulb, tone: "border-violet-100 bg-violet-50/60", iconTone: "bg-violet-100 text-violet-700" },
  { key: "now_what", title: "NOW WHAT?", question: "What should we investigate?", icon: Compass, tone: "border-teal-100 bg-teal-50/60", iconTone: "bg-teal-100 text-teal-700" },
] as const

export default function StoryBlocks({ story }: { story: Story }) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {BLOCKS.map(({ key, title, question, icon: Icon, tone, iconTone }) => (
          <div key={key} className={`rounded-2xl border p-5 ${tone}`}>
            <div className="mb-3 flex items-center gap-2.5">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconTone}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-extrabold tracking-wide text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">{question}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{story[key]}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {story.supporting_metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">
              {typeof m.value === "number" ? formatNumber(m.value) : m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
          <Info className="h-3.5 w-3.5" />
          Data limitations
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900/80">
          {story.data_limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
          Generated from verified dataset statistics
        </span>
        <span>Confidence: {story.confidence}</span>
        <span>
          {story.source === "ai"
            ? "Written by AI"
            : "Written by a template from the verified metrics (no AI model used)"}
        </span>
      </div>
    </div>
  )
}