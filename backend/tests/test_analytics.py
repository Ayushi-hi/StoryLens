import pytest

from app.analytics import queries
from app.analytics.filters import Filters
from app.db import fetch_all, init_db

pytestmark = pytest.mark.skipif(not init_db(), reason="Parquet files are not available")

F = Filters()


def test_totals_match_the_raw_event_log():
    raw = {r["event_type"]: int(r["n"]) for r in fetch_all("SELECT event_type, count(*) AS n FROM events GROUP BY 1")}
    t = queries.get_totals(F)
    assert t.views == raw.get("view", 0)
    assert t.carts == raw.get("cart", 0)
    assert t.removes == raw.get("remove_from_cart", 0)
    assert t.purchases == raw.get("purchase", 0)


def test_known_october_2019_numbers():
    t = queries.get_totals(F)
    assert (t.views, t.carts, t.purchases) == (40_779_399, 926_516, 742_849)
    assert t.events == 42_448_764


def test_funnel_is_consistent():
    funnel = queries.get_funnel(F)
    views, cart, purchase = funnel["stages"]
    assert views["count"] >= cart["count"]
    assert purchase["pct_of_views"] == pytest.approx(funnel["overall_conversion"])
    assert cart["drop_off"] == pytest.approx(100 - cart["step_rate"])


def test_distribution_shares_add_up_to_100():
    shares = [row["share"] for row in queries.get_distribution(F)]
    assert sum(shares) == pytest.approx(100.0)


def test_daily_series_adds_up_to_totals():
    daily = queries.get_events_over_time(F)
    assert sum(d["view"] for d in daily) == queries.get_totals(F).views
    assert daily == sorted(daily, key=lambda d: d["date"])


def test_category_filter_reduces_the_total():
    all_views = queries.get_totals(F).views
    shoes = queries.get_totals(Filters(category="apparel.shoes")).views
    assert 0 < shoes < all_views


def test_sql_injection_text_is_treated_as_data():
    evil = Filters(category="x'; DROP TABLE daily; --")
    assert queries.get_totals(evil).views == 0  # matches nothing, and nothing is damaged
    assert queries.get_totals(F).views > 0


def test_products_are_paginated_and_capped():
    page = queries.explore_products(F, "all", None, None, "", "views", "desc", 1, 10)
    assert len(page["rows"]) == 10
    assert page["total_rows"] > 10
    second = queries.explore_products(F, "all", None, None, "", "views", "desc", 2, 10)
    assert {r["product_id"] for r in page["rows"]}.isdisjoint({r["product_id"] for r in second["rows"]})


def test_products_sort_order_is_respected():
    page = queries.explore_products(F, "all", None, None, "", "purchases", "desc", 1, 25)
    values = [r["purchases"] for r in page["rows"]]
    assert values == sorted(values, reverse=True)


def test_invalid_sort_column_is_refused():
    with pytest.raises(ValueError):
        queries.explore_products(F, "all", None, None, "", "price; DROP TABLE daily", "desc", 1, 10)