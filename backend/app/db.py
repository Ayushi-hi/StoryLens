import logging

import duckdb

from app.config import settings

log = logging.getLogger("storylens.db")


class DataNotReadyError(RuntimeError):
    """Raised when the Parquet files have not been created yet."""


# One in-memory DuckDB connection. It does not copy data in; it reads the Parquet files on demand.
_con = duckdb.connect()
_ready = False


def init_db() -> bool:
    global _ready
    if not (settings.parquet_path.exists() and settings.aggregate_path.exists()):
        log.warning("Parquet files not found in %s. Run the conversion scripts.", settings.data_dir)
        _ready = False
        return False

    _con.execute(f"SET memory_limit='{settings.duckdb_memory_limit}'")
    _con.execute(
        f"CREATE OR REPLACE VIEW events AS SELECT * FROM read_parquet('{settings.parquet_path.as_posix()}')"
    )
    _con.execute(
        f"CREATE OR REPLACE VIEW daily AS SELECT * FROM read_parquet('{settings.aggregate_path.as_posix()}')"
    )
    _ready = True
    return True


def is_ready() -> bool:
    return _ready


def fetch_all(sql: str, params: list | None = None) -> list[dict]:
    """Run a query and return rows as dictionaries. Always use ? placeholders for values."""
    if not _ready:
        raise DataNotReadyError("The dataset has not been prepared yet. Run the conversion scripts.")
    cur = _con.cursor()  # a cursor per request keeps threads from sharing state
    try:
        cur.execute(sql, params or [])
        columns = [c[0] for c in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]
    finally:
        cur.close()