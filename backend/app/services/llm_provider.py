"""
Provider abstraction for LLM calls. Reads config from environment variables
(never hardcoded keys). If no provider/key is configured, agents fall back
to deterministic rule-based logic so the whole system still runs end-to-end
without any external API key — useful for local dev/demo.
"""
import json
from abc import ABC, abstractmethod

from app.config.settings import get_settings

settings = get_settings()


class LLMProvider(ABC):
    @abstractmethod
    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        """Ask the model for a structured JSON response."""
        raise NotImplementedError

    @abstractmethod
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        raise NotImplementedError


class AnthropicProvider(LLMProvider):
    def __init__(self):
        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.LLM_MODEL

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        resp = await self.client.messages.create(
            model=self.model,
            max_tokens=800,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in resp.content if block.type == "text")

    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        text = await self.generate_text(
            system_prompt + "\nRespond ONLY with valid JSON, no markdown fences, no preamble.",
            user_prompt,
        )
        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            text = text.split("\n", 1)[1] if "\n" in text else text
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw_text": text}


class NullProvider(LLMProvider):
    """Deterministic fallback used when no LLM API key is configured."""

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        return f"[rule-based] {user_prompt[:200]}"

    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        return {}


_provider_instance: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    if settings.LLM_PROVIDER == "anthropic" and settings.ANTHROPIC_API_KEY:
        _provider_instance = AnthropicProvider()
    else:
        _provider_instance = NullProvider()
    return _provider_instance
