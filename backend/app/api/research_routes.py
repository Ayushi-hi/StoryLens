import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.analytics.story_inputs import NoDataError
from app.models.research import (
    ResponseRequest,
    ResponseResult,
    ResultsResponse,
    SessionRequest,
    SessionResponse,
    TaskView,
)
from app.services import research_store, research_tasks
from app.services.study_stories import StudyNotReady

router = APIRouter(prefix="/api/research")

MAX_TASK_SECONDS = 24 * 3600  # anything longer is treated as a bad timestamp


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


@router.post("/session", response_model=SessionResponse)
def create_session(req: SessionRequest):
    if not req.consent:
        raise HTTPException(status_code=422, detail="Consent is required to take part.")

    is_preview = req.preview_condition is not None
    condition = req.preview_condition or research_store.assign_condition()
    session_id = uuid.uuid4().hex

    try:
        tasks, materials = research_tasks.build_tasks(session_id, condition, allow_draft=is_preview)
    except NoDataError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except StudyNotReady as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    participant_id = research_store.create_session(session_id, condition, is_preview, tasks, materials)
    views = [TaskView.model_validate({k: v for k, v in t.items() if k != "correct_id"}) for t in tasks]
    return SessionResponse(
        session_id=session_id,
        participant_id=participant_id,
        condition=condition,
        is_preview=is_preview,
        tasks=views,
    )


@router.post("/response", response_model=ResponseResult)
def submit_response(req: ResponseRequest):
    session = research_store.get_session(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Unknown session.")
    task = next((t for t in session["tasks"] if t["task_id"] == req.task_id), None)
    if task is None:
        raise HTTPException(status_code=404, detail="Unknown task.")
    if req.answer not in {o["id"] for o in task["options"]}:
        raise HTTPException(status_code=422, detail="The answer is not one of the options.")

    started, ended = _utc(req.started_at), _utc(req.ended_at)
    duration_ms = int((ended - started).total_seconds() * 1000)
    if duration_ms < 0 or duration_ms > MAX_TASK_SECONDS * 1000:
        raise HTTPException(status_code=422, detail="The start and end times are not valid.")

    reason = (req.reason or "").strip() if task["asks_reason"] else ""
    try:
        complete = research_store.save_response(
            session_id=req.session_id,
            task_id=req.task_id,
            answer=req.answer,
            correct=req.answer == task["correct_id"],  # scored on the server, never by the browser
            confidence=req.confidence,
            started_at=started.isoformat(),
            ended_at=ended.isoformat(),
            time_taken_ms=duration_ms,
            reason=reason or None,
            total_tasks=len(session["tasks"]),
        )
    except research_store.DuplicateResponse as exc:
        raise HTTPException(status_code=409, detail="This task was already answered.") from exc
    return ResponseResult(recorded=True, session_complete=complete)


@router.get("/results", response_model=ResultsResponse)
def results():
    return ResultsResponse(label="Observed participant results", **research_store.summarize())


def _csv_safe(value):
    """Stop spreadsheet programs from running text that starts like a formula."""
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


@router.get("/export.csv")
def export_csv():
    columns = [
        "participant_id", "condition", "task_id", "started_at", "ended_at",
        "time_taken_ms", "answer", "correct", "confidence", "reason",
    ]
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=columns)
    writer.writeheader()
    for row in research_store.export_rows():
        writer.writerow({k: _csv_safe(row[k]) for k in columns})
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=storylens_responses.csv"},
    )