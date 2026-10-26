from dataclasses import dataclass
from functools import lru_cache

from app.analytics.filters import Filters
from app.db import fetch_all

SORT_COLUMNS = {"product_id", "brand", "category", "avg_price", "views", "carts", "purchases", "conversion_rate"}

# Which counts make up the metric for each event-type filter. These strings are fixed constants.
METRICS = {
    "all": "views + carts + removes + purchases",
    "view": "views",
    "cart": "carts",
    "remove_from_cart": "removes",
    "purchase": "purchases",
}


@dataclass(frozen=True)
class Totals:
    views: int
    carts: int
    removes: int
    purchases: int

    @property
    def events(self) -> int:
        return self.views + self.carts + self.removes + self.purchases


def _pct(part: float, whole: float) -> float:
    return (part / whole * 100) if whole else 0.0


@lru_cache(maxsize=128)
def get_totals(f: Filters) -> Totals:
    where, params = f.where()
    row = fetch_all(
        f"""
        SELECT coalesce(sum(views), 0)     AS views,
               coalesce(sum(carts), 0)     AS carts,
               coalesce(sum(removes), 0)   AS removes,
               coalesce(sum(purchases), 0) AS purchases
        FROM daily{where}
        """,
        params,
    )[0]
    return Totals(int(row["views"]), int(row["carts"]), int(row["removes"]), int(row["purchases"]))


@lru_cache(maxsize=64)
def get_total_users(f: Filters) -> int:
    # The only query that reads the full events file. Cached because it is the slowest.
    where, params = f.where("events")
    return int(fetch_all(f"SELECT count(DISTINCT user_id) AS n FROM events{where}", params)[0]["n"])


def _top(column: str, f: Filters) -> str | None:
    # `column` is an internal constant ("category" or "brand"), never user input.
    where, params = f.where(extra=(f"{column} <> 'unknown'",))
    rows = fetch_all(
        f"SELECT {column} AS name, sum(views) AS v FROM daily{where} GROUP BY 1 ORDER BY v DESC LIMIT 1",
        params,
    )
    return rows[0]["name"] if rows else None


@lru_cache(maxsize=64)
def get_overview(f: Filters) -> dict:
    t = get_totals(f)
    return {
        "total_events": t.events,
        "total_users": get_total_users(f),
        "total_views": t.views,
        "total_carts": t.carts,
        "total_removes": t.removes,
        "total_purchases": t.purchases,
        "conversion_rate": _pct(t.purchases, t.views),
        "top_category": _top("category", f),
        "top_brand": _top("brand", f),
    }


@lru_cache(maxsize=64)
def get_events_over_time(f: Filters) -> list[dict]:
    where, params = f.where()
    rows = fetch_all(
        f"""
        SELECT event_date,
               sum(views) AS view, sum(carts) AS cart,
               sum(removes) AS remove_from_cart, sum(purchases) AS purchase
        FROM daily{where}
        GROUP BY 1 ORDER BY 1
        """,
        params,
    )
    return [
        {
            "date": r["event_date"].isoformat(),
            "view": int(r["view"]),
            "cart": int(r["cart"]),
            "remove_from_cart": int(r["remove_from_cart"]),
            "purchase": int(r["purchase"]),
        }
        for r in rows
    ]


def get_distribution(f: Filters) -> list[dict]:
    t = get_totals(f)
    items = [
        ("view", t.views),
        ("cart", t.carts),
        ("remove_from_cart", t.removes),
        ("purchase", t.purchases),
    ]
    return [{"event_type": k, "count": c, "share": _pct(c, t.events)} for k, c in items]


def get_funnel(f: Filters) -> dict:
    t = get_totals(f)

    def stage(key: str, label: str, count: int, prev: int | None) -> dict:
        return {
            "key": key,
            "label": label,
            "count": count,
            "pct_of_views": _pct(count, t.views),
            "step_rate": _pct(count, prev) if prev else None,
            "drop_off": 100 - _pct(count, prev) if prev else None,
        }

    return {
        "stages": [
            stage("view", "Product views", t.views, None),
            stage("cart", "Cart additions", t.carts, t.views),
            stage("purchase", "Purchases", t.purchases, t.carts),
        ],
        "removed_from_cart": t.removes,
        "overall_conversion": _pct(t.purchases, t.views),
    }


def _breakdown(column: str, f: Filters, limit: int, min_views: int) -> list[dict]:
    # `column` is an internal constant. Items with no category/brand are left out of rankings.
    where, params = f.where(extra=(f"{column} <> 'unknown'",))
    rows = fetch_all(
        f"""
        SELECT {column} AS name,
               sum(views) AS views, sum(carts) AS carts, sum(purchases) AS purchases
        FROM daily{where}
        GROUP BY 1
        HAVING sum(views) >= ?
        ORDER BY views DESC
        LIMIT ?
        """,
        params + [min_views, limit],
    )
    return [
        {
            "name": r["name"],
            "views": int(r["views"]),
            "carts": int(r["carts"]),
            "purchases": int(r["purchases"]),
            "conversion_rate": _pct(int(r["purchases"]), int(r["views"])),
        }
        for r in rows
    ]


@lru_cache(maxsize=64)
def get_categories(f: Filters, limit: int, min_views: int) -> list[dict]:
    return _breakdown("category", f, limit, min_views)


@lru_cache(maxsize=64)
def get_brands(f: Filters, limit: int, min_views: int) -> list[dict]:
    return _breakdown("brand", f, limit, min_views)


@lru_cache(maxsize=1)
def get_filter_options() -> dict:
    cats = fetch_all(
        "SELECT category AS name FROM daily WHERE category <> 'unknown' GROUP BY 1 ORDER BY sum(views) DESC LIMIT 60"
    )
    brands = fetch_all(
        "SELECT brand AS name FROM daily WHERE brand <> 'unknown' GROUP BY 1 ORDER BY sum(views) DESC LIMIT 60"
    )
    dates = fetch_all("SELECT min(event_date) AS lo, max(event_date) AS hi FROM daily")[0]
    return {
        "categories": [c["name"] for c in cats],
        "brands": sorted(b["name"] for b in brands),
        "min_date": dates["lo"].isoformat(),
        "max_date": dates["hi"].isoformat(),
    }


@lru_cache(maxsize=256)
def explore_products(
    f: Filters,
    event_type: str,
    price_min: float | None,
    price_max: float | None,
    search: str,
    sort_by: str,
    sort_dir: str,
    page: int,
    page_size: int,
) -> dict:
    # Values are always passed as ? parameters. Only whitelisted names go into the SQL text.
    if sort_by not in SORT_COLUMNS or event_type not in METRICS or sort_dir not in ("asc", "desc"):
        raise ValueError("Invalid sort or event type")

    metric = METRICS[event_type]
    where, params = f.where()

    outer = [f"({metric}) > 0"]
    outer_params: list = []
    if price_min is not None:
        outer.append("avg_price >= ?")
        outer_params.append(price_min)
    if price_max is not None:
        outer.append("avg_price <= ?")
        outer_params.append(price_max)
    if search:
        like = f"%{search.lower()}%"
        outer.append("(CAST(product_id AS VARCHAR) LIKE ? OR lower(brand) LIKE ? OR lower(category) LIKE ?)")
        outer_params += [like, like, like]

    base = f"""
        WITH p AS (
            SELECT product_id,
                   max(category) AS category,
                   max(brand)    AS brand,
                   coalesce(sum(price_sum) / nullif(sum(price_n), 0), 0) AS avg_price,
                   sum(views) AS views, sum(carts) AS carts,
                   sum(removes) AS removes, sum(purchases) AS purchases
            FROM daily{where}
            GROUP BY product_id
        ),
        f AS (
            SELECT *,
                   CASE WHEN views > 0 THEN purchases * 100.0 / views ELSE 0 END AS conversion_rate
            FROM p
            WHERE {" AND ".join(outer)}
        )
    """
    all_params = params + outer_params

    total = fetch_all(base + " SELECT count(*) AS n FROM f", all_params)[0]["n"]
    by_category = fetch_all(
        base + f" SELECT category, sum({metric}) AS value FROM f GROUP BY 1 ORDER BY value DESC LIMIT 10",
        all_params,
    )
    rows = fetch_all(
        base
        + f"""
        SELECT product_id, brand, category, avg_price, views, carts, removes, purchases, conversion_rate
        FROM f
        ORDER BY {sort_by} {sort_dir} NULLS LAST, product_id
        LIMIT ? OFFSET ?
        """,
        all_params + [page_size, (page - 1) * page_size],
    )

    return {
        "rows": [
            {
                "product_id": int(r["product_id"]),
                "brand": r["brand"],
                "category": r["category"],
                "avg_price": float(r["avg_price"]),
                "views": int(r["views"]),
                "carts": int(r["carts"]),
                "removes": int(r["removes"]),
                "purchases": int(r["purchases"]),
                "conversion_rate": float(r["conversion_rate"]),
            }
            for r in rows
        ],
        "total_rows": int(total),
        "by_category": [{"category": r["category"], "value": int(r["value"])} for r in by_category],
    }