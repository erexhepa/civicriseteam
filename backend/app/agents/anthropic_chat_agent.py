import json
from typing import AsyncIterator

from anthropic import AsyncAnthropic

from app.core.config import settings
from app.domain.entities import Message
from app.domain.interfaces import ChatAgentProtocol

DEFAULT_SYSTEM_PROMPT = """You are TanStack Chat, an AI assistant using Markdown for clear and structured responses. Format your responses following these guidelines:

1. Use headers for sections:
   # For main topics
   ## For subtopics
   ### For subsections

2. For lists and steps:
   - Use bullet points for unordered lists
   - Number steps when sequence matters

3. For code:
   - Use inline `code` for short snippets
   - Use triple backticks with language for blocks

4. For emphasis:
   - Use **bold** for important points
   - Use *italics* for emphasis
   - Use > for important quotes or callouts

5. For structured data: use tables when needed.

6. Break up long responses with clear section headers and bullet points.

Keep responses concise and well-structured. Use appropriate Markdown formatting to enhance readability and understanding."""


def _ndjson_chunk(obj: dict) -> str:
    return json.dumps(obj) + "\n"


class AnthropicChatAgent(ChatAgentProtocol):
    """Concrete LLM chat agent using Claude (Anthropic) with streaming."""

    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or settings.llm_api_key
        self._client = AsyncAnthropic(api_key=self._api_key, timeout=30.0) if self._api_key else None
        self._model = settings.llm_model or "claude-sonnet-4-5-20250929"
        self._temperature = settings.llm_temperature

    async def stream(
        self,
        messages: list[Message],
        system_prompt: str,
    ) -> AsyncIterator[str]:
        """Stream NDJSON chunks: each line has content_block_delta + delta.text for frontend."""
        if not self._api_key:
            yield _ndjson_chunk({"type": "error", "error": "Missing LLM_API_KEY for this provider"})
            return

        formatted = [{"role": m.role, "content": m.content.strip()} for m in messages if m.content.strip()]
        if not formatted:
            return

        async with self._client.messages.stream(
            model=self._model,
            max_tokens=4096,
            system=system_prompt,
            messages=formatted,
            temperature=self._temperature,
        ) as stream:
            async for event in stream:
                if event.type == "text":
                    yield _ndjson_chunk({
                        "type": "content_block_delta",
                        "delta": {"type": "text_delta", "text": event.text},
                    })
