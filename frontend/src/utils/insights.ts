import type { CategoryStat, DailyPoint, OverviewBundle } from "@/types/analytics"
import type { Insight } from "@/types/insights"
import type { FunnelData } from "@/types/story"
import { categoryLabel, formatCompact, formatDateShort, formatPercent } from "./format"
import { biggestDrop } from "./stories"

function maxBy<T>(items: T[], pick: (item: T) => number): T {
  return items.reduce((a, b) => (pick(b) > pick(a) ? b : a))
}

function minBy<T>(items: T[], pick: (item: T) => number): T {
  return items.reduce((a, b) => (pick(b) < pick(a) ? b : a))
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : "-"}${Math.abs(n).toFixed(1)}%`
}

function weeklyBlocks(daily: DailyPoint[]) {
  const blocks: { start: string; end: string; purchases: number }[] = []
  for (let i = 0; i + 7 <= daily.length; i += 7) {
    const slice = daily.slice(i, i + 7)
    blocks.push({
      start: slice[0].date,
      end: slice[6].date,
      purchases: sum(slice.map((d) => d.purchase)),
    })
  }
  return blocks
}

function journeyInsights(funnel: FunnelData): Insight[] {
  const [views, carts, purchases] = funnel.stages
  const big = biggestDrop(funnel)
  return [
    {
      id: "largest-dropoff",
      group: "journey",
      kind: "Largest drop-off",
      title: `The biggest step-down is from ${big.from} to ${big.to}`,
      evidence: [
        { label: "Product views", value: views.count },
        { label: "Cart additions", value: carts.count },
        { label: "Purchases", value: purchases.count },
        { label: "Drop-off at this step", value: formatPercent(big.drop, 1) },
      ],
      explanation:
        `The data shows that ${formatPercent(big.drop, 1)} of the previous stage does not continue to the next one here. ` +
        "This is the point in the journey where the most shoppers stop, but the dataset does not say why.",
      investigation:
        "Compare this step-down across categories and brands to see whether it is similar everywhere or concentrated in a few places.",
    },
  ]
}

function categoryInsights(categories: CategoryStat[], overall: number): Insight[] {
  if (categories.length === 0) return []

  const name = (c: CategoryStat) => categoryLabel(c.category)
  const high = maxBy(categories, (c) => c.conversion_rate)
  const low = minBy(categories, (c) => c.conversion_rate)
  const mostViewed = maxBy(categories, (c) => c.views)
  const mostBought = maxBy(categories, (c) => c.purchases)
  const cartHeavy = maxBy(categories, (c) => c.carts / c.views)
  const totalViews = sum(categories.map((c) => c.views))
  const totalPurchases = sum(categories.map((c) => c.purchases))
  const viewsMedian = median(categories.map((c) => c.views))

  const insights: Insight[] = [
    {
      id: "highest-conversion",
      group: "categories",
      kind: "Highest conversion",
      title: `${name(high)} has the highest purchase conversion`,
      evidence: [
        { label: "Views", value: high.views },
        { label: "Purchases", value: high.purchases },
        { label: "Conversion", value: formatPercent(high.conversion_rate) },
        { label: "Store-wide conversion", value: formatPercent(overall) },
      ],
      explanation:
        `The data shows that ${formatPercent(high.conversion_rate)} of ${name(high)} views are followed by a purchase, ` +
        `compared with ${formatPercent(overall)} across the store. This shows where views most often end in a purchase, not why.`,
      investigation:
        "Check whether this holds across the brands and price ranges inside the category, and whether it is stable from week to week.",
    },
    {
      id: "lowest-conversion",
      group: "categories",
      kind: "Lowest conversion",
      title: `${name(low)} has the lowest purchase conversion`,
      evidence: [
        { label: "Views", value: low.views },
        { label: "Purchases", value: low.purchases },
        { label: "Conversion", value: formatPercent(low.conversion_rate) },
        { label: "Store-wide conversion", value: formatPercent(overall) },
      ],
      explanation:
        `Only ${formatPercent(low.conversion_rate)} of ${name(low)} views are followed by a purchase, ` +
        `compared with ${formatPercent(overall)} across the store. Categories differ in price and buying habits, so a low rate is not automatically a problem.`,
      investigation:
        "Look at the products and price ranges within this category to see whether the low rate is spread evenly or driven by a few products.",
    },
    {
      id: "most-viewed",
      group: "categories",
      kind: "Most viewed",
      title: `${name(mostViewed)} receives the most views`,
      evidence: [
        { label: "Views", value: mostViewed.views },
        { label: "Share of listed-category views", value: formatPercent((mostViewed.views / totalViews) * 100, 1) },
      ],
      explanation:
        `${name(mostViewed)} accounts for ${formatPercent((mostViewed.views / totalViews) * 100, 1)} of views across the listed categories. ` +
        "Views measure attention, which is not the same as sales.",
      investigation: "Compare how this category's share of views differs from its share of purchases.",
    },
    {
      id: "most-purchased",
      group: "categories",
      kind: "Most purchased",
      title: `${name(mostBought)} has the most purchases`,
      evidence: [
        { label: "Purchases", value: mostBought.purchases },
        { label: "Share of listed-category purchases", value: formatPercent((mostBought.purchases / totalPurchases) * 100, 1) },
      ],
      explanation:
        `${name(mostBought)} accounts for ${formatPercent((mostBought.purchases / totalPurchases) * 100, 1)} of purchases across the listed categories.`,
      investigation: "Check whether a few products or brands drive most of these purchases.",
    },
    {
      id: "cart-heavy",
      group: "categories",
      kind: "Cart-heavy",
      title: `${name(cartHeavy)} has the highest share of views that reach the cart`,
      evidence: [
        { label: "Views", value: cartHeavy.views },
        { label: "Cart additions", value: cartHeavy.carts },
        { label: "Cart rate", value: formatPercent((cartHeavy.carts / cartHeavy.views) * 100, 1) },
      ],
      explanation:
        `${formatPercent((cartHeavy.carts / cartHeavy.views) * 100, 1)} of ${name(cartHeavy)} views lead to a cart addition, the highest among the listed categories. ` +
        "The data does not show what happens after the item is in the cart beyond the purchase count.",
      investigation: "Compare this category's cart-to-purchase step with other categories.",
    },
  ]

  const attention = categories.filter((c) => c.views >= viewsMedian && c.conversion_rate < overall)
  if (attention.length > 0) {
    const w = minBy(attention, (c) => c.conversion_rate)
    insights.push({
      id: "high-view-low-purchase",
      group: "categories",
      kind: "High attention, low conversion",
      title: `${name(w)} gets a lot of attention but converts below average`,
      evidence: [
        { label: "Views", value: w.views },
        { label: "Purchases", value: w.purchases },
        { label: "Conversion", value: formatPercent(w.conversion_rate) },
        { label: "Store-wide conversion", value: formatPercent(overall) },
      ],
      explanation:
        `${name(w)} is among the more viewed categories, but ${formatPercent(w.conversion_rate)} of its views end in a purchase, ` +
        `below the store-wide ${formatPercent(overall)}. This is a pattern in the counts, not an explanation of shopper behavior.`,
      investigation:
        "Break this category down by brand and product to find which items have many views but few purchases.",
    })
  }

  return insights
}

function trendInsights(daily: DailyPoint[]): Insight[] {
  const insights: Insight[] = []
  if (daily.length < 4) return insights

  // Fastest growth period: week-over-week change in purchases
  const blocks = weeklyBlocks(daily)
  if (blocks.length >= 2) {
    let best = { index: 1, change: -Infinity }
    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1].purchases
      const change = prev ? ((blocks[i].purchases - prev) / prev) * 100 : 0
      if (change > best.change) best = { index: i, change }
    }
    const cur = blocks[best.index]
    const prev = blocks[best.index - 1]
    insights.push({
      id: "fastest-growth",
      group: "trends",
      kind: "Growth period",
      title:
        best.change > 0
          ? `Purchases grew fastest in the week of ${formatDateShort(cur.start)}`
          : "No week showed growth in purchases over the week before",
      evidence: [
        { label: `${formatDateShort(prev.start)} to ${formatDateShort(prev.end)}`, value: prev.purchases },
        { label: `${formatDateShort(cur.start)} to ${formatDateShort(cur.end)}`, value: cur.purchases },
        { label: "Change", value: signed(best.change) },
      ],
      explanation:
        `Comparing consecutive 7-day periods, the largest change in purchases was ${signed(best.change)}. ` +
        "The data shows when the change happened but not what caused it.",
      investigation:
        "Check whether the change is concentrated in certain categories, and whether it lines up with events outside this dataset, such as promotions.",
    })
  }

  // Unusual days: how far each day is from the average
  const purchases = daily.map((d) => d.purchase)
  const mean = sum(purchases) / purchases.length
  const sd = Math.sqrt(sum(purchases.map((p) => (p - mean) ** 2)) / purchases.length)
  if (sd > 0) {
    const worst = maxBy(daily, (d) => Math.abs(d.purchase - mean))
    const z = (worst.purchase - mean) / sd
    const unusual = Math.abs(z) >= 2
    insights.push({
      id: "unusual-day",
      group: "trends",
      kind: "Unusual change",
      title: unusual
        ? `Purchases on ${formatDateShort(worst.date)} were unusually ${z > 0 ? "high" : "low"}`
        : "No day had unusual purchase volume",
      evidence: [
        { label: "Largest deviation", value: formatDateShort(worst.date) },
        { label: "Purchases that day", value: worst.purchase },
        { label: "Daily average", value: Math.round(mean) },
        { label: "Standard deviations from average", value: z.toFixed(1) },
      ],
      explanation: unusual
        ? "A day is flagged when it sits at least 2 standard deviations from the average. This day crossed that line."
        : "A day is flagged when it sits at least 2 standard deviations from the average. No day crossed that line, so daily purchases were fairly regular.",
      investigation: unusual
        ? "Check which categories contributed to this day and whether the same pattern appears in views."
        : "No action needed here. Repeat the check on a longer period or a single category, where spikes are easier to see.",
    })
  }

  // Overall purchase trend: first half vs second half
  const mid = Math.floor(daily.length / 2)
  const avg = (rows: DailyPoint[]) => sum(rows.map((d) => d.purchase)) / rows.length
  const first = avg(daily.slice(0, mid))
  const second = avg(daily.slice(mid))
  const change = first ? ((second - first) / first) * 100 : 0
  insights.push({
    id: "purchase-trend",
    group: "trends",
    kind: "Purchase trend",
    title:
      change > 5
        ? "Daily purchases are higher in the second half of the period"
        : change < -5
          ? "Daily purchases are lower in the second half of the period"
          : "Daily purchases are steady across the period",
    evidence: [
      { label: "Average per day, first half", value: Math.round(first) },
      { label: "Average per day, second half", value: Math.round(second) },
      { label: "Change", value: signed(change) },
    ],
    explanation:
      `Average daily purchases moved from ${formatCompact(first)} to ${formatCompact(second)} (${signed(change)}). ` +
      "A two-half comparison can hide short spikes, so treat it as a rough direction.",
    investigation: "Compare the trend by category to see which ones drive the overall movement.",
  })

  return insights
}

export function buildInsights(bundle: OverviewBundle, funnel: FunnelData): Insight[] {
  return [
    ...journeyInsights(funnel),
    ...categoryInsights(bundle.categories, bundle.overview.conversion_rate),
    ...trendInsights(bundle.daily),
  ]
}