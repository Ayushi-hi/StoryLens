import {
  Calculator,
  Database,
  FlaskConical,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import PageHeader from "@/components/common/PageHeader"

const PIPELINE: { title: string; text: string; icon: LucideIcon }[] = [
  { title: "Data Source", text: "Kaggle: eCommerce Behavior Data from Multi-Category Store. Events: view, cart, remove_from_cart, purchase.", icon: Database },
  { title: "Data Processing", text: "Raw CSV files are converted to Parquet once, so large files can be queried quickly.", icon: Layers },
  { title: "Analytics", text: "DuckDB runs SQL aggregations on the Parquet files. Only small summary tables leave the database.", icon: Calculator },
  { title: "Insight Detection", text: "Rules find patterns in the summaries, such as the largest drop-off or the highest-converting category.", icon: Lightbulb },
  { title: "AI Story Generation", text: "An LLM receives only verified statistics and writes a What, So What, Now What story. Output is validated before use.", icon: Sparkles },
  { title: "Visualization", text: "Charts and stories are shown together, and every chart has a plain-English explanation.", icon: LayoutDashboard },
  { title: "User Study", text: "Participants answer the same tasks with either the traditional or the storytelling view. Responses are recorded.", icon: FlaskConical },
]

const HYPOTHESES = [
  { id: "H1", text: "AI-powered storytelling improves comprehension of complex data among non-technical users." },
  { id: "H2", text: "AI-powered storytelling reduces the time required to answer data interpretation tasks." },
  { id: "H3", text: "AI-powered storytelling increases user confidence when interpreting data." },
]

const RULES = [
  "Never invent numbers.",
  "Never invent trends.",
  "Never invent causes.",
  "Never claim that correlation means causation.",
  "Never hide important limitations.",
  "Only use metrics supplied by the analytics layer.",
  "Clearly separate facts from interpretation.",
  "If evidence is insufficient, say so.",
  "Include supporting metrics with every important claim.",
  "Keep explanations understandable for non-technical users.",
]

const KINDS = [
  { title: "Verified fact", tone: "border-teal-200 bg-teal-50/60", text: "Calculated directly from the dataset.", example: "Purchases are 3.79% of views." },
  { title: "AI interpretation", tone: "border-violet-200 bg-violet-50/60", text: "A cautious explanation of what the numbers may mean.", example: "Browsing is much more common than buying." },
  { title: "Unsupported assumption", tone: "border-rose-200 bg-rose-50/60", text: "A cause the data cannot show. The AI must not say this.", example: "Shoppers left because shipping was expensive." },
]

export default function MethodologyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Methodology"
        title="Methodology"
        description="How the data flows from raw events to a human-friendly story."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">The pipeline</h2>
        <ol className="mt-5 space-y-0">
          {PIPELINE.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-teal-400 text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                {i < PIPELINE.length - 1 && <span className="my-1 w-px flex-1 bg-slate-200" />}
              </div>
              <div className="pb-6">
                <p className="font-bold text-slate-900">{step.title}</p>
                <p className="mt-0.5 text-sm text-slate-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/60 p-6">
        <p className="font-bold text-slate-900">The AI does not replace statistical analysis</p>
        <p className="mt-1 text-sm text-slate-700">
          The analytics layer establishes the facts. The AI only turns those facts into an understandable
          narrative. If the AI is unavailable, the app falls back to an explanation calculated directly from the
          same metrics.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {KINDS.map((k) => (
          <div key={k.title} className={`rounded-2xl border p-5 ${k.tone}`}>
            <p className="font-bold text-slate-900">{k.title}</p>
            <p className="mt-1 text-sm text-slate-600">{k.text}</p>
            <p className="mt-3 text-sm italic text-slate-700">"{k.example}"</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Research hypotheses</h2>
          <p className="mt-1 text-xs text-slate-500">These are hypotheses to test, not conclusions.</p>
          <ul className="mt-4 space-y-3">
            {HYPOTHESES.map((h) => (
              <li key={h.id} className="flex gap-3 text-sm text-slate-700">
                <span className="h-fit rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">{h.id}</span>
                {h.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Rules the AI must follow</h2>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}