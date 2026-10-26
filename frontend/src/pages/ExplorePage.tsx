import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import PageHeader from "@/components/common/PageHeader"
import DemoBadge from "@/components/common/DemoBadge"
import ChartCard from "@/components/common/ChartCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ExploreCategoryChart from "@/charts/ExploreCategoryChart"
import { useAsyncData } from "@/hooks/useAsyncData"
import { getFilterOptions, IS_DEMO, queryExplore } from "@/services/dataService"
import type { ExploreFilters, ExploreResult, FilterOptions, SortKey } from "@/types/explore"
import { EVENT_LABELS } from "@/utils/eventMeta"
import { categoryLabel, formatCompact, formatNumber, formatPercent } from "@/utils/format"

const PAGE_SIZE = 10

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "product_id", label: "Product ID", numeric: false },
  { key: "brand", label: "Brand", numeric: false },
  { key: "category", label: "Category", numeric: false },
  { key: "avg_price", label: "Price", numeric: true },
  { key: "views", label: "Views", numeric: true },
  { key: "carts", label: "Carts", numeric: true },
  { key: "purchases", label: "Purchases", numeric: true },
  { key: "conversion_rate", label: "Conversion", numeric: true },
]

const fieldClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"

const header = (
  <PageHeader
    eyebrow="Advanced"
    title="Explore Data"
    description="Filter, search and sort the data. Aggregated on the server, never in the browser."
    actions={IS_DEMO ? <DemoBadge /> : undefined}
  />
)

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function explain(result: ExploreResult, metricLabel: string): string {
  if (result.total_rows === 0) {
    return "No products match the current filters. Try widening the date range or clearing a filter."
  }
  const total = result.by_category.reduce((a, c) => a + c.value, 0)
  const top = result.by_category[0]
  return (
    `${formatNumber(result.total_rows)} products match the current filters, with ${formatCompact(total)} ${metricLabel.toLowerCase()} in total. ` +
    `${categoryLabel(top.category)} contributes the most (${formatCompact(top.value)}).`
  )
}

function ExploreContent({ options }: { options: FilterOptions }) {
  const [filters, setFilters] = useState<ExploreFilters>({
    dateFrom: options.min_date,
    dateTo: options.max_date,
    category: "all",
    brand: "all",
    eventType: "all",
    priceMin: "",
    priceMax: "",
  })
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("views")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<ExploreResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Wait 300 ms after typing stops before searching.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  // Ask the "server" for exactly one page of aggregated rows.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    queryExplore({ ...filters, search, sortBy, sortDir, page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (cancelled) return
        setResult(r)
        setError(null)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Query failed")
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters, search, sortBy, sortDir, page])

  function setFilter<K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  function handleSort(key: SortKey) {
    if (key === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(key)
      setSortDir(key === "brand" || key === "category" || key === "product_id" ? "asc" : "desc")
    }
    setPage(1)
  }

  function resetAll() {
    setFilters({
      dateFrom: options.min_date,
      dateTo: options.max_date,
      category: "all",
      brand: "all",
      eventType: "all",
      priceMin: "",
      priceMax: "",
    })
    setSearchInput("")
    setSearch("")
    setPage(1)
  }

  const chips: { label: string; clear: () => void }[] = []
  if (filters.category !== "all")
    chips.push({ label: `Category: ${categoryLabel(filters.category)}`, clear: () => setFilter("category", "all") })
  if (filters.brand !== "all")
    chips.push({ label: `Brand: ${filters.brand}`, clear: () => setFilter("brand", "all") })
  if (filters.eventType !== "all")
    chips.push({ label: `Event: ${EVENT_LABELS[filters.eventType]}`, clear: () => setFilter("eventType", "all") })
  if (filters.priceMin !== "" || filters.priceMax !== "")
    chips.push({
      label: `Price: ${filters.priceMin || "0"} - ${filters.priceMax || "any"}`,
      clear: () => {
        setFilters((f) => ({ ...f, priceMin: "", priceMax: "" }))
        setPage(1)
      },
    })
  if (filters.dateFrom !== options.min_date || filters.dateTo !== options.max_date)
    chips.push({
      label: `Dates: ${filters.dateFrom} to ${filters.dateTo}`,
      clear: () => {
        setFilters((f) => ({ ...f, dateFrom: options.min_date, dateTo: options.max_date }))
        setPage(1)
      },
    })
  if (search)
    chips.push({
      label: `Search: ${search}`,
      clear: () => {
        setSearchInput("")
        setSearch("")
        setPage(1)
      },
    })

  const metricLabel = filters.eventType === "all" ? "All events" : EVENT_LABELS[filters.eventType]
  const totalPages = result ? Math.max(1, Math.ceil(result.total_rows / PAGE_SIZE)) : 1

  return (
    <div>
      {header}

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From (week start)">
            <input type="date" className={fieldClass} value={filters.dateFrom} min={options.min_date} max={options.max_date}
              onChange={(e) => setFilter("dateFrom", e.target.value || options.min_date)} />
          </Field>
          <Field label="To (week start)">
            <input type="date" className={fieldClass} value={filters.dateTo} min={options.min_date} max={options.max_date}
              onChange={(e) => setFilter("dateTo", e.target.value || options.max_date)} />
          </Field>
          <Field label="Category">
            <select className={fieldClass} value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
              <option value="all">All categories</option>
              {options.categories.map((c) => (
                <option key={c} value={c}>{categoryLabel(c)}</option>
              ))}
            </select>
          </Field>
          <Field label="Brand">
            <select className={fieldClass} value={filters.brand} onChange={(e) => setFilter("brand", e.target.value)}>
              <option value="all">All brands</option>
              {options.brands.map((b) => (
                <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Event type">
            <select className={fieldClass} value={filters.eventType}
              onChange={(e) => setFilter("eventType", e.target.value as ExploreFilters["eventType"])}>
              <option value="all">All events</option>
              <option value="view">Views</option>
              <option value="cart">Cart adds</option>
              <option value="remove_from_cart">Removed from cart</option>
              <option value="purchase">Purchases</option>
            </select>
          </Field>
          <Field label="Min price">
            <input type="number" min={0} placeholder="0" className={fieldClass} value={filters.priceMin}
              onChange={(e) => setFilter("priceMin", e.target.value)} />
          </Field>
          <Field label="Max price">
            <input type="number" min={0} placeholder="Any" className={fieldClass} value={filters.priceMax}
              onChange={(e) => setFilter("priceMax", e.target.value)} />
          </Field>
          <Field label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Brand, category, ID" className={`${fieldClass} pl-9`}
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
          </Field>
        </div>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1 rounded-full bg-violet-50 py-1 pl-3 pr-1.5 text-xs font-medium text-violet-700">
                {c.label}
                <button onClick={c.clear} aria-label={`Remove filter ${c.label}`} className="rounded-full p-0.5 hover:bg-violet-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button onClick={resetAll} className="text-xs font-medium text-slate-500 underline hover:text-slate-800">
              Clear all
            </button>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Demo data is stored in weekly buckets, so dates are week start dates. The real backend filters by exact day.
        </p>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      )}

      {!result && loading && <Skeleton className="mt-6 h-96 rounded-2xl" />}

      {result && (
        <>
          <div className="mt-6">
            <ChartCard
              title={`${metricLabel} by category`}
              subtitle="Updates with every filter"
              explanation={explain(result, metricLabel)}
              demo={IS_DEMO}
            >
              <ExploreCategoryChart data={result.by_category} label={metricLabel} />
            </ChartCard>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">Products</h2>
              <p className="text-xs text-slate-500">
                {formatNumber(result.total_rows)} products. Only {PAGE_SIZE} rows are sent per page.
              </p>
            </div>

            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    {COLUMNS.map((c) => (
                      <th key={c.key} className={`py-2 pr-4 font-semibold ${c.numeric ? "text-right" : ""}`}>
                        <button onClick={() => handleSort(c.key)} className="inline-flex items-center gap-1 uppercase hover:text-slate-900">
                          {c.label}
                          {sortBy === c.key ? (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length} className="py-10 text-center text-slate-500">
                        No products match these filters.
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((r) => (
                      <tr key={r.product_id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{r.product_id}</td>
                        <td className="py-2.5 pr-4 capitalize">{r.brand}</td>
                        <td className="py-2.5 pr-4">{categoryLabel(r.category)}</td>
                        <td className="py-2.5 pr-4 text-right">${formatNumber(r.avg_price)}</td>
                        <td className="py-2.5 pr-4 text-right">{formatNumber(r.views)}</td>
                        <td className="py-2.5 pr-4 text-right">{formatNumber(r.carts)}</td>
                        <td className="py-2.5 pr-4 text-right">{formatNumber(r.purchases)}</td>
                        <td className="py-2.5 pr-4 text-right font-medium">{formatPercent(r.conversion_rate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-1 rounded-lg" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" className="gap-1 rounded-lg" disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default function ExplorePage() {
  const { data, error, loading } = useAsyncData(getFilterOptions)

  if (loading) {
    return (
      <div>
        {header}
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        {header}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load the filter options. {error}
        </div>
      </div>
    )
  }

  return <ExploreContent options={data} />
}