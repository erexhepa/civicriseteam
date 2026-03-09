from fastapi import Depends

from app.agents.anthropic_chat_agent import AnthropicChatAgent
from app.agents.openai_chat_agent import OpenAIChatAgent
from app.core.config import settings
from app.domain.interfaces import ChatAgentProtocol
from app.services.chat_service import ChatService


def get_chat_agent() -> ChatAgentProtocol:
    """Provide the LLM chat agent for the configured provider."""
    provider = (settings.llm_provider or "anthropic").strip().lower()
    if provider == "openai":
        return OpenAIChatAgent()
    return AnthropicChatAgent()


def get_chat_service(agent: ChatAgentProtocol = Depends(get_chat_agent)) -> ChatService:
    """Provide ChatService with injected agent."""
    return ChatService(agent=agent)
