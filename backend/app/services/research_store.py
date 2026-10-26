import json
import secrets
import sqlite3
import statistics
import threading
from contextlib import contextmanager
from datetime import datetime, timezone

from app.config import settings

CONDITIONS = ("TRADITIONAL", "STORYTELLING")
TASK_IDS = ("T1", "T2", "T3", "T4")
MIN_COMPLETED_PER_CONDITION = 20  # a practical minimum used by this app, not a power analysis

_lock = threading.Lock()
_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O or 1/I, to avoid typing mistakes

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    session_id     TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL UNIQUE,
    condition      TEXT NOT NULL CHECK (condition IN ('TRADITIONAL', 'STORYTELLING')),
    is_preview     INTEGER NOT NULL DEFAULT 0,
    tasks_json     TEXT NOT NULL,
    materials_json TEXT NOT NULL,
    created_at     TEXT NOT NULL,
    completed_at   TEXT
);
CREATE TABLE IF NOT EXISTS responses (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id    TEXT NOT NULL REFERENCES sessions(session_id),
    task_id       TEXT NOT NULL,
    answer        TEXT NOT NULL,
    correct       INTEGER NOT NULL CHECK (correct IN (0, 1)),
    confidence    INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    started_at    TEXT NOT NULL,
    ended_at      TEXT NOT NULL,
    time_taken_ms INTEGER NOT NULL CHECK (time_taken_ms >= 0),
    reason        TEXT,
    created_at    TEXT NOT NULL,
    UNIQUE (session_id, task_id)
);
"""


class DuplicateResponse(Exception):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect():
    folder = settings.data_dir / "research"
    folder.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(folder / "research.db", timeout=10)
    con.row_factory = sqlite3.Row
    try:
        con.execute("PRAGMA journal_mode = WAL")
        con.execute("PRAGMA foreign_keys = ON")
        con.executescript(_SCHEMA)
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def assign_condition() -> str:
    """Balanced assignment: the group with fewer participants so far, random on a tie."""
    counts = {c: 0 for c in CONDITIONS}
    with connect() as con:
        for row in con.execute(
            "SELECT condition, COUNT(*) AS n FROM sessions WHERE is_preview = 0 GROUP BY condition"
        ):
            counts[row["condition"]] = row["n"]
    if counts["TRADITIONAL"] == counts["STORYTELLING"]:
        return secrets.choice(CONDITIONS)
    return min(counts, key=lambda c: counts[c])


def create_session(session_id: str, condition: str, is_preview: bool, tasks: list[dict], materials: dict) -> str:
    with _lock, connect() as con:
        participant_id = ""
        for _ in range(30):
            candidate = "P-" + "".join(secrets.choice(_ALPHABET) for _ in range(6))
            if not con.execute("SELECT 1 FROM sessions WHERE participant_id = ?", (candidate,)).fetchone():
                participant_id = candidate
                break
        if not participant_id:
            raise RuntimeError("Could not create a unique participant ID.")
        con.execute(
            """INSERT INTO sessions
               (session_id, participant_id, condition, is_preview, tasks_json, materials_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (session_id, participant_id, condition, int(is_preview), json.dumps(tasks), json.dumps(materials), now_iso()),
        )
    return participant_id


def get_session(session_id: str) -> dict | None:
    with connect() as con:
        row = con.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    if row is None:
        return None
    data = dict(row)
    data["tasks"] = json.loads(data.pop("tasks_json"))
    return data


def save_response(
    *,
    session_id: str,
    task_id: str,
    answer: str,
    correct: bool,
    confidence: int,
    started_at: str,
    ended_at: str,
    time_taken_ms: int,
    reason: str | None,
    total_tasks: int,
) -> bool:
    """Store one response. Returns True when the participant has now answered every task."""
    with _lock, connect() as con:
        try:
            con.execute(
                """INSERT INTO responses
                   (session_id, task_id, answer, correct, confidence, started_at, ended_at, time_taken_ms, reason, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (session_id, task_id, answer, int(correct), confidence, started_at, ended_at, time_taken_ms, reason, now_iso()),
            )
        except sqlite3.IntegrityError as exc:
            raise DuplicateResponse() from exc
        answered = con.execute("SELECT COUNT(*) FROM responses WHERE session_id = ?", (session_id,)).fetchone()[0]
        complete = answered >= total_tasks
        if complete:
            con.execute(
                "UPDATE sessions SET completed_at = ? WHERE session_id = ? AND completed_at IS NULL",
                (now_iso(), session_id),
            )
    return complete


def _mean(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


def summarize() -> dict:
    """Real participants only (previews excluded). Nothing here is estimated or invented."""
    with connect() as con:
        sessions = [
            dict(r) for r in con.execute("SELECT session_id, condition, completed_at FROM sessions WHERE is_preview = 0")
        ]
        responses = [
            dict(r)
            for r in con.execute(
                """SELECT s.condition AS condition, r.session_id AS session_id, r.task_id AS task_id,
                          r.correct AS correct, r.confidence AS confidence, r.time_taken_ms AS time_ms
                   FROM responses r JOIN sessions s ON s.session_id = r.session_id
                   WHERE s.is_preview = 0"""
            )
        ]

    conditions: list[dict] = []
    by_task: list[dict] = []
    for cond in CONDITIONS:
        sess = [s for s in sessions if s["condition"] == cond]
        resp = [r for r in responses if r["condition"] == cond]
        times = [r["time_ms"] / 1000 for r in resp]
        conditions.append(
            {
                "condition": cond,
                "participants": len({r["session_id"] for r in resp}),
                "completed": sum(1 for s in sess if s["completed_at"]),
                "responses": len(resp),
                "comprehension_pct": _mean([100.0 * r["correct"] for r in resp]),
                "mean_time_seconds": _mean(times),
                "median_time_seconds": round(statistics.median(times), 2) if times else None,
                "mean_confidence": _mean([float(r["confidence"]) for r in resp]),
            }
        )
        for task_id in TASK_IDS:
            rows = [r for r in resp if r["task_id"] == task_id]
            by_task.append(
                {
                    "task_id": task_id,
                    "condition": cond,
                    "n": len(rows),
                    "correct_pct": _mean([100.0 * r["correct"] for r in rows]),
                    "mean_time_seconds": _mean([r["time_ms"] / 1000 for r in rows]),
                    "mean_confidence": _mean([float(r["confidence"]) for r in rows]),
                }
            )

    done = {c["condition"]: c["completed"] for c in conditions}
    allowed = all(n >= MIN_COMPLETED_PER_CONDITION for n in done.values())
    if sum(c["responses"] for c in conditions) == 0:
        note = "No participants have taken part yet, so there are no results to show."
    elif not allowed:
        note = (
            f"So far {done['TRADITIONAL']} participant(s) have completed the traditional condition and "
            f"{done['STORYTELLING']} the storytelling condition. These figures describe only the people who took part. "
            "With so few participants they cannot show whether storytelling helps, so no conclusion is drawn."
        )
    else:
        note = (
            "Both groups have reached the minimum number of completed participants. These are descriptive figures only. "
            "Run a proper statistical test on the exported data before drawing conclusions."
        )
    return {
        "conditions": conditions,
        "by_task": by_task,
        "min_completed_per_condition": MIN_COMPLETED_PER_CONDITION,
        "conclusions_allowed": allowed,
        "note": note,
    }


def export_rows() -> list[dict]:
    with connect() as con:
        rows = con.execute(
            """SELECT s.participant_id, s.condition, r.task_id, r.started_at, r.ended_at, r.time_taken_ms,
                      r.answer, r.correct, r.confidence, r.reason
               FROM responses r JOIN sessions s ON s.session_id = r.session_id
               WHERE s.is_preview = 0
               ORDER BY s.created_at, r.task_id"""
        ).fetchall()
    return [dict(r) for r in rows]