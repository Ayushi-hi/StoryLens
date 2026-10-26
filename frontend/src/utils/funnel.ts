import type { FunnelData, FunnelStage } from "@/types/story"

interface Totals {
  views: number
  carts: number
  purchases: number
  removes: number
}

export function buildFunnel(t: Totals): FunnelData {
  const stage = (
    key: FunnelStage["key"],
    label: string,
    count: number,
    prev: number | null
  ): FunnelStage => ({
    key,
    label,
    count,
    pct_of_views: t.views ? (count / t.views) * 100 : 0,
    step_rate: prev ? (count / prev) * 100 : null,
    drop_off: prev ? 100 - (count / prev) * 100 : null,
  })

  return {
    stages: [
      stage("view", "Product views", t.views, null),
      stage("cart", "Cart additions", t.carts, t.views),
      stage("purchase", "Purchases", t.purchases, t.carts),
    ],
    removed_from_cart: t.removes,
    overall_conversion: t.views ? (t.purchases / t.views) * 100 : 0,
  }
}