from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.analytics import queries, story_inputs
from app.analytics.filters import Filters
from app.analytics.story_inputs import NoDataError
from app.config import settings
from app.db import is_ready
from app.models.schemas import (
    BrandStat,
    CategoryStat,
    DailyPoint,
    EventDistributionItem,
    ExploreResult,
    FilterOptions,
    FunnelData,
    HealthResponse,
    Overview,
)
from app.models.story import GenerateStoryRequest, GenerateStoryResponse, StoryListItem, VerifiedMetric
from app.services import story_service
from app.services.fallback_story import build_fallback

router = APIRouter(prefix="/api")


def _none_if_all(value: str | None) -> str | None:
    return None if value in (None, "", "all") else value


def filters_dep(
    date_from: date | None = None,
    date_to: date | None = None,
    category: str | None = None,
    brand: str | None = None,
) -> Filters:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must not be after date_to")
    return Filters(date_from, date_to, _none_if_all(category), _none_if_all(brand))


FiltersDep = Annotated[Filters, Depends(filters_dep)]


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", data_ready=is_ready(), ai_enabled=settings.ai_enabled)


@router.get("/overview", response_model=Overview)
def overview(f: FiltersDep):
    return queries.get_overview(f)


@router.get("/events-over-time", response_model=list[DailyPoint])
def events_over_time(f: FiltersDep):
    return queries.get_events_over_time(f)


@router.get("/event-distribution", response_model=list[EventDistributionItem])
def event_distribution(f: FiltersDep):
    return queries.get_distribution(f)


@router.get("/funnel", response_model=FunnelData)
def funnel(f: FiltersDep):
    return queries.get_funnel(f)


@router.get("/categories", response_model=list[CategoryStat])
def categories(
    f: FiltersDep,
    limit: int = Query(10, ge=1, le=50),
    min_views: int = Query(1000, ge=0),
):
    rows = queries.get_categories(f, limit, min_views)
    return [{**r, "category": r["name"]} for r in rows]


@router.get("/brands", response_model=list[BrandStat])
def brands(
    f: FiltersDep,
    limit: int = Query(10, ge=1, le=50),
    min_views: int = Query(1000, ge=0),
):
    rows = queries.get_brands(f, limit, min_views)
    return [{**r, "brand": r["name"]} for r in rows]


@router.get("/products", response_model=ExploreResult)
def products(
    f: FiltersDep,
    event_type: Literal["all", "view", "cart", "remove_from_cart", "purchase"] = "all",
    price_min: float | None = Query(None, ge=0),
    price_max: float | None = Query(None, ge=0),
    search: str = Query("", max_length=100),
    sort_by: Literal[
        "product_id", "brand", "category", "avg_price", "views", "carts", "purchases", "conversion_rate"
    ] = "views",
    sort_dir: Literal["asc", "desc"] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),  # never more than 100 rows leave the server
):
    return queries.explore_products(
        f, event_type, price_min, price_max, search.strip(), sort_by, sort_dir, page, page_size
    )


@router.get("/filters", response_model=FilterOptions)
def filters():
    return queries.get_filter_options()


@router.get("/stories", response_model=list[StoryListItem])
def stories(f: FiltersDep):
    """Template stories plus the exact verified metrics the AI is given for each one."""
    items: list[StoryListItem] = []
    for story_type in story_inputs.BUILDERS:
        try:
            si = story_inputs.build_story_input(story_type, f)
        except NoDataError:
            continue
        items.append(
            StoryListItem(
                story_type=story_type,
                story=build_fallback(si),
                metrics=[VerifiedMetric(key=m.key, label=m.label, value=m.value, display=m.display) for m in si.metrics],
            )
        )
    return items


@router.post("/generate-story", response_model=GenerateStoryResponse)
async def generate_story(req: GenerateStoryRequest):
    if req.date_from and req.date_to and req.date_from > req.date_to:
        raise HTTPException(status_code=422, detail="date_from must not be after date_to")
    try:
        return await story_service.create_story(req)
    except NoDataError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc