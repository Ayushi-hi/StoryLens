import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { DailyPoint } from "@/types/analytics"
import { formatCompact, formatDateShort, formatNumber } from "@/utils/format"

export default function PurchaseTrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="purchase"
            name="Purchases"
            stroke="#14b8a6"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}