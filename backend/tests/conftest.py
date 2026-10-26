import pytest

from app.analytics.story_inputs import Metric, StoryInput


def make_input(removes: float = 0.0) -> StoryInput:
    """A fixed set of verified metrics with the same keys the real funnel builder produces.

    The tests never depend on the real dataset.
    """
    return StoryInput(
        story_type="funnel",
        metrics=[
            Metric("views", "Product views", 40779399.0, "40.78M", "40,779,399"),
            Metric("carts", "Cart additions", 926516.0, "926.52K", "926,516"),
            Metric("purchases", "Purchases", 742849.0, "742.85K", "742,849"),
            Metric("cart_rate", "Cart additions as a share of views", 2.272, "2.27%", "2.27%"),
            Metric("view_to_cart_drop", "Drop-off from views to cart", 97.728, "97.73%", "97.73%"),
            Metric("purchase_step", "Purchases as a share of cart additions", 80.1766, "80.18%", "80.18%"),
            Metric("cart_to_purchase_drop", "Drop-off from cart to purchase", 19.8234, "19.82%", "19.82%"),
            Metric("overall", "Overall conversion (purchases / views)", 1.8216, "1.82%", "1.82%"),
            Metric("removes", "Remove-from-cart events", removes, "0", "0"),
        ],
        limitations=["Counts are events, not unique shoppers."],
        guidance="Explain the funnel.",
        facts={"overall": 1.8216, "biggest": "product views to cart additions", "biggest_drop": 97.728},
    )


@pytest.fixture
def story_input() -> StoryInput:
    return make_input()


@pytest.fixture
def isolated_data_dir(tmp_path, monkeypatch):
    """Point the app at an empty temporary folder, so tests never touch your real research data."""
    from app.config import settings

    monkeypatch.setattr(settings, "data_dir", tmp_path)
    return tmp_path