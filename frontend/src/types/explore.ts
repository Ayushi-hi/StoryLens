import type { EventType } from "./analytics"

export type SortKey =
  | "product_id"
  | "brand"
  | "category"
  | "avg_price"
  | "views"
  | "carts"
  | "purchases"
  | "conversion_rate"

export interface ExploreFilters {
  dateFrom: string
  dateTo: string
  category: string // "all" or a category code
  brand: string // "all" or a brand
  eventType: "all" | EventType
  priceMin: string
  priceMax: string
}

export interface ExploreQuery extends ExploreFilters {
  search: string
  sortBy: SortKey
  sortDir: "asc" | "desc"
  page: number
  pageSize: number
}

export interface ProductRow {
  product_id: number
  brand: string
  category: string
  avg_price: number
  views: number
  carts: number
  removes: number
  purchases: number
  conversion_rate: number
}

export interface ExploreResult {
  rows: ProductRow[] // only the current page
  total_rows: number
  by_category: { category: string; value: number }[]
}

export interface FilterOptions {
  categories: string[]
  brands: string[]
  min_date: string
  max_date: string
}