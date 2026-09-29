import os
from typing import Any
from langchain_core.language_models.chat_models import BaseChatModel
from app.core.config import settings

def get_llm(temperature: float = 0.3) -> BaseChatModel:
    """
    Returns an initialized LangChain ChatModel based on available API keys.
    Supports Google Gemini, OpenAI, and Anthropic.
    """
    # 1. Check Google Gemini
    google_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY")
    if google_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=google_key,
            temperature=temperature,
        )

    # 2. Check OpenAI
    openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
    if openai_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="gpt-4o-mini",
            openai_api_key=openai_key,
            temperature=temperature,
        )

    # 3. Check Anthropic
    anthropic_key = settings.ANTHROPIC_API_KEY or os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model="claude-3-5-haiku-20241022",
            anthropic_api_key=anthropic_key,
            temperature=temperature,
        )

    # If no LLM key provided, return None (agents will use structured heuristic fallback)
    return None
