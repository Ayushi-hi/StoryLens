from app.analytics.story_inputs import StoryInput
from app.models.story import Story, StoryMetric


def _metrics(si: StoryInput) -> list[StoryMetric]:
    return [StoryMetric(label=m.label, value=m.display) for m in si.metrics]


def build_fallback(si: StoryInput) -> Story:
    """A story written by fixed templates from the verified metrics. No AI involved."""
    d = {m.key: m.display for m in si.metrics}

    if si.story_type == "funnel":
        low = si.facts["overall"] < 50
        headline = (
            "Most product views never turn into purchases"
            if low
            else "A large share of product views turn into purchases"
        )
        summary = f"Purchases equal {d['overall']} of product views."
        what = (
            f"The data shows {d['views']} product views, {d['carts']} cart additions and {d['purchases']} purchases. "
            f"Cart additions equal {d['cart_rate']} of views, and purchases equal {d['purchase_step']} of cart additions."
        )
        so_what = (
            f"The largest step-down is from {si.facts['biggest']}, where {si.facts['biggest_drop']:.2f}% "
            "of the previous stage does not continue."
            + (" Browsing is much more common than buying." if low else "")
        )
        now_what = (
            "Compare this step-down across categories, brands and time periods. "
            "The dataset cannot explain why shoppers stop, so reasons need to be investigated separately."
        )
        confidence = "high"

    elif si.story_type == "categories":
        hn, ln, tn = si.facts["high"], si.facts["low"], si.facts["top"]
        headline = f"{hn} converts best, {ln} converts least"
        summary = "Conversion rates differ between product categories."
        what = (
            f"{hn} has the highest conversion rate ({d['high_rate']}) and {ln} the lowest ({d['low_rate']}). "
            f"{tn} receives the most views ({d['top_views']})."
        )
        so_what = (
            f"The gap between the best and worst category is {d['gap']}. "
            f"The store-wide rate of {d['overall']} averages quite different category results."
        )
        now_what = (
            f"Compare the products, brands and price ranges inside {ln} and {hn}. "
            "The data shows where conversion is low, not why."
        )
        confidence = "high"

    else:  # trend
        change = si.facts["p_change"]
        headline = (
            "Purchases grew over the period"
            if change > 5
            else "Purchases declined over the period"
            if change < -5
            else "Purchases were steady over the period"
        )
        summary = "Compares the first half of the period with the second half."
        what = (
            f"Average daily purchases went from {d['p_first']} to {d['p_second']} ({d['p_change']}). "
            f"Average daily views went from {d['v_first']} to {d['v_second']} ({d['v_change']})."
        )
        so_what = "These are changes in event counts between two halves of the period, not a forecast."
        now_what = (
            "Check whether the change is concentrated in certain categories, brands or days of the week. "
            "The data shows the change but not its cause."
        )
        confidence = "medium"

    return Story(
        headline=headline,
        summary=summary,
        what=what,
        so_what=so_what,
        now_what=now_what,
        supporting_metrics=_metrics(si),
        confidence=confidence,
        data_limitations=si.limitations,
        source="template",
    )