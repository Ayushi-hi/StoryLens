import type {
  CategoryStat,
  DailyPoint,
  EventDistributionItem,
  Overview,
  OverviewBundle,
} from "@/types/analytics"
import type { ExploreQuery, ExploreResult, FilterOptions } from "@/types/explore"
import type { Insight } from "@/types/insights"
import type { FunnelData, GenerateStoryResponse } from "@/types/story"
import { buildFunnelStory } from "@/utils/stories"
import { buildInsights } from "@/utils/insights"
import { buildFunnel } from "@/utils/funnel"
import { apiGet, apiPost } from "./api"
import { mockCategories, mockDaily, mockDistribution, mockOverview } from "./mockData"
import { exploreOptions, runExploreQuery } from "./mockExplore"

// Set VITE_USE_DEMO=true in frontend/.env to use the built-in demo data instead of the API.
export const IS_DEMO = import.meta.env.VITE_USE_DEMO === "true"

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getOverviewBundle(): Promise<OverviewBundle> {
  if (IS_DEMO) {
    await delay()
    return {
      overview: mockOverview,
      daily: mockDaily,
      distribution: mockDistribution,
      categories: mockCategories,
    }
  }

  const [overview, daily, distribution, categories] = await Promise.all([
    apiGet<Overview>("/api/overview"),
    apiGet<DailyPoint[]>("/api/events-over-time"),
    apiGet<EventDistributionItem[]>("/api/event-distribution"),
    apiGet<CategoryStat[]>("/api/categories", { limit: 12, min_views: 5000 }),
  ])
  return { overview, daily, distribution, categories }
}

export async function getFunnel(): Promise<FunnelData> {
  if (IS_DEMO) {
    await delay(400)
    return buildFunnel({
      views: mockOverview.total_views,
      carts: mockOverview.total_carts,
      purchases: mockOverview.total_purchases,
      removes: mockOverview.total_removes,
    })
  }
  return apiGet<FunnelData>("/api/funnel")
}

export async function getStoryInputs(): Promise<{ bundle: OverviewBundle; funnel: FunnelData }> {
  const [bundle, funnel] = await Promise.all([getOverviewBundle(), getFunnel()])
  return { bundle, funnel }
}

export async function getInsights(): Promise<Insight[]> {
  const { bundle, funnel } = await getStoryInputs()
  return buildInsights(bundle, funnel)
}

// Real mode: the backend builds the verified metrics, calls the AI, validates the answer,
// and falls back to a template story if anything goes wrong.
export async function generateFunnelStory(funnel: FunnelData): Promise<GenerateStoryResponse> {
  if (IS_DEMO) {
    await delay(1200)
    return { story: buildFunnelStory(funnel, "template"), status: "demo", model: null, message: null }
  }
  return apiPost<GenerateStoryResponse>("/api/generate-story", { story_type: "funnel" })
}

export async function getFilterOptions(): Promise<FilterOptions> {
  if (IS_DEMO) {
    await delay(200)
    return exploreOptions
  }
  return apiGet<FilterOptions>("/api/filters")
}

export async function queryExplore(q: ExploreQuery): Promise<ExploreResult> {
  if (IS_DEMO) {
    await delay(250)
    return runExploreQuery(q)
  }
  return apiGet<ExploreResult>("/api/products", {
    date_from: q.dateFrom,
    date_to: q.dateTo,
    category: q.category,
    brand: q.brand,
    event_type: q.eventType,
    price_min: q.priceMin,
    price_max: q.priceMax,
    search: q.search,
    sort_by: q.sortBy,
    sort_dir: q.sortDir,
    page: q.page,
    page_size: q.pageSize,
  })
}