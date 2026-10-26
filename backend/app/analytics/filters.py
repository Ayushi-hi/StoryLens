from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)  # frozen = hashable, so results can be cached
class Filters:
    date_from: date | None = None
    date_to: date | None = None
    category: str | None = None
    brand: str | None = None

    def where(self, source: str = "daily", extra: tuple[str, ...] = ()) -> tuple[str, list]:
        """Build a WHERE clause with ? placeholders. Values never go into the SQL text."""
        if source == "daily":
            date_col, category_col, brand_col = "event_date", "category", "brand"
        else:  # the full events table
            date_col, category_col, brand_col = "CAST(event_time AS DATE)", "category_code", "brand"

        clauses: list[str] = list(extra)
        params: list = []
        if self.date_from:
            clauses.append(f"{date_col} >= ?")
            params.append(self.date_from)
        if self.date_to:
            clauses.append(f"{date_col} <= ?")
            params.append(self.date_to)
        if self.category:
            clauses.append(f"{category_col} = ?")
            params.append(self.category)
        if self.brand:
            clauses.append(f"{brand_col} = ?")
            params.append(self.brand)

        sql = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        return sql, params