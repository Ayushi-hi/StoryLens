import type { FunnelData, Story } from "@/types/story"
import { formatCompact, formatPercent } from "./format"

export function biggestDrop(f: FunnelData) {
  let best = { from: "", to: "", drop: -1 }
  f.stages.forEach((s, i) => {
    if (i > 0 && s.drop_off !== null && s.drop_off > best.drop) {
      best = {
        from: f.stages[i - 1].label.toLowerCase(),
        to: s.label.toLowerCase(),
        drop: s.drop_off,
      }
    }
  })
  return best
}

export function explainFunnel(f: FunnelData): string {
  const [views, carts, purchases] = f.stages
  const big = biggestDrop(f)
  return (
    `Out of ${formatCompact(views.count)} product views, ${formatCompact(carts.count)} were followed by cart additions ` +
    `and ${formatCompact(purchases.count)} by purchases. The largest step-down is from ${big.from} to ${big.to} ` +
    `(${formatPercent(big.drop, 1)} drop).`
  )
}

// Deterministic story built only from verified numbers.
// In Step 7 this is also the fallback when the AI service is unavailable.
export function buildFunnelStory(f: FunnelData, source: Story["source"] = "template"): Story {
  const [views, carts, purchases] = f.stages
  const big = biggestDrop(f)
  const low = f.overall_conversion < 50

  return {
    headline: low
      ? "Most product views never turn into purchases"
      : "A large share of product views turn into purchases",
    summary: `Purchases equal ${formatPercent(f.overall_conversion)} of product views.`,
    what:
      `The data shows ${formatCompact(views.count)} product views, ${formatCompact(carts.count)} cart additions ` +
      `and ${formatCompact(purchases.count)} purchases. Cart additions equal ${formatPercent(carts.pct_of_views, 1)} of views, ` +
      `and purchases equal ${formatPercent(purchases.step_rate ?? 0, 1)} of cart additions.`,
    so_what:
      `The largest step-down is from ${big.from} to ${big.to}, where ${formatPercent(big.drop, 1)} of the previous stage does not continue. ` +
      (low ? "Browsing is much more common than buying." : ""),
    now_what:
      "Compare this step-down across categories, brands and time periods to find where it is smallest and largest. " +
      "The dataset cannot explain why shoppers stop, so reasons need to be investigated separately.",
    supporting_metrics: [
      { label: "Product views", value: views.count },
      { label: "Cart additions", value: carts.count },
      { label: "Purchases", value: purchases.count },
      { label: "Overall conversion", value: formatPercent(f.overall_conversion) },
    ],
    confidence: "high",
    data_limitations: [
      "Counts are events, not unique shoppers, so one person can create many events.",
      "The dataset does not explain why shoppers stop before buying.",
      "Cart-to-purchase compares two event counts. It does not prove that each purchase followed a cart addition.",
      f.removed_from_cart > 0
        ? `${formatCompact(f.removed_from_cart)} remove-from-cart events are recorded separately and are not subtracted from the funnel.`
        : "No remove-from-cart events appear in this data, so they are not part of the funnel.",
    ],
    source,
  }
}