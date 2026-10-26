"""Convert the raw Kaggle CSV files into one Parquet file.

Usage (from the backend folder, with the virtual environment active):
    python -m scripts.convert_to_parquet
"""

import sys
import time

import duckdb

from app.config import settings


def main() -> None:
    csv_files = sorted(settings.raw_dir.glob("*.csv"))
    if not csv_files:
        sys.exit(f"No CSV files found in {settings.raw_dir}")

    settings.parquet_path.parent.mkdir(parents=True, exist_ok=True)
    glob_pattern = (settings.raw_dir / "*.csv").as_posix()
    out_path = settings.parquet_path.as_posix()

    print(f"Converting {len(csv_files)} file(s): {[f.name for f in csv_files]}")
    start = time.time()

    con = duckdb.connect()
    con.execute("SET memory_limit='4GB'")
    con.execute(f"SET temp_directory='{(settings.data_dir / 'tmp').as_posix()}'")

    con.execute(
        f"""
        COPY (
            SELECT
                CAST(replace(event_time, ' UTC', '') AS TIMESTAMP) AS event_time,
                event_type,
                product_id,
                category_id,
                category_code,
                brand,
                price,
                user_id,
                user_session
            FROM read_csv(
                '{glob_pattern}',
                header = true,
                columns = {{
                    'event_time': 'VARCHAR',
                    'event_type': 'VARCHAR',
                    'product_id': 'BIGINT',
                    'category_id': 'BIGINT',
                    'category_code': 'VARCHAR',
                    'brand': 'VARCHAR',
                    'price': 'DOUBLE',
                    'user_id': 'BIGINT',
                    'user_session': 'VARCHAR'
                }}
            )
        ) TO '{out_path}' (FORMAT PARQUET, COMPRESSION ZSTD)
        """
    )

    rows = con.execute(f"SELECT count(*) FROM read_parquet('{out_path}')").fetchone()[0]
    size_mb = settings.parquet_path.stat().st_size / 1_000_000
    print(f"Done in {time.time() - start:.0f}s: {rows:,} rows, {size_mb:,.0f} MB -> {settings.parquet_path}")


if __name__ == "__main__":
    main()