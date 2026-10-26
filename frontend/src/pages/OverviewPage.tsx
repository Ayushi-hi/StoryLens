import {
  Activity,
  Award,
  Eye,
  Percent,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react"
import PageHeader from "@/components/common/PageHeader"
import DemoBadge from "@/components/common/DemoBadge"
import KpiCard from "@/components/common/KpiCard"
import ChartCard from "@/components/common/ChartCard"
import { Skeleton } from "@/components/ui/skeleton"
import EventsOverTimeChart from "@/charts/EventsOverTimeChart"
import EventDistributionChart from "@/charts/EventDistributionChart"
import CategoryChart from "@/charts/CategoryChart"
import PurchaseTrendChart from "@/charts/PurchaseTrendChart"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getOverviewBundle, IS_DEMO } from "@/services/dataService"
import {
  explainCategories,
  explainDistribution,
  explainEventsOverTime,
  explainPurchaseTrend,
} from "@/utils/explain"
import { categoryLabel } from "@/utils/format"

const header = (
  <PageHeader
    eyebrow="Dashboard"
    title="Overview"
    description="Key metrics and trends across the whole store, explained in plain English."
    actions={IS_DEMO ? <DemoBadge /> : undefined}
  />
)

export default function OverviewPage() {
  const { data, error, loading } = useAsyncData(getOverviewBundle)

  if (loading) {
    return (
      <div>
        {header}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load the overview data. {error}
        </div>
      </div>
    )
  }

  const { overview, daily, distribution, categories } = data

  return (
    <div>
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Total Events" value={overview.total_events} icon={Activity} accent="bg-indigo-50 text-indigo-600" />
        <KpiCard index={1} label="Total Users" value={overview.total_users} icon={Users} accent="bg-sky-50 text-sky-600" />
        <KpiCard index={2} label="Total Views" value={overview.total_views} icon={Eye} accent="bg-blue-50 text-blue-600" />
        <KpiCard index={3} label="Cart Events" value={overview.total_carts} icon={ShoppingCart} accent="bg-violet-50 text-violet-600" />
        <KpiCard index={4} label="Purchases" value={overview.total_purchases} icon={ShoppingBag} accent="bg-teal-50 text-teal-600" />
        <KpiCard index={5} label="Conversion Rate" value={overview.conversion_rate} kind="percent" icon={Percent} hint="Purchases ÷ views" accent="bg-emerald-50 text-emerald-600" />
        <KpiCard index={6} label="Top Category" value={overview.top_category ? categoryLabel(overview.top_category) : "N/A"} icon={Tag} hint="Most viewed" accent="bg-amber-50 text-amber-600" />
        <KpiCard index={7} label="Top Brand" value={overview.top_brand ? overview.top_brand.charAt(0).toUpperCase() + overview.top_brand.slice(1) : "N/A"} icon={Award} hint="Most viewed" accent="bg-rose-50 text-rose-600" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Events over time"
          subtitle="All events per day"
          explanation={explainEventsOverTime(daily)}
          demo={IS_DEMO}
        >
          <EventsOverTimeChart data={daily} />
        </ChartCard>

        <ChartCard
          title="Event distribution"
          subtitle="Share of all events"
          explanation={explainDistribution(distribution)}
          demo={IS_DEMO}
        >
          <EventDistributionChart data={distribution} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Category performance"
          subtitle="Conversion rate = purchases ÷ views"
          explanation={explainCategories(categories)}
          demo={IS_DEMO}
        >
          <CategoryChart data={categories} />
        </ChartCard>

        <ChartCard
          title="Purchase trend"
          subtitle="Purchases per day"
          explanation={explainPurchaseTrend(daily)}
          demo={IS_DEMO}
        >
          <PurchaseTrendChart data={daily} />
        </ChartCard>
      </div>
    </div>
  )
}