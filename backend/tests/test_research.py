from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.models.story import Story
from app.services import research_tasks, study_stories
from tests.conftest import make_input


def fake_tasks(session_id: str, condition: str, allow_draft: bool):
    """Stand-in for build_tasks, so API tests don't need the real dataset."""
    tasks = [
        {
            "task_id": tid,
            "prompt": f"Question {tid}",
            "hint": None,
            "exhibit": "funnel",
            "options": [{"id": "a", "label": "A"}, {"id": "b", "label": "B"}, {"id": "unknown", "label": "Can't tell"}],
            "correct_id": "a",
            "metrics": [],
            "story": None,
            "asks_reason": tid == "T4",
        }
        for tid in ("T1", "T2", "T3", "T4")
    ]
    return tasks, {"condition": condition}


@pytest.fixture
def client(isolated_data_dir, monkeypatch):
    monkeypatch.setattr(research_tasks, "build_tasks", fake_tasks)
    from app.main import app

    return TestClient(app)


def start(client, **body):
    return client.post("/api/research/session", json={"consent": True, **body})


def answer(client, session, task_id="T1", choice="a", confidence=4, seconds=20):
    ended = datetime.now(timezone.utc)
    return client.post(
        "/api/research/response",
        json={
            "session_id": session["session_id"],
            "task_id": task_id,
            "answer": choice,
            "confidence": confidence,
            "started_at": (ended - timedelta(seconds=seconds)).isoformat(),
            "ended_at": ended.isoformat(),
            "reason": "because" if task_id == "T4" else None,
        },
    )


def make_story() -> Story:
    return Story(
        headline="Headline text",
        summary="Summary text",
        what="What " * 10,
        so_what="So what " * 10,
        now_what="Now what " * 10,
        supporting_metrics=[],
        confidence="high",
        data_limitations=[],
        source="ai",
    )


def test_consent_is_required(client):
    assert client.post("/api/research/session", json={"consent": False}).status_code == 422


def test_session_never_contains_the_correct_answer(client):
    res = start(client)
    assert res.status_code == 200
    assert "correct_id" not in res.text
    assert len(res.json()["tasks"]) == 4


def test_response_does_not_reveal_correctness(client):
    session = start(client).json()
    res = answer(client, session, choice="b")
    assert res.status_code == 200
    assert set(res.json()) == {"recorded", "session_complete"}


def test_duplicate_answer_is_rejected(client):
    session = start(client).json()
    assert answer(client, session).status_code == 200
    assert answer(client, session).status_code == 409


def test_answer_must_be_one_of_the_options(client):
    session = start(client).json()
    assert answer(client, session, choice="not-an-option").status_code == 422


def test_confidence_must_be_between_1_and_5(client):
    session = start(client).json()
    assert answer(client, session, confidence=6).status_code == 422
    assert answer(client, session, confidence=0).status_code == 422


def test_end_before_start_is_rejected(client):
    session = start(client).json()
    now = datetime.now(timezone.utc)
    res = client.post(
        "/api/research/response",
        json={
            "session_id": session["session_id"],
            "task_id": "T1",
            "answer": "a",
            "confidence": 3,
            "started_at": now.isoformat(),
            "ended_at": (now - timedelta(seconds=5)).isoformat(),
        },
    )
    assert res.status_code == 422


def test_unknown_session_is_rejected(client):
    now = datetime.now(timezone.utc).isoformat()
    res = client.post(
        "/api/research/response",
        json={
            "session_id": "does-not-exist",
            "task_id": "T1",
            "answer": "a",
            "confidence": 3,
            "started_at": now,
            "ended_at": now,
        },
    )
    assert res.status_code == 404


def test_scoring_and_results_use_real_responses_only(client):
    for choice in ("a", "b"):  # one correct and one wrong answer, from two participants
        session = start(client).json()
        answer(client, session, task_id="T1", choice=choice, confidence=5, seconds=10)

    results = client.get("/api/research/results").json()
    assert results["label"] == "Observed participant results"
    assert sum(c["responses"] for c in results["conditions"]) == 2
    assert results["conclusions_allowed"] is False  # far below the minimum per group
    scored = [c["comprehension_pct"] for c in results["conditions"] if c["responses"]]
    assert all(value in (0.0, 50.0, 100.0) for value in scored)


def test_completed_session_is_marked(client):
    session = start(client).json()
    results = [answer(client, session, task_id=t).json() for t in ("T1", "T2", "T3", "T4")]
    assert [r["session_complete"] for r in results] == [False, False, False, True]


def test_preview_sessions_are_excluded_from_results(client):
    session = start(client, preview_condition="TRADITIONAL").json()
    assert session["is_preview"] is True
    answer(client, session)
    results = client.get("/api/research/results").json()
    assert sum(c["responses"] for c in results["conditions"]) == 0
    assert "No participants" in results["note"]


def test_empty_results_make_no_claims(client):
    results = client.get("/api/research/results").json()
    for c in results["conditions"]:
        assert c["comprehension_pct"] is None
        assert c["mean_time_seconds"] is None
        assert c["mean_confidence"] is None
    assert results["conclusions_allowed"] is False


def test_assignment_stays_balanced(client):
    conditions = [start(client).json()["condition"] for _ in range(20)]
    for i in range(1, len(conditions) + 1):
        counts = {c: conditions[:i].count(c) for c in ("TRADITIONAL", "STORYTELLING")}
        assert abs(counts["TRADITIONAL"] - counts["STORYTELLING"]) <= 1
    assert conditions.count("TRADITIONAL") == conditions.count("STORYTELLING") == 10


def test_csv_export_is_protected_against_formulas(client):
    session = start(client).json()
    now = datetime.now(timezone.utc)
    res = client.post(
        "/api/research/response",
        json={
            "session_id": session["session_id"],
            "task_id": "T4",
            "answer": "a",
            "confidence": 3,
            "started_at": (now - timedelta(seconds=5)).isoformat(),
            "ended_at": now.isoformat(),
            "reason": '=HYPERLINK("http://bad")',
        },
    )
    assert res.status_code == 200
    csv_text = client.get("/api/research/export.csv").text
    assert "'=HYPERLINK" in csv_text
    assert "participant_id" in csv_text.splitlines()[0]


def test_study_story_must_match_current_data(isolated_data_dir):
    si = make_input()
    study_stories.save(
        {"funnel": {"story": make_story().model_dump(mode="json"), "signature": study_stories.signature(si), "approved": True}}
    )
    loaded, _ = study_stories.get_story("funnel", si, allow_draft=False)
    assert loaded.headline == "Headline text"

    changed = make_input()
    changed.metrics[0] = type(changed.metrics[0])("views", "Product views", 5.0, "5", "5")
    with pytest.raises(study_stories.StudyNotReady):
        study_stories.get_story("funnel", changed, allow_draft=False)


def test_unapproved_story_is_refused_for_participants(isolated_data_dir):
    si = make_input()
    study_stories.save(
        {"funnel": {"story": make_story().model_dump(mode="json"), "signature": study_stories.signature(si), "approved": False}}
    )
    with pytest.raises(study_stories.StudyNotReady):
        study_stories.get_story("funnel", si, allow_draft=False)
    assert study_stories.get_story("funnel", si, allow_draft=True)[0].headline == "Headline text"