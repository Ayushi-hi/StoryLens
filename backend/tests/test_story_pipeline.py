from app.analytics.formatting import category_label, fmt_compact, fmt_pct, fmt_signed_pct
from app.models.story import Story
from app.services import story_cache
from app.services.fallback_story import build_fallback
from tests.conftest import make_input


def test_compact_format_matches_the_frontend():
    assert fmt_compact(40779399) == "40.78M"
    assert fmt_compact(926516) == "926.52K"
    assert fmt_compact(742849) == "742.85K"
    assert fmt_compact(0) == "0"
    assert fmt_compact(950) == "950"


def test_percent_and_label_helpers():
    assert fmt_pct(1.8216) == "1.82%"
    assert fmt_signed_pct(1.94) == "+1.9%"
    assert fmt_signed_pct(-0.44) == "-0.4%"
    assert category_label("electronics.audio.headphone") == "Headphone"
    assert category_label("furniture.living_room.sofa") == "Sofa"


def test_fallback_story_uses_only_supplied_metrics():
    si = make_input()
    story = build_fallback(si)
    assert isinstance(story, Story)
    assert story.source == "template"
    assert "1.82%" in story.summary
    assert [m.value for m in story.supporting_metrics][:3] == ["40.78M", "926.52K", "742.85K"]
    assert story.data_limitations == si.limitations


def test_cache_key_changes_when_any_input_changes():
    si = make_input()
    base = story_cache.make_key(si, {}, "model-a", "v7")
    assert base == story_cache.make_key(si, {}, "model-a", "v7")  # same inputs, same key
    assert base != story_cache.make_key(si, {"category": "apparel.shoes"}, "model-a", "v7")  # filters
    assert base != story_cache.make_key(si, {}, "model-b", "v7")  # model
    assert base != story_cache.make_key(si, {}, "model-a", "v8")  # prompt version
    changed = make_input()
    changed.metrics[0] = type(changed.metrics[0])("views", "Product views", 1.0, "1", "1")
    assert base != story_cache.make_key(changed, {}, "model-a", "v7")  # metric values


def test_cache_roundtrip(isolated_data_dir):
    si = make_input()
    story = build_fallback(si)
    key = story_cache.make_key(si, {}, "model-a", "v7")
    assert story_cache.get(key) is None
    story_cache.put(key, story, si, {}, "model-a", "v7")
    record = story_cache.get(key)
    assert record is not None
    assert Story.model_validate(record["story"]).headline == story.headline
    assert record["model"] == "model-a"
    assert record["prompt_version"] == "v7"