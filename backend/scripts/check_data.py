"""Quick look at the Parquet file. Reads only a small sample with Polars."""

import polars as pl

from app.config import settings

lazy = pl.scan_parquet(settings.parquet_path)

print("Columns:", lazy.collect_schema().names())
print(lazy.head(5).collect())

counts = (
    lazy.group_by("event_type")
    .agg(pl.len().alias("events"))
    .sort("events", descending=True)
    .collect()
)
print(counts)