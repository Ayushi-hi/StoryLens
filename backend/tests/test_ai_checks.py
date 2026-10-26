import pytest

from app.models.story import AiStoryDraft
from app.services.ai_story_engine import allowed_tokens, extract_json, find_problems
from tests.conftest import make_input


def draft(**overrides) -> AiStoryDraft:
    base = dict(
        headline="Most product views do not reach the cart",
        summary="The data shows a large step-down early in the funnel.",
        what="The data shows 40.78M product views and 926.52K cart additions.",
        so_what="Browsing is much more common than adding to the cart, which may matter.",
        now_what="Compare categories and brands to see where the step-down is smallest.",
        confidence="high",
        extra_limitations=[],
    )
    base.update(overrides)
    return AiStoryDraft(**base)


def test_clean_story_has_no_problems(story_input):
    assert find_problems(draft(), story_input) == []


def test_invented_number_is_rejected(story_input):
    bad = draft(what="The data shows 99.9M product views and 926.52K cart additions.")
    assert any("99.9M" in p for p in find_problems(bad, story_input))


def test_unit_letter_may_be_dropped(story_input):
    # "40.78 million" is the same value as 40.78M, so it must not be rejected for the number.
    ok = draft(what="The data shows 40.78 million product views.")
    assert find_problems(ok, story_input) == []


def test_small_counting_numbers_are_allowed(story_input):
    ok = draft(what="The data shows 3 stages, with 40.78M product views at the start.")
    assert find_problems(ok, story_input) == []


def test_causal_phrase_is_rejected(story_input):
    bad = draft(so_what="The drop is due to high prices.")
    assert any("due to" in p for p in find_problems(bad, story_input))


def test_results_in_is_rejected(story_input):
    bad = draft(what="The data shows 926.52K cart additions, which results in 742.85K purchases.")
    assert any("results in" in p for p in find_problems(bad, story_input))


def test_advice_is_rejected(story_input):
    bad = draft(so_what="Improving this step could be beneficial for the store.")
    assert any("could be beneficial" in p for p in find_problems(bad, story_input))


def test_people_counts_are_rejected(story_input):
    bad = draft(what="The data shows 40.78M users viewed products.")
    assert any("events" in p for p in find_problems(bad, story_input))


def test_removals_are_blocked_when_none_recorded(story_input):
    bad = draft(so_what="Items are not being removed from carts once added.")
    assert any("removals" in p for p in find_problems(bad, story_input))


def test_removals_allowed_when_the_data_has_them():
    with_removals = make_input(removes=5000.0)
    ok = draft(so_what="Some items were removed from carts, which may matter.")
    assert not any("removals" in p for p in find_problems(ok, with_removals))


def test_allowed_tokens_include_display_and_exact(story_input):
    tokens = allowed_tokens(story_input)
    assert {"40.78M", "40.78", "926,516", "1.82%", "1.82"} <= tokens


def test_extract_json_handles_code_fences():
    assert extract_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_extract_json_rejects_text_without_json():
    with pytest.raises(ValueError):
        extract_json("Sorry, I cannot help with that.")