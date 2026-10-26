import hashlib
import json
import os

from app.analytics.story_inputs import StoryInput
from app.config import settings
from app.models.story import Story

STORY_TYPES = ("funnel", "categories", "trend")


class StudyNotReady(RuntimeError):
    """The study stories have not been generated or approved yet."""


def _path():
    folder = settings.data_dir / "research"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / "study_stories.json"


def load() -> dict:
    path = _path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def save(records: dict) -> None:
    path = _path()
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(records, indent=2), encoding="utf-8")
    os.replace(tmp, path)


def signature(si: StoryInput) -> str:
    """A fingerprint of the verified metrics. If the data changes, the frozen story no longer matches."""
    blob = json.dumps([[m.key, m.value] for m in si.metrics], sort_keys=True)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:16]


def get_story(story_type: str, si: StoryInput, allow_draft: bool) -> tuple[Story, dict]:
    record = load().get(story_type)
    if not record:
        raise StudyNotReady(
            f"The '{story_type}' study story has not been generated. Run: python -m scripts.study_stories generate"
        )
    if record.get("signature") != signature(si):
        raise StudyNotReady(
            f"The data changed after the '{story_type}' story was frozen. Run generate and approve again."
        )
    if not record.get("approved") and not allow_draft:
        raise StudyNotReady(
            "The study stories are not approved yet. Read them, then run: python -m scripts.study_stories approve"
        )
    story = Story.model_validate(record["story"])
    info = {key: record.get(key) for key in ("model", "prompt_version", "approved", "status")}
    info["source"] = story.source
    return story, info