"""Check the AI provider settings with one tiny request.

Usage (from the backend folder):
    python -m scripts.test_ai
"""

import asyncio

import httpx

from app.config import settings


async def main() -> None:
    print("provider:", settings.ai_provider)
    print("model:   ", settings.ai_model)
    print("url:     ", settings.resolved_base_url)
    print("key set: ", bool(settings.resolved_api_key), "| length:", len(settings.resolved_api_key))

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.resolved_api_key}",
    }
    body = {
        "model": settings.ai_model,
        "messages": [{"role": "user", "content": "Reply with the single word OK."}],
        "max_tokens": 10,
    }
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(f"{settings.resolved_base_url}/chat/completions", headers=headers, json=body)
    print("HTTP status:", r.status_code)
    print(r.text[:600])


asyncio.run(main())