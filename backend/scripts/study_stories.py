"""Generate, read and approve the frozen stories shown in the STORYTELLING condition.

Usage (from the backend folder, with the virtual environment active):
    python -m scripts.study_stories generate [--refresh]
    python -m scripts.study_stories show
    python -m scripts.study_stories approve
"""

import argparse
import asyncio
import sys
import textwrap
import time

from app.analytics import story_inputs
from app.analytics.filters import Filters
from app.db import init_db
from app.models.story import GenerateStoryRequest
from app.services import study_stories
from app.services.ai_story_engine import PROMPT_VERSION
from app.services.story_service import create_story


def show() -> None:
    records = study_stories.load()
    if not records:
        print("No study stories yet. Run: python -m scripts.study_stories generate")
        return
    for story_type in study_stories.STORY_TYPES:
        rec = records.get(story_type)
        if not rec:
            print(f"\n=== {story_type}: MISSING ===")
            continue
        si = story_inputs.build_story_input(story_type, Filters())
        story = rec["story"]
        matches = rec.get("signature") == study_stories.signature(si)
        print(f"\n=== {story_type.upper()} ===")
        print(
            f"source: {story['source']} | model: {rec.get('model')} | prompt: {rec.get('prompt_version')} | "
            f"status: {rec.get('status')} | approved: {rec.get('approved', False)} | matches current data: {matches}"
        )
        if story["source"] != "ai":
            print("NOTE: this is the template story, not AI text (the AI call failed or is not configured).")
        print("HEADLINE:", story["headline"])
        for key in ("summary", "what", "so_what", "now_what"):
            print(f"{key.upper()}:", textwrap.fill(story[key], 100, subsequent_indent="  "))


def generate(refresh: bool) -> None:
    records = study_stories.load()
    for story_type in study_stories.STORY_TYPES:
        si = story_inputs.build_story_input(story_type, Filters())
        result = asyncio.run(create_story(GenerateStoryRequest(story_type=story_type, force_refresh=refresh)))
        records[story_type] = {
            "story": result.story.model_dump(mode="json"),
            "status": result.status,
            "model": result.model,
            "prompt_version": PROMPT_VERSION,
            "signature": study_stories.signature(si),
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "approved": False,
        }
    study_stories.save(records)
    show()
    print("\nRead every story carefully. Then run: python -m scripts.study_stories approve")


def approve() -> None:
    records = study_stories.load()
    missing = [t for t in study_stories.STORY_TYPES if t not in records]
    if missing:
        sys.exit(f"Missing stories: {missing}. Run generate first.")
    show()
    answer = input("\nHave you read all three stories and found no false or unsupported claims? Type APPROVE: ")
    if answer.strip() != "APPROVE":
        sys.exit("Not approved.")
    for rec in records.values():
        rec["approved"] = True
        rec["approved_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    study_stories.save(records)
    print("Approved. Participants in the STORYTELLING condition will see exactly these stories.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    gen = sub.add_parser("generate", help="create draft study stories (uses the cache; free if already generated)")
    gen.add_argument("--refresh", action="store_true", help="ask the AI for new stories (costs a little credit)")
    sub.add_parser("show", help="print the current study stories")
    sub.add_parser("approve", help="approve the stories after reading them")
    args = parser.parse_args()

    if not init_db():
        sys.exit("The Parquet files are missing. Run the conversion scripts first.")
    if args.command == "generate":
        generate(args.refresh)
    elif args.command == "show":
        show()
    else:
        approve()


if __name__ == "__main__":
    main()