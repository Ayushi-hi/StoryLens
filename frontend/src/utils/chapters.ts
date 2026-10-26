import type { CategoryStat, DailyPoint, OverviewBundle } from "@/types/analytics"
import type { FunnelData, Story } from "@/types/story"
import { categoryLabel, formatCompact, formatPercent } from "./format"
import { buildFunnelStory } from "./stories"

export type ChapterVisual = "funnel" | "categories" | "trend" | "distribution"

export interface Chapter {
  id: string
  visual: ChapterVisual
  story: Story
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(1)}%`
}

function halves(daily: DailyPoint[], pick: (d: DailyPoint) => number) {
  const mid = Math.floor(daily.length / 2)
  const avg = (rows: DailyPoint[]) =>
    rows.length ? rows.reduce((a, d) => a + pick(d), 0) / rows.length : 0
  const first = avg(daily.slice(0, mid))
  const second = avg(daily.slice(mid))
  return { first, second, change: first ? ((second - first) / first) * 100 : 0 }
}

function categoriesStory(categories: CategoryStat[], overall: number): Story {
  const high = categories.reduce((a, b) => (b.conversion_rate > a.conversion_rate ? b : a))
  const low = categories.reduce((a, b) => (b.conversion_rate < a.conversion_rate ? b : a))
  const top = categories.reduce((a, b) => (b.views > a.views ? b : a))
  const gap = high.conversion_rate - low.conversion_rate

  return {
    headline: `${categoryLabel(high.category)} converts best, ${categoryLabel(low.category)} converts least`,
    summary: "Conversion rates differ noticeably between product categories.",
    what:
      `${categoryLabel(high.category)} has the highest conversion rate (${formatPercent(high.conversion_rate)}) and ` +
      `${categoryLabel(low.category)} the lowest (${formatPercent(low.conversion_rate)}). ` +
      `${categoryLabel(top.category)} receives the most views (${formatCompact(top.views)}).`,
    so_what:
      `The gap between the best and worst category is ${gap.toFixed(2)} percentage points. ` +
      `The store-wide rate of ${formatPercent(overall)} is an average of quite different category results.`,
    now_what:
      `Compare the products, brands and price ranges inside ${categoryLabel(low.category)} and ${categoryLabel(high.category)}. ` +
      "The data shows where conversion is low, not why.",
    supporting_metrics: [
      { label: `${categoryLabel(high.category)} conversion`, value: formatPercent(high.conversion_rate) },
      { label: `${categoryLabel(low.category)} conversion`, value: formatPercent(low.conversion_rate) },
      { label: "Store-wide conversion", value: formatPercent(overall) },
    ],
    confidence: "high",
    data_limitations: [
      "Categories differ in price and purchase type, so rates are not a fair ranking of quality.",
      "Only the most-viewed categories are compared. Very small categories are left out.",
    ],
    source: "template",
  }
}

function trendStory(daily: DailyPoint[]): Story {
  const p = halves(daily, (d) => d.purchase)
  const v = halves(daily, (d) => d.view)
  const headline =
    p.change > 5
      ? "Purchases grew over the period"
      : p.change < -5
        ? "Purchases declined over the period"
        : "Purchases were steady over the period"

  let soWhat = "Purchases and views moved at a similar pace."
  if (Math.abs(p.change - v.change) >= 5) {
    soWhat =
      p.change > v.change
        ? "Purchases changed more favorably than views, so a larger share of views ended in a purchase in the second half."
        : "Purchases changed less favorably than views, so a smaller share of views ended in a purchase in the second half."
  }

  return {
    headline,
    summary: "Compares the first half of the period with the second half.",
    what:
      `Average daily purchases went from ${formatCompact(p.first)} to ${formatCompact(p.second)} (${signed(p.change)}). ` +
      `Average daily views went from ${formatCompact(v.first)} to ${formatCompact(v.second)} (${signed(v.change)}).`,
    so_what: soWhat,
    now_what:
      "Check whether the change is concentrated in certain categories, brands or days of the week. " +
      "The data shows the change but not its cause, such as promotions or seasonality.",
    supporting_metrics: [
      { label: "Purchases change", value: signed(p.change) },
      { label: "Views change", value: signed(v.change) },
    ],
    confidence: "medium",
    data_limitations: [
      "A simple first-half versus second-half comparison can hide short spikes.",
      "The dataset does not include promotions or external events.",
    ],
    source: "template",
  }
}

function cartRemovalStory(b: OverviewBundle): Story {
  const { total_carts: carts, total_removes: removes, total_purchases: purchases } = b.overview
  const more = removes > purchases
  return {
    headline: more
      ? "Items are removed from carts more often than they are bought"
      : "Purchases outnumber cart removals",
    summary: "Cart removals are a visible part of the shopping journey.",
    what:
      `There were ${formatCompact(removes)} remove-from-cart events and ${formatCompact(purchases)} purchase events, ` +
      `compared with ${formatCompact(carts)} cart additions.`,
    so_what:
      `Removals equal ${formatPercent((removes / carts) * 100, 1)} of cart additions, ` +
      `while purchases equal ${formatPercent((purchases / carts) * 100, 1)}.`,
    now_what:
      "Find which categories and products have the most removals relative to cart additions. " +
      "The dataset records that items were removed, not why.",
    supporting_metrics: [
      { label: "Cart additions", value: carts },
      { label: "Removals", value: removes },
      { label: "Purchases", value: purchases },
    ],
    confidence: "medium",
    data_limitations: [
      "Events are not unique shoppers.",
      "A removed item may be added again later; these are raw event counts.",
    ],
    source: "template",
  }
}

export function buildChapters(bundle: OverviewBundle, funnel: FunnelData): Chapter[] {
  const chapters: Chapter[] = [{ id: "funnel", visual: "funnel", story: buildFunnelStory(funnel) }]

  if (bundle.categories.length > 0) {
    chapters.push({
      id: "categories",
      visual: "categories",
      story: categoriesStory(bundle.categories, bundle.overview.conversion_rate),
    })
  }

  if (bundle.daily.length >= 2) {
    chapters.push({ id: "trend", visual: "trend", story: trendStory(bundle.daily) })
  }

  // Only tell the removals story if the data actually contains removals.
  if (bundle.overview.total_removes > 0) {
    chapters.push({ id: "removals", visual: "distribution", story: cartRemovalStory(bundle) })
  }

  return chapters
}