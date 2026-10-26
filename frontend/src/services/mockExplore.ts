import type { ExploreQuery, ExploreResult, FilterOptions, ProductRow } from "@/types/explore"
import { categoryLabel } from "@/utils/format"
import { mockCategories } from "./mockData"

// DEMO DATA ONLY. A small deterministic sample (seeded, so it never changes between reloads).
// It is stored in weekly buckets. The real backend filters by exact day.

interface WeeklyRow {
  week: string
  product_id: number
  brand: string
  category: string
  price: number
  views: number
  carts: number
  removes: number
  purchases: number
}

const WEEKS = ["2019-10-01", "2019-10-08", "2019-10-15", "2019-10-22", "2019-10-29"]
const BRANDS = ["samsung", "apple", "xiaomi", "lg", "sony", "bosch", "nike", "lenovo"]
const PRICE_BASE: Record<string, number> = {
  "electronics.smartphone": 450,
  "computers.notebook": 800,
  "electronics.video.tv": 600,
  "electronics.audio.headphone": 120,
  "appliances.kitchen.washer": 500,
  "appliances.environment.vacuum": 250,
  "apparel.shoes": 90,
  "furniture.living_room.sofa": 700,
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildRows(): WeeklyRow[] {
  const rand = mulberry32(42)
  const rows: WeeklyRow[] = []
  for (let i = 0; i < 64; i++) {
    const cat = mockCategories[i % mockCategories.length]
    const brand = BRANDS[Math.floor(rand() * BRANDS.length)]
    const price = Math.round(PRICE_BASE[cat.category] * (0.6 + rand() * 0.9))
    const popularity = 0.4 + rand() * 1.6
    const convBase = (cat.conversion_rate / 100) * (0.6 + rand() * 0.9)
    for (const week of WEEKS) {
      const views = Math.round(1500 * popularity * (0.8 + rand() * 0.4) * Math.sqrt(cat.views / 100000))
      const carts = Math.round(views * (cat.carts / cat.views) * (0.8 + rand() * 0.4))
      const purchases = Math.min(carts, Math.round(views * convBase * (0.8 + rand() * 0.4)))
      const removes = Math.round(carts * 0.33 * (0.8 + rand() * 0.4))
      rows.push({ week, product_id: 1000000 + i * 137, brand, category: cat.category, price, views, carts, removes, purchases })
    }
  }
  return rows
}

const ALL_ROWS = buildRows()

export const exploreOptions: FilterOptions = {
  categories: mockCategories.map((c) => c.category),
  brands: [...BRANDS].sort(),
  min_date: WEEKS[0],
  max_date: WEEKS[WEEKS.length - 1],
}

type Counts = { views: number; carts: number; removes: number; purchases: number }

function metricOf(r: Counts, eventType: ExploreQuery["eventType"]): number {
  switch (eventType) {
    case "view":
      return r.views
    case "cart":
      return r.carts
    case "remove_from_cart":
      return r.removes
    case "purchase":
      return r.purchases
    default:
      return r.views + r.carts + r.removes + r.purchases
  }
}

// Same steps the DuckDB backend will run in SQL: WHERE, GROUP BY, ORDER BY, LIMIT/OFFSET.
export function runExploreQuery(q: ExploreQuery): ExploreResult {
  const priceMin = q.priceMin === "" ? NaN : Number(q.priceMin)
  const priceMax = q.priceMax === "" ? NaN : Number(q.priceMax)
  const term = q.search.toLowerCase()
  const products = new Map<number, ProductRow>()

  for (const r of ALL_ROWS) {
    if (r.week < q.dateFrom || r.week > q.dateTo) continue
    if (q.category !== "all" && r.category !== q.category) continue
    if (q.brand !== "all" && r.brand !== q.brand) continue
    if (!Number.isNaN(priceMin) && r.price < priceMin) continue
    if (!Number.isNaN(priceMax) && r.price > priceMax) continue

    const cur: ProductRow = products.get(r.product_id) ?? {
      product_id: r.product_id,
      brand: r.brand,
      category: r.category,
      avg_price: r.price,
      views: 0,
      carts: 0,
      removes: 0,
      purchases: 0,
      conversion_rate: 0,
    }
    cur.views += r.views
    cur.carts += r.carts
    cur.removes += r.removes
    cur.purchases += r.purchases
    products.set(r.product_id, cur)
  }

  let list = [...products.values()].filter((p) => metricOf(p, q.eventType) > 0)
  if (term) {
    list = list.filter(
      (p) =>
        String(p.product_id).includes(term) ||
        p.brand.includes(term) ||
        categoryLabel(p.category).toLowerCase().includes(term)
    )
  }
  for (const p of list) p.conversion_rate = p.views ? (p.purchases / p.views) * 100 : 0

  const byCategory = new Map<string, number>()
  for (const p of list) {
    byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + metricOf(p, q.eventType))
  }

  const dir = q.sortDir === "asc" ? 1 : -1
  list.sort((a, b) => {
    const x = a[q.sortBy]
    const y = b[q.sortBy]
    if (typeof x === "string" && typeof y === "string") return x.localeCompare(y) * dir
    return (Number(x) - Number(y)) * dir
  })

  const start = (q.page - 1) * q.pageSize
  return {
    rows: list.slice(start, start + q.pageSize),
    total_rows: list.length,
    by_category: [...byCategory.entries()]
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value),
  }
}