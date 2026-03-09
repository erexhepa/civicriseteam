import json
from typing import AsyncIterator

from openai import AsyncOpenAI

from app.core.config import settings
from app.domain.entities import Message
from app.domain.interfaces import ChatAgentProtocol


def _ndjson_chunk(obj: dict) -> str:
    return json.dumps(obj) + "\n"


class OpenAIChatAgent(ChatAgentProtocol):
    """Concrete LLM chat agent using OpenAI (GPT) with streaming."""

    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or settings.llm_api_key
        self._client = AsyncOpenAI(api_key=self._api_key, timeout=30.0) if self._api_key else None
        self._model = settings.llm_model or "gpt-4o"
        self._temperature = settings.llm_temperature

    async def stream(
        self,
        messages: list[Message],
        system_prompt: str,
    ) -> AsyncIterator[str]:
        """Stream NDJSON chunks: same format as Anthropic for frontend compatibility."""
        if not self._api_key:
            yield _ndjson_chunk({"type": "error", "error": "Missing LLM_API_KEY for this provider"})
            return

        formatted = [{"role": m.role, "content": m.content.strip()} for m in messages if m.content.strip()]
        if not formatted:
            return

        openai_messages = [{"role": "system", "content": system_prompt}, *formatted]

        stream = await self._client.chat.completions.create(
            model=self._model,
            messages=openai_messages,
            max_tokens=4096,
            temperature=self._temperature,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                yield _ndjson_chunk({
                    "type": "content_block_delta",
                    "delta": {"type": "text_delta", "text": text},
                })
