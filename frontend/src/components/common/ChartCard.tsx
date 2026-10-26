import type { ReactNode } from "react"
import { Lightbulb } from "lucide-react"
import DemoBadge from "./DemoBadge"

interface ChartCardProps {
  title: string
  subtitle?: string
  explanation: string
  demo?: boolean
  className?: string
  children: ReactNode
}

export default function ChartCard({
  title,
  subtitle,
  explanation,
  demo = false,
  className = "",
  children,
}: ChartCardProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {demo && <DemoBadge />}
      </div>

      {children}

      <div className="mt-4 flex gap-2.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
        <div>
          <p>
            <span className="font-semibold text-slate-800">In plain English: </span>
            {explanation}
          </p>
          <p className="mt-1 text-xs text-slate-400">Calculated directly from the data shown above.</p>
        </div>
      </div>
    </section>
  )
}