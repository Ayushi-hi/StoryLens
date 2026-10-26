import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DailyPoint } from "@/types/analytics"
import { formatCompact, formatDateShort, formatNumber } from "@/utils/format"

export default function EventsOverTimeChart({ data }: { data: DailyPoint[] }) {
  const series = data.map((d) => ({
    date: d.date,
    total: d.view + d.cart + d.remove_from_cart + d.purchase,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="eventsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={formatCompact}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v) => formatNumber(Number(v))}
            labelFormatter={(l) => formatDateShort(String(l))}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Events"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#eventsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}