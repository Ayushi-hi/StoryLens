import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import AnimatedCounter, { type CounterKind } from "./AnimatedCounter"

interface KpiCardProps {
  label: string
  value: number | string
  kind?: CounterKind
  icon: LucideIcon
  hint?: string
  accent?: string // Tailwind classes for the icon bubble
  index?: number // used to stagger the entrance animation
}

export default function KpiCard({
  label,
  value,
  kind = "compact",
  icon: Icon,
  hint,
  accent = "bg-blue-50 text-blue-600",
  index = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>

        <p className="mt-3 truncate text-2xl font-extrabold text-slate-900" title={typeof value === "string" ? value : undefined}>
        {typeof value === "number" ? <AnimatedCounter value={value} kind={kind} /> : value}
      </p>

      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </motion.div>
  )
}