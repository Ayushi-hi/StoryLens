import hashlib
import json
import os
import time

from app.analytics.story_inputs import StoryInput
from app.config import settings
from app.models.story import Story


def _dir():
    d = settings.data_dir / "cache" / "stories"
    d.mkdir(parents=True, exist_ok=True)
    return d


def make_key(si: StoryInput, filters: dict, model: str, prompt_version: str) -> str:
    """Same dataset + filters + metric values + story type + model + prompt = same key."""
    blob = json.dumps(
        {
            "dataset": settings.dataset_id,
            "type": si.story_type,
            "filters": filters,
            "metrics": [[m.key, m.value] for m in si.metrics],
            "model": model,
            "prompt": prompt_version,
        },
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:32]


def get(key: str) -> dict | None:
    path = _dir() / f"{key}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def put(key: str, story: Story, si: StoryInput, filters: dict, model: str, prompt_version: str) -> None:
    record = {
        "story": story.model_dump(mode="json"),
        "story_type": si.story_type,
        "filters": filters,
        "metrics": [{"key": m.key, "value": m.value, "display": m.display} for m in si.metrics],
        "model": model,
        "prompt_version": prompt_version,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    path = _dir() / f"{key}.json"
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(record, indent=2), encoding="utf-8")
    os.replace(tmp, path)  # atomic, so a crash never leaves a half-written file