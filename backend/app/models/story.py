from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

StoryType = Literal["funnel", "categories", "trend"]
Confidence = Literal["high", "medium", "low"]


class StoryMetric(BaseModel):
    label: str
    value: int | float | str


class Story(BaseModel):
    """What the frontend receives. Numbers and limitations are attached by the server."""

    headline: str
    summary: str
    what: str
    so_what: str
    now_what: str
    supporting_metrics: list[StoryMetric]
    confidence: Confidence
    data_limitations: list[str]
    source: Literal["ai", "template"]


class AiStoryDraft(BaseModel):
    """What the LLM must return. Validated before anything is used."""

    headline: str = Field(min_length=5, max_length=140)
    summary: str = Field(min_length=5, max_length=300)
    what: str = Field(min_length=20, max_length=900)
    so_what: str = Field(min_length=20, max_length=900)
    now_what: str = Field(min_length=20, max_length=900)
    confidence: Confidence
    extra_limitations: list[str] = Field(default_factory=list, max_length=3)


class GenerateStoryRequest(BaseModel):
    story_type: StoryType = "funnel"
    date_from: date | None = None
    date_to: date | None = None
    category: str | None = None
    brand: str | None = None
    force_refresh: bool = False


class GenerateStoryResponse(BaseModel):
    story: Story
    status: Literal["ai", "cached", "fallback"]
    model: str | None = None
    message: str | None = None


class VerifiedMetric(BaseModel):
    key: str
    label: str
    value: float
    display: str


class StoryListItem(BaseModel):
    story_type: StoryType
    story: Story
    metrics: list[VerifiedMetric]