import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { EventDistributionItem } from "@/types/analytics"
import { EVENT_COLORS, EVENT_LABELS } from "@/utils/eventMeta"
import { formatNumber, formatPercent } from "@/utils/format"

export default function EventDistributionChart({ data }: { data: EventDistributionItem[] }) {
  const rows = data.map((d) => ({
    name: EVENT_LABELS[d.event_type],
    count: d.count,
    share: d.share,
    color: EVENT_COLORS[d.event_type],
  }))

  return (
    <div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              stroke="none"
            >
              {rows.map((r) => (
                <Cell key={r.name} fill={r.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatNumber(Number(v))}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
              {r.name}
            </span>
            <span className="font-semibold text-slate-900">{formatPercent(r.share, 1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}