import logging

from fastapi.concurrency import run_in_threadpool

from app.analytics import story_inputs
from app.analytics.filters import Filters
from app.config import settings
from app.models.story import GenerateStoryRequest, GenerateStoryResponse, Story
from app.services import story_cache
from app.services.ai_story_engine import PROMPT_VERSION, engine
from app.services.fallback_story import build_fallback

log = logging.getLogger("storylens.story")

UNAVAILABLE = "AI storytelling is temporarily unavailable."
NOT_CONFIGURED = "The AI provider is not configured on the server, so this explanation was calculated directly from the verified metrics."


def _clean(value: str | None) -> str | None:
    return None if value in (None, "", "all") else value


async def create_story(req: GenerateStoryRequest) -> GenerateStoryResponse:
    f = Filters(req.date_from, req.date_to, _clean(req.category), _clean(req.brand))
    filters = {
        k: str(v)
        for k, v in {
            "date_from": f.date_from,
            "date_to": f.date_to,
            "category": f.category,
            "brand": f.brand,
        }.items()
        if v
    }

    # Everything the AI sees is built here from aggregated numbers. No rows, no user IDs.
    si = await run_in_threadpool(story_inputs.build_story_input, req.story_type, f)
    key = story_cache.make_key(si, filters, settings.ai_model, PROMPT_VERSION)

    if not req.force_refresh:
        record = story_cache.get(key)
        if record:
            return GenerateStoryResponse(
                story=Story.model_validate(record["story"]), status="cached", model=record.get("model")
            )

    fallback = build_fallback(si)
    if not engine.enabled:
        return GenerateStoryResponse(story=fallback, status="fallback", message=NOT_CONFIGURED)

    try:
        draft = await engine.generate(si, filters)
    except Exception as exc:  # any AI failure must never break the dashboard
        log.warning("AI story failed (%s): %s", type(exc).__name__, exc)
        return GenerateStoryResponse(story=fallback, status="fallback", message=UNAVAILABLE)

    from app.services.ai_story_engine import compose_story  # local import keeps the top short

    story = compose_story(si, draft)
    story_cache.put(key, story, si, filters, settings.ai_model, PROMPT_VERSION)
    return GenerateStoryResponse(story=story, status="ai", model=settings.ai_model)