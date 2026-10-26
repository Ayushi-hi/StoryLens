export type EventType = "view" | "cart" | "remove_from_cart" | "purchase"

export interface Overview {
  total_events: number
  total_users: number
  total_views: number
  total_carts: number
  total_removes: number
  total_purchases: number
  conversion_rate: number // purchases / views, in percent
  top_category: string | null
  top_brand: string | null
}

export interface DailyPoint {
  date: string // YYYY-MM-DD
  view: number
  cart: number
  remove_from_cart: number
  purchase: number
}

export interface EventDistributionItem {
  event_type: EventType
  count: number
  share: number // percent of all events
}

export interface CategoryStat {
  category: string
  views: number
  carts: number
  purchases: number
  conversion_rate: number // purchases / views, in percent
}

export interface OverviewBundle {
  overview: Overview
  daily: DailyPoint[]
  distribution: EventDistributionItem[]
  categories: CategoryStat[]
}