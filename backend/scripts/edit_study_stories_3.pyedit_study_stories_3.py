"""Third round of reviewed wording edits for the frozen study stories.

Usage (from the backend folder, with the virtual environment active):
    python -m scripts.edit_study_stories_3
"""

import sys
import time

from app.services import study_stories

EDITS = [
    (
        "funnel",
        "so_what",
        "While the conversion from cart additions to purchases is relatively strong at 80.18%.",
        "Purchases equal 80.18% of cart additions, so the cart-to-purchase step loses less.",
    ),
    (
        "funnel",
        "now_what",
        "Analyzing specific categories, brands, or products may provide insights into this behavior.",
        "Comparing categories, brands and products may show where it differs.",
    ),
    (
        "trend",
        "now_what",
        "It may be useful to investigate specific categories or products that contributed to the increase in purchases.",
        "It may be useful to compare categories and products to see where the change is largest.",
    ),
    (
        "categories",
        "now_what",
        "Analyzing specific products within these categories may provide additional insights.",
        "Looking at individual products may show where conversion differs.",
    ),
]


def main() -> None:
    records = study_stories.load()
    if not records:
        sys.exit("No study stories found.")

    problems = []
    for story, field, old, _new in EDITS:
        text = records.get(story, {}).get("story", {}).get(field, "")
        if text.count(old) != 1:
            problems.append(f"{story}.{field}: expected exactly one match for: {old[:70]}...")
    if problems:
        print("Nothing was changed. These edits did not match (already applied, or the text differs):")
        for p in problems:
            print(" -", p)
        sys.exit(1)

    for story, field, old, new in EDITS:
        records[story]["story"][field] = records[story]["story"][field].replace(old, new)

    for rec in records.values():
        rec["edited_by_human"] = True
        rec["edited_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    study_stories.save(records)
    print("Applied", len(EDITS), "more edits.")


if __name__ == "__main__":
    main()