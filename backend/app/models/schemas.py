from typing import Literal

from pydantic import BaseModel

EventType = Literal["view", "cart", "remove_from_cart", "purchase"]


class HealthResponse(BaseModel):
    status: str
    data_ready: bool
    ai_enabled: bool = False

class Overview(BaseModel):
    total_events: int
    total_users: int
    total_views: int
    total_carts: int
    total_removes: int
    total_purchases: int
    conversion_rate: float  # purchases / views, in percent
    top_category: str | None
    top_brand: str | None


class DailyPoint(BaseModel):
    date: str
    view: int
    cart: int
    remove_from_cart: int
    purchase: int


class EventDistributionItem(BaseModel):
    event_type: EventType
    count: int
    share: float


class FunnelStage(BaseModel):
    key: Literal["view", "cart", "purchase"]
    label: str
    count: int
    pct_of_views: float
    step_rate: float | None
    drop_off: float | None


class FunnelData(BaseModel):
    stages: list[FunnelStage]
    removed_from_cart: int
    overall_conversion: float


class CategoryStat(BaseModel):
    category: str
    views: int
    carts: int
    purchases: int
    conversion_rate: float


class BrandStat(BaseModel):
    brand: str
    views: int
    carts: int
    purchases: int
    conversion_rate: float


class ProductRow(BaseModel):
    product_id: int
    brand: str
    category: str
    avg_price: float
    views: int
    carts: int
    removes: int
    purchases: int
    conversion_rate: float


class CategoryValue(BaseModel):
    category: str
    value: int


class ExploreResult(BaseModel):
    rows: list[ProductRow]
    total_rows: int
    by_category: list[CategoryValue]


class FilterOptions(BaseModel):
    categories: list[str]
    brands: list[str]
    min_date: str
    max_date: str