import { motion } from "framer-motion"
import { ArrowDown } from "lucide-react"
import type { FunnelData } from "@/types/story"
import { formatCompact, formatPercent } from "@/utils/format"

const COLORS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-teal-400 to-teal-600",
]

export default function FunnelChart({ funnel }: { funnel: FunnelData }) {
  return (
    <div>
      {funnel.stages.map((s, i) => (
        <div key={s.key}>
          {s.drop_off !== null && s.step_rate !== null && (
            <div className="flex flex-wrap items-center justify-center gap-x-2 py-2 text-xs text-slate-500">
              <ArrowDown className="h-3.5 w-3.5" />
              <span>
                <b className="text-rose-600">{formatPercent(s.drop_off, 1)}</b> drop-off
              </span>
              <span className="text-slate-300">|</span>
              <span>{formatPercent(s.step_rate, 1)} continue</span>
            </div>
          )}

          <div className="flex justify-center">
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${Math.max(s.pct_of_views, 34)}%`, opacity: 1 }}
              transition={{ duration: 0.7, delay: i * 0.25 }}
              className={`flex min-h-14 items-center justify-between gap-3 overflow-hidden rounded-xl bg-gradient-to-r px-4 py-3 text-white shadow-sm ${COLORS[i]}`}
            >
              <span className="truncate text-sm font-semibold">{s.label}</span>
              <span className="text-lg font-extrabold">{formatCompact(s.count)}</span>
            </motion.div>
          </div>
          <p className="mt-1 text-center text-xs text-slate-400">
            {formatPercent(s.pct_of_views, 2)} of views
          </p>
        </div>
      ))}
      <p className="mt-4 text-center text-xs text-slate-400">
        Bars below 34% width are widened so labels stay readable. The numbers are exact.
      </p>
    </div>
  )
}