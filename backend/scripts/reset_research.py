"""Delete ALL research sessions and responses. Run it after piloting, before real data collection.
Stop uvicorn first, because Windows locks the database file while the API is running."""

from app.config import settings

db = settings.data_dir / "research" / "research.db"
if not db.exists():
    raise SystemExit("Nothing to delete.")
if input("Type RESET to delete every session and response: ").strip() != "RESET":
    raise SystemExit("Cancelled.")
for suffix in ("", "-wal", "-shm"):
    path = db.with_name(db.name + suffix)
    if path.exists():
        path.unlink()
print("Research data deleted.")