import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { CategoryStat } from "@/types/analytics"
import { categoryLabel } from "@/utils/format"

export default function CategoryChart({ data }: { data: CategoryStat[] }) {
  const rows = [...data]
    .sort((a, b) => b.conversion_rate - a.conversion_rate)
    .map((c) => ({ label: categoryLabel(c.category), conversion_rate: c.conversion_rate }))

  return (
    <div className="w-full" style={{ height: Math.max(288, rows.length * 32 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            interval={0}
            width={110}
            tick={{ fontSize: 12, fill: "#475569" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => `${Number(v).toFixed(2)}%`}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          />
          <Bar
            dataKey="conversion_rate"
            name="Conversion rate"
            fill="#8b5cf6"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}