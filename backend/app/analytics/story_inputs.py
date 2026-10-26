from dataclasses import dataclass, field

from app.analytics import queries
from app.analytics.filters import Filters
from app.analytics.formatting import (
    category_label,
    fmt_compact,
    fmt_exact,
    fmt_pct,
    fmt_signed_pct,
)


class NoDataError(ValueError):
    """Raised when the filters leave too little data for a story."""


@dataclass(frozen=True)
class Metric:
    key: str
    label: str
    value: float  # the true number
    display: str  # how the AI must write it
    exact: str  # full number with commas (also allowed)


@dataclass
class StoryInput:
    story_type: str
    metrics: list[Metric]
    limitations: list[str]  # fixed by the server, always shown
    guidance: str
    facts: dict = field(default_factory=dict)  # raw values for the fallback story


def _count(key: str, label: str, value: float) -> Metric:
    return Metric(key, label, float(value), fmt_compact(value), fmt_exact(value))


def _pct(key: str, label: str, value: float) -> Metric:
    text = fmt_pct(value)
    return Metric(key, label, round(float(value), 4), text, text)


def _signed(key: str, label: str, value: float) -> Metric:
    text = fmt_signed_pct(value)
    return Metric(key, label, round(float(value), 4), text, text)


def _funnel(f: Filters) -> StoryInput:
    stages = queries.get_funnel(f)
    views, cart, purchase = stages["stages"]
    removes = stages["removed_from_cart"]
    if views["count"] == 0 or cart["count"] == 0:
        raise NoDataError("There are no views or cart events for these filters.")

    drop_vc, drop_cp = cart["drop_off"], purchase["drop_off"]
    if drop_vc >= drop_cp:
        biggest, biggest_drop = "product views to cart additions", drop_vc
    else:
        biggest, biggest_drop = "cart additions to purchases", drop_cp

    metrics = [
        _count("views", "Product views", views["count"]),
        _count("carts", "Cart additions", cart["count"]),
        _count("purchases", "Purchases", purchase["count"]),
        _pct("cart_rate", "Cart additions as a share of views", cart["pct_of_views"]),
        _pct("view_to_cart_drop", "Drop-off from views to cart", drop_vc),
        _pct("purchase_step", "Purchases as a share of cart additions", purchase["step_rate"]),
        _pct("cart_to_purchase_drop", "Drop-off from cart to purchase", drop_cp),
        _pct("overall", "Overall conversion (purchases / views)", stages["overall_conversion"]),
        _count("removes", "Remove-from-cart events", removes),
    ]
    limitations = [
        "Counts are events, not unique shoppers, so one person can create many events.",
        "The dataset does not explain why shoppers stop before buying.",
        "Cart-to-purchase compares two event counts. It does not prove that each purchase followed a cart addition.",
        "No remove-from-cart events appear in this data, so they are not part of the funnel."
        if removes == 0
        else f"{fmt_compact(removes)} remove-from-cart events are recorded separately and are not subtracted from the funnel.",
    ]
    return StoryInput(
        "funnel",
        metrics,
        limitations,
        "Explain the shopping funnel: views, cart additions and purchases, where the largest "
        "step-down is, and what this does and does not tell us.",
        facts={"biggest": biggest, "biggest_drop": biggest_drop, "overall": stages["overall_conversion"]},
    )


def _categories(f: Filters) -> StoryInput:
    cats = queries.get_categories(f, 12, 5000)
    if len(cats) < 2:
        raise NoDataError("Fewer than two categories have enough views for these filters.")

    totals = queries.get_totals(f)
    overall = totals.purchases / totals.views * 100 if totals.views else 0.0
    high = max(cats, key=lambda c: c["conversion_rate"])
    low = min(cats, key=lambda c: c["conversion_rate"])
    top = max(cats, key=lambda c: c["views"])
    hn, ln, tn = (category_label(c["name"]) for c in (high, low, top))
    gap = high["conversion_rate"] - low["conversion_rate"]

    metrics = [
        _pct("high_rate", f"{hn} conversion (highest)", high["conversion_rate"]),
        _pct("low_rate", f"{ln} conversion (lowest)", low["conversion_rate"]),
        _pct("overall", "Store-wide conversion", overall),
        _count("top_views", f"{tn} views (most viewed)", top["views"]),
        Metric("gap", "Gap between highest and lowest", round(gap, 4), f"{gap:.2f} percentage points", f"{gap:.2f} percentage points"),
    ]
    limitations = [
        "Categories differ in price and purchase type, so rates are not a fair ranking of quality.",
        "Only the most-viewed categories are compared. Very small categories are left out.",
        "Conversion here is purchase events divided by view events, not unique shoppers.",
    ]
    return StoryInput(
        "categories",
        metrics,
        limitations,
        "Compare category conversion: which converts best and worst, which gets the most views, "
        "and how they compare with the store-wide rate.",
        facts={"high": hn, "low": ln, "top": tn},
    )


def _trend(f: Filters) -> StoryInput:
    daily = queries.get_events_over_time(f)
    if len(daily) < 4:
        raise NoDataError("At least four days of data are needed to describe a trend.")

    mid = len(daily) // 2
    first, second = daily[:mid], daily[mid:]

    def avg(rows: list[dict], key: str) -> float:
        return sum(r[key] for r in rows) / len(rows)

    p1, p2 = avg(first, "purchase"), avg(second, "purchase")
    v1, v2 = avg(first, "view"), avg(second, "view")
    p_change = (p2 - p1) / p1 * 100 if p1 else 0.0
    v_change = (v2 - v1) / v1 * 100 if v1 else 0.0

    metrics = [
        _count("days", "Days in the period", len(daily)),
        _count("p_first", "Average daily purchases, first half", p1),
        _count("p_second", "Average daily purchases, second half", p2),
        _signed("p_change", "Change in daily purchases", p_change),
        _count("v_first", "Average daily views, first half", v1),
        _count("v_second", "Average daily views, second half", v2),
        _signed("v_change", "Change in daily views", v_change),
    ]
    limitations = [
        "A first-half versus second-half comparison can hide short spikes.",
        "The dataset does not include promotions, holidays or other outside events.",
    ]
    return StoryInput(
        "trend",
        metrics,
        limitations,
        "Describe how daily purchases and views changed between the first and second half of the period.",
        facts={"p_change": p_change, "v_change": v_change},
    )


BUILDERS = {"funnel": _funnel, "categories": _categories, "trend": _trend}


def build_story_input(story_type: str, f: Filters) -> StoryInput:
    return BUILDERS[story_type](f)