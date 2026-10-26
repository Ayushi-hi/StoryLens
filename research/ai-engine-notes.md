# AI story engine: development notes

- Model: openai/gpt-4o-mini via OpenRouter, temperature 0.2, prompt version v7.
- Automated checks: every number must come from the analytics layer; banned causal and advisory phrases; no counts attached to people; no mention of removals when the dataset recorded none.
- Observed problems during development: (1) the model linked unrelated numbers with words such as "only", "indicating", "results in"; (2) it inferred that zero remove-from-cart events meant no one removed items, which is false (the dataset simply has none).
- Handling: stricter prompt, a code check on removals, and human approval of the single story shown to participants.
- Limitation: automated checks verify numbers and some wording, not meaning. Human review is required.
