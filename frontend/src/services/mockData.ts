import type {
  CategoryStat,
  DailyPoint,
  EventDistributionItem,
  Overview,
} from "@/types/analytics"

// DEMO DATA ONLY. Generated with fixed formulas (no randomness) so it is stable.
// In Step 6 this file is replaced by real DuckDB results from the API.

function buildDaily(): DailyPoint[] {
  const points: DailyPoint[] = []
  for (let i = 0; i < 31; i++) {
    const d = new Date(Date.UTC(2019, 9, 1 + i))
    const dow = d.getUTCDay()
    const weekend = dow === 0 || dow === 6 ? 1.08 : 1
    const wave = 1 + 0.06 * Math.sin(i * 0.9)
    points.push({
      date: d.toISOString().slice(0, 10),
      view: Math.round(40000 * weekend * wave),
      cart: Math.round(5900 * weekend * wave * (1 + i * 0.004)),
      remove_from_cart: Math.round(1950 * weekend * wave),
      purchase: Math.round(1300 * weekend * wave * (1 + i * 0.011)),
    })
  }
  return points
}

export const mockDaily: DailyPoint[] = buildDaily()

const rawCategories = [
  { category: "electronics.smartphone", views: 420000, carts: 61000, purchases: 15200 },
  { category: "computers.notebook", views: 150000, carts: 21000, purchases: 4300 },
  { category: "electronics.video.tv", views: 130000, carts: 15000, purchases: 3100 },
  { category: "electronics.audio.headphone", views: 95000, carts: 14500, purchases: 4600 },
  { category: "appliances.kitchen.washer", views: 85000, carts: 11000, purchases: 2900 },
  { category: "appliances.environment.vacuum", views: 70000, carts: 9800, purchases: 2700 },
  { category: "apparel.shoes", views: 60000, carts: 8200, purchases: 3100 },
  { category: "furniture.living_room.sofa", views: 55000, carts: 6000, purchases: 1100 },
]

export const mockCategories: CategoryStat[] = rawCategories.map((c) => ({
  ...c,
  conversion_rate: (c.purchases / c.views) * 100,
}))

function sumOf(pick: (d: DailyPoint) => number): number {
  return mockDaily.reduce((acc, d) => acc + pick(d), 0)
}

const totalViews = sumOf((d) => d.view)
const totalCarts = sumOf((d) => d.cart)
const totalRemoves = sumOf((d) => d.remove_from_cart)
const totalPurchases = sumOf((d) => d.purchase)
const totalEvents = totalViews + totalCarts + totalRemoves + totalPurchases

export const mockOverview: Overview = {
  total_events: totalEvents,
  total_users: 312480,
  total_views: totalViews,
  total_carts: totalCarts,
  total_removes: totalRemoves,
  total_purchases: totalPurchases,
  conversion_rate: (totalPurchases / totalViews) * 100,
  top_category: mockCategories.reduce((a, b) => (b.views > a.views ? b : a)).category,
  top_brand: "samsung",
}

export const mockDistribution: EventDistributionItem[] = [
  { event_type: "view", count: totalViews },
  { event_type: "cart", count: totalCarts },
  { event_type: "remove_from_cart", count: totalRemoves },
  { event_type: "purchase", count: totalPurchases },
].map((item) => ({
  ...item,
  event_type: item.event_type as EventDistributionItem["event_type"],
  share: (item.count / totalEvents) * 100,
}))