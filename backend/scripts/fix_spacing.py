import re
import sys

from app.services import study_stories

records = study_stories.load()
changed = []
for name, rec in records.items():
    for field in ("headline", "summary", "what", "so_what", "now_what"):
        text = rec["story"][field]
        fixed = re.sub(r"([.!?])([A-Z])", r"\1 \2", text)
        if fixed != text:
            rec["story"][field] = fixed
            changed.append(f"{name}.{field}")
if not changed:
    sys.exit("No missing spaces found. Nothing changed.")
study_stories.save(records)
print("Fixed:", ", ".join(changed))
