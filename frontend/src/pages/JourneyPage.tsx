import { Percent, ShoppingCart, TrendingDown } from "lucide-react"
import PageHeader from "@/components/common/PageHeader"
import DemoBadge from "@/components/common/DemoBadge"
import ChartCard from "@/components/common/ChartCard"
import KpiCard from "@/components/common/KpiCard"
import AiStoryPanel from "@/components/common/AiStoryPanel"
import FunnelChart from "@/charts/FunnelChart"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsyncData } from "@/hooks/useAsyncData"
import { generateFunnelStory, getFunnel, IS_DEMO } from "@/services/dataService"
import type { FunnelData } from "@/types/story"
import { formatCompact, formatNumber, formatPercent } from "@/utils/format"
import { biggestDrop, buildFunnelStory, explainFunnel } from "@/utils/stories"

const header = (
  <PageHeader
    eyebrow="Dashboard"
    title="User Journey"
    description="How shoppers move from viewing a product to completing a purchase."
    actions={IS_DEMO ? <DemoBadge /> : undefined}
  />
)

function JourneyContent({ funnel }: { funnel: FunnelData }) {
  const big = biggestDrop(funnel)

  return (
    <div>
      {header}

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Shopping funnel"
          subtitle="View, then cart, then purchase"
          explanation={explainFunnel(funnel)}
          demo={IS_DEMO}
        >
          <FunnelChart funnel={funnel} />
        </ChartCard>

        <div className="grid content-start gap-4">
          <KpiCard
            index={0}
            label="Overall conversion"
            value={funnel.overall_conversion}
            kind="percent"
            icon={Percent}
            hint="Purchases ÷ views"
            accent="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            index={1}
            label="Biggest drop-off"
            value={formatPercent(big.drop, 1)}
            icon={TrendingDown}
            hint={`${big.from} to ${big.to}`}
            accent="bg-rose-50 text-rose-600"
          />
          <KpiCard
            index={2}
            label="Removed from cart"
            value={funnel.removed_from_cart}
            icon={ShoppingCart}
            hint="Tracked separately, not subtracted"
            accent="bg-amber-50 text-amber-600"
          />
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-slate-900">Stage details</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-semibold">Stage</th>
                <th className="py-2 pr-4 text-right font-semibold">Events</th>
                <th className="py-2 pr-4 text-right font-semibold">% of views</th>
                <th className="py-2 pr-4 text-right font-semibold">Continue</th>
                <th className="py-2 text-right font-semibold">Drop-off</th>
              </tr>
            </thead>
            <tbody>
              {funnel.stages.map((s) => (
                <tr key={s.key} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">{s.label}</td>
                  <td className="py-2.5 pr-4 text-right" title={formatCompact(s.count)}>
                    {formatNumber(s.count)}
                  </td>
                  <td className="py-2.5 pr-4 text-right">{formatPercent(s.pct_of_views, 2)}</td>
                  <td className="py-2.5 pr-4 text-right">
                    {s.step_rate === null ? "-" : formatPercent(s.step_rate, 1)}
                  </td>
                  <td className="py-2.5 text-right text-rose-600">
                    {s.drop_off === null ? "-" : formatPercent(s.drop_off, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6">
        <AiStoryPanel
          generate={() => generateFunnelStory(funnel)}
          fallback={buildFunnelStory(funnel, "template")}
        />
      </div>
    </div>
  )
}

export default function JourneyPage() {
  const { data, error, loading } = useAsyncData(getFunnel)

  if (loading) {
    return (
      <div>
        {header}
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load the funnel data. {error}
        </div>
      </div>
    )
  }

  return <JourneyContent funnel={data} />
}