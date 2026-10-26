"""Apply the reviewed wording edits to the frozen study stories.

Usage (from the backend folder, with the virtual environment active):
    python -m scripts.edit_study_stories
"""

import sys
import time

from app.services import study_stories

# (story, field, old text, new text). Each old text must appear exactly once.
EDITS = [
    ("funnel", "what", "This indicates a drop-off of", "The drop-off is"),
    (
        "funnel",
        "so_what",
        "suggests that many potential purchases are not progressing through the funnel",
        "shows that most views do not reach the cart",
    ),
    ("categories", "so_what", ", highlighting their popularity", ""),
    (
        "trend",
        "so_what",
        "The modest increases suggest that engagement may have improved, but further investigation is needed to understand the factors influencing these changes.",
        "The changes are small, and the data does not show what caused them.",
    ),
]


def main() -> None:
    records = study_stories.load()
    if not records:
        sys.exit("No study stories found.")

    problems = []
    for story, field, old, new in EDITS:
        text = records.get(story, {}).get("story", {}).get(field, "")
        if text.count(old) != 1:
            problems.append(f"{story}.{field}: expected exactly one match for: {old[:60]}...")
    if problems:
        print("Nothing was changed. These edits did not match (already applied or text differs):")
        for p in problems:
            print(" -", p)
        sys.exit(1)

    for story, field, old, new in EDITS:
        records[story]["story"][field] = records[story]["story"][field].replace(old, new)

    for rec in records.values():
        rec["edited_by_human"] = True
        rec["edited_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    study_stories.save(records)
    print("Applied", len(EDITS), "edits. The original text is in study_stories_original.json.")


if __name__ == "__main__":
    main()