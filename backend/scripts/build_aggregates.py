"""Build the small daily-per-product table that most API endpoints read.

Usage (from the backend folder):
    python -m scripts.build_aggregates
"""

import sys
import time

import duckdb

from app.config import settings


def main() -> None:
    if not settings.parquet_path.exists():
        sys.exit(f"Missing {settings.parquet_path}. Run scripts.convert_to_parquet first.")

    src = settings.parquet_path.as_posix()
    out = settings.aggregate_path.as_posix()

    con = duckdb.connect()
    con.execute(f"SET memory_limit='{settings.duckdb_memory_limit}'")
    start = time.time()

    con.execute(
        f"""
        COPY (
            SELECT
                CAST(event_time AS DATE)                          AS event_date,
                product_id,
                coalesce(category_code, 'unknown')                AS category,
                coalesce(brand, 'unknown')                        AS brand,
                count(*) FILTER (WHERE event_type = 'view')             AS views,
                count(*) FILTER (WHERE event_type = 'cart')             AS carts,
                count(*) FILTER (WHERE event_type = 'remove_from_cart') AS removes,
                count(*) FILTER (WHERE event_type = 'purchase')         AS purchases,
                sum(price)                                        AS price_sum,
                count(price)                                      AS price_n
            FROM read_parquet('{src}')
            GROUP BY 1, 2, 3, 4
        ) TO '{out}' (FORMAT PARQUET, COMPRESSION ZSTD)
        """
    )

    rows = con.execute(f"SELECT count(*) FROM read_parquet('{out}')").fetchone()[0]
    size_mb = settings.aggregate_path.stat().st_size / 1_000_000
    print(f"Done in {time.time() - start:.0f}s: {rows:,} aggregate rows, {size_mb:,.0f} MB")


if __name__ == "__main__":
    main()