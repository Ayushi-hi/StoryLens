from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.story import Story, StoryMetric

Condition = Literal["TRADITIONAL", "STORYTELLING"]
TaskId = Literal["T1", "T2", "T3", "T4"]
Exhibit = Literal["trend", "categories", "funnel"]


class TaskOption(BaseModel):
    id: str
    label: str


class TaskView(BaseModel):
    """What a participant receives. It never contains the correct answer."""

    task_id: TaskId
    prompt: str
    hint: str | None = None
    exhibit: Exhibit
    options: list[TaskOption]
    metrics: list[StoryMetric]
    story: Story | None = None
    asks_reason: bool = False


class SessionRequest(BaseModel):
    consent: bool
    preview_condition: Condition | None = None  # researcher preview, excluded from results


class SessionResponse(BaseModel):
    session_id: str
    participant_id: str
    condition: Condition
    is_preview: bool
    tasks: list[TaskView]


class ResponseRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=64)
    task_id: TaskId
    answer: str = Field(min_length=1, max_length=80)
    confidence: int = Field(ge=1, le=5)
    started_at: datetime
    ended_at: datetime
    reason: str | None = Field(default=None, max_length=500)


class ResponseResult(BaseModel):
    recorded: bool
    session_complete: bool
    # There is deliberately no "correct" field: participants get no feedback.


class ConditionStats(BaseModel):
    condition: Condition
    participants: int
    completed: int
    responses: int
    comprehension_pct: float | None
    mean_time_seconds: float | None
    median_time_seconds: float | None
    mean_confidence: float | None


class TaskStats(BaseModel):
    task_id: TaskId
    condition: Condition
    n: int
    correct_pct: float | None
    mean_time_seconds: float | None
    mean_confidence: float | None


class ResultsResponse(BaseModel):
    label: str
    conditions: list[ConditionStats]
    by_task: list[TaskStats]
    min_completed_per_condition: int
    conclusions_allowed: bool
    note: str