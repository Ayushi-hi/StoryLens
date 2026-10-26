"""Second round of reviewed wording edits for the frozen study stories.

Usage (from the backend folder, with the virtual environment active):
    python -m scripts.edit_study_stories_2
"""

import sys
import time

from app.services import study_stories

EDITS = [
    (
        "funnel",
        "so_what",
        "The significant drop-off from views to cart additions shows that",
        "The drop-off from views to cart additions shows that",
    ),
    (
        "funnel",
        "so_what",
        ", the initial engagement appears to be a critical area for further exploration.",
        ".",
    ),
    (
        "funnel",
        "now_what",
        "Further investigation is needed into the factors influencing the high drop-off from views to cart additions.",
        "Further investigation is needed to see where the drop-off from views to cart additions is largest.",
    ),
    (
        "categories",
        "what",
        ", indicating a significant difference between the highest and lowest categories",
        "",
    ),
    (
        "categories",
        "so_what",
        "suggests that certain categories perform better in converting views to purchases",
        "shows that conversion differs between categories",
    ),
    (
        "categories",
        "now_what",
        "Further investigation is needed into the factors driving Smartphone conversions and the reasons behind the low conversion rate for Shoes.",
        "Further investigation is needed to compare products and brands within Smartphone and Shoes.",
    ),
    (
        "trend",
        "so_what",
        "This indicates a slight upward trend in both purchases and views over the period.",
        "Both purchases and views were slightly higher in the second half.",
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