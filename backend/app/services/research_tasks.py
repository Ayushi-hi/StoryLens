import random

from app.analytics import queries, story_inputs
from app.analytics.filters import Filters
from app.analytics.formatting import category_label
from app.analytics.story_inputs import NoDataError, StoryInput
from app.services import study_stories

STABLE_BAND = 5.0  # a change within +/-5% counts as "roughly the same"
UNKNOWN = {"id": "unknown", "label": "I can't tell from the data"}


def _shuffle(options: list[dict], seed: str) -> list[dict]:
    """Shuffle the real options per session; 'can't tell' always stays last."""
    body = list(options)
    random.Random(seed).shuffle(body)
    return [*body, UNKNOWN]


def _pick(si: StoryInput, keys: list[str]) -> list[dict]:
    by_key = {m.key: m for m in si.metrics}
    return [{"label": by_key[k].label, "value": by_key[k].display} for k in keys if k in by_key]


def build_tasks(session_id: str, condition: str, allow_draft: bool) -> tuple[list[dict], dict]:
    """Build the four tasks. Correct answers T1-T3 are computed from the real data, never typed in."""
    f = Filters()
    trend = story_inputs.build_story_input("trend", f)
    cats = story_inputs.build_story_input("categories", f)
    funnel = story_inputs.build_story_input("funnel", f)
    categories = queries.get_categories(f, 12, 5000)  # same parameters the frontend charts use
    stages = queries.get_funnel(f)["stages"]
    if len(categories) < 4:
        raise NoDataError("At least four categories are needed for the study.")

    stories: dict[str, dict | None] = {"trend": None, "categories": None, "funnel": None}
    materials: dict = {"condition": condition, "stories": {}}
    if condition == "STORYTELLING":
        for key, si in (("trend", trend), ("categories", cats), ("funnel", funnel)):
            story, info = study_stories.get_story(key, si, allow_draft)
            stories[key] = story.model_dump(mode="json")
            materials["stories"][key] = info

    # T1: purchases, first half vs second half
    change = trend.facts["p_change"]
    t1_correct = "increase" if change > STABLE_BAND else "decrease" if change < -STABLE_BAND else "stable"
    t1_options = _shuffle(
        [
            {"id": "increase", "label": f"Purchases clearly rose (by more than {STABLE_BAND:.0f}%)"},
            {"id": "decrease", "label": f"Purchases clearly fell (by more than {STABLE_BAND:.0f}%)"},
            {"id": "stable", "label": f"Purchases stayed roughly the same (within {STABLE_BAND:.0f}% either way)"},
        ],
        f"{session_id}:T1",
    )

    # T2: highest conversion category
    best = max(categories, key=lambda c: c["conversion_rate"])
    others = sorted(
        (c for c in categories if c["name"] != best["name"]), key=lambda c: c["views"], reverse=True
    )[:3]
    t2_options = _shuffle(
        [{"id": c["name"], "label": category_label(c["name"])} for c in [best, *others]],
        f"{session_id}:T2",
    )

    # T3: biggest drop-off
    d_view_cart, d_cart_buy = stages[1]["drop_off"], stages[2]["drop_off"]
    if abs(d_view_cart - d_cart_buy) < 1:
        t3_correct = "similar"
    elif d_view_cart > d_cart_buy:
        t3_correct = "views_to_cart"
    else:
        t3_correct = "cart_to_purchase"
    t3_options = _shuffle(
        [
            {"id": "views_to_cart", "label": "From product views to cart additions"},
            {"id": "cart_to_purchase", "label": "From cart additions to purchases"},
            {"id": "similar", "label": "Both steps lose a similar share"},
        ],
        f"{session_id}:T3",
    )

    # T4: rubric-based. The correct option is the one that investigates without assuming a cause.
    t4_options = _shuffle(
        [
            {"id": "investigate_segments", "label": "Break the drop down by product group, brand and date range to see where it is largest"},
            {"id": "assume_price", "label": "Lower prices, because high prices are probably why people leave"},
            {"id": "assume_shipping", "label": "Change shipping options, because shipping costs probably explain the drop"},
            {"id": "no_action", "label": "Nothing more is needed, because the data already explains why views do not become purchases"},
        ],
        f"{session_id}:T4",
    )

    funnel_metrics = _pick(funnel, ["views", "carts", "purchases", "overall"])
    tasks = [
        {
            "task_id": "T1",
            "prompt": "What happened to purchases during this period?",
            "hint": "Compare the average purchases per day in the first half of the month with the second half.",
            "exhibit": "trend",
            "options": t1_options,
            "correct_id": t1_correct,
            "metrics": _pick(trend, ["days", "p_first", "p_second"]),
            "story": stories["trend"],
            "asks_reason": False,
        },
        {
            "task_id": "T2",
            "prompt": "Which category had the highest conversion?",
            "hint": "Conversion means purchases divided by views.",
            "exhibit": "categories",
            "options": t2_options,
            "correct_id": best["name"],
            "metrics": _pick(cats, ["overall"]),
            "story": stories["categories"],
            "asks_reason": False,
        },
        {
            "task_id": "T3",
            "prompt": "Where was the biggest drop-off?",
            "hint": "Compare how many events remain at each step of the shopping journey.",
            "exhibit": "funnel",
            "options": t3_options,
            "correct_id": t3_correct,
            "metrics": funnel_metrics,
            "story": stories["funnel"],
            "asks_reason": False,
        },
        {
            "task_id": "T4",
            "prompt": "What should the business investigate next?",
            "hint": "Choose the option that the data above supports best. You can add a short reason (optional).",
            "exhibit": "funnel",
            "options": t4_options,
            "correct_id": "investigate_segments",
            "metrics": funnel_metrics,
            "story": stories["funnel"],
            "asks_reason": True,
        },
    ]
    return tasks, materials