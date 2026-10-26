import type { CategoryStat, DailyPoint, EventDistributionItem } from "@/types/analytics"
import { categoryLabel, formatCompact, formatDateShort, formatPercent } from "./format"

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length
}

function pctChange(from: number, to: number): number {
  return from === 0 ? 0 : ((to - from) / from) * 100
}

function describeChange(name: string, pct: number): string {
  const abs = Math.abs(pct)
  if (abs < 5) {
    return `${name} stayed roughly stable (${pct >= 0 ? "+" : "-"}${abs.toFixed(1)}%)`
  }
  return pct > 0
    ? `${name} rose by about ${abs.toFixed(0)}%`
    : `${name} fell by about ${abs.toFixed(0)}%`
}

function firstVsSecondHalf(daily: DailyPoint[], pick: (d: DailyPoint) => number): number {
  const mid = Math.floor(daily.length / 2)
  const first = average(daily.slice(0, mid).map(pick))
  const second = average(daily.slice(mid).map(pick))
  return pctChange(first, second)
}

export function explainEventsOverTime(daily: DailyPoint[]): string {
  if (daily.length === 0) return "No data is available for this period."
  const totals = daily.map((d) => ({
    date: d.date,
    total: d.view + d.cart + d.remove_from_cart + d.purchase,
  }))
  const peak = totals.reduce((a, b) => (b.total > a.total ? b : a))
  const low = totals.reduce((a, b) => (b.total < a.total ? b : a))
  const avg = average(totals.map((t) => t.total))
  return (
    `The store averaged ${formatCompact(avg)} events per day. ` +
    `The busiest day was ${formatDateShort(peak.date)} with ${formatCompact(peak.total)} events, ` +
    `and the quietest was ${formatDateShort(low.date)} with ${formatCompact(low.total)}.`
  )
}

export function explainPurchaseTrend(daily: DailyPoint[]): string {
  if (daily.length < 2) return "Not enough data to describe a trend."
  const purchases = firstVsSecondHalf(daily, (d) => d.purchase)
  const views = firstVsSecondHalf(daily, (d) => d.view)
  return (
    `Comparing the first half of the period with the second half, ` +
    `${describeChange("purchases", purchases)}, while ${describeChange("product views", views)}.`
  )
}

export function explainDistribution(items: EventDistributionItem[]): string {
  const view = items.find((i) => i.event_type === "view")
  const purchase = items.find((i) => i.event_type === "purchase")
  if (!view || !purchase) return "Event distribution is not available."
  return (
    `Views make up ${formatPercent(view.share, 1)} of all events, while purchases make up ` +
    `${formatPercent(purchase.share, 1)}. Most activity is browsing rather than buying.`
  )
}

export function explainCategories(categories: CategoryStat[]): string {
  if (categories.length === 0) return "No category data is available."
  const high = categories.reduce((a, b) => (b.conversion_rate > a.conversion_rate ? b : a))
  const low = categories.reduce((a, b) => (b.conversion_rate < a.conversion_rate ? b : a))
  const mostViewed = categories.reduce((a, b) => (b.views > a.views ? b : a))
  return (
    `${categoryLabel(high.category)} has the highest conversion rate (${formatPercent(high.conversion_rate)}), ` +
    `while ${categoryLabel(low.category)} has the lowest (${formatPercent(low.conversion_rate)}). ` +
    `${categoryLabel(mostViewed.category)} gets the most views (${formatCompact(mostViewed.views)}).`
  )
}