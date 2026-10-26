"""Check that the aggregate table has exactly the same event counts as the raw Parquet file."""

import sys

from app.db import fetch_all, init_db

if not init_db():
    sys.exit("Parquet files missing. Run the conversion and aggregate scripts first.")

raw = {r["event_type"]: int(r["n"]) for r in fetch_all("SELECT event_type, count(*) AS n FROM events GROUP BY 1")}
agg = fetch_all(
    "SELECT sum(views) AS v, sum(carts) AS c, sum(removes) AS r, sum(purchases) AS p FROM daily"
)[0]

checks = [
    ("view", raw.get("view", 0), int(agg["v"])),
    ("cart", raw.get("cart", 0), int(agg["c"])),
    ("remove_from_cart", raw.get("remove_from_cart", 0), int(agg["r"])),
    ("purchase", raw.get("purchase", 0), int(agg["p"])),
]

ok = True
for name, raw_n, agg_n in checks:
    match = raw_n == agg_n
    ok = ok and match
    print(f"{name:<18} raw={raw_n:>12,}  aggregate={agg_n:>12,}  {'OK' if match else 'MISMATCH'}")

print("All counts match." if ok else "Counts do not match!")
sys.exit(0 if ok else 1)