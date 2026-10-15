import os
from typing import Any, Optional
from langchain_core.language_models.chat_models import BaseChatModel
from app.core.config import settings

def get_llm(temperature: float = 0.3) -> Optional[BaseChatModel]:
    """
    Returns an initialized LangChain ChatModel based on available API keys.
    Supports Groq (free, high-rate-limit), Google Gemini (with multi-model fallback), OpenAI, and Anthropic.
    """
    # 1. Check Groq first if available (Free, blazing fast, 14,400 req/day)
    groq_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if groq_key:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            model="llama-3.3-70b-versatile",
            temperature=temperature,
        )

    # 2. Check Google Gemini
    google_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY")
    if google_key:
        import logging
        logging.getLogger("google_genai.models").setLevel(logging.ERROR)
        from langchain_google_genai import ChatGoogleGenerativeAI
        primary_model = getattr(settings, "GEMINI_MODEL", None) or os.getenv("GEMINI_MODEL") or "gemini-3.5-flash-lite"
        
        primary_llm = ChatGoogleGenerativeAI(
            model=primary_model,
            google_api_key=google_key,
            temperature=temperature,
        )
        
        # Candidate fallback models with working quotas
        fallback_models = [m for m in ["gemini-3.1-flash-lite", "gemini-3.5-flash"] if m != primary_model]
        fallbacks = [
            ChatGoogleGenerativeAI(
                model=m,
                google_api_key=google_key,
                temperature=temperature,
            )
            for m in fallback_models
        ]
        
        try:
            return primary_llm.with_fallbacks(fallbacks)
        except Exception:
            return primary_llm

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
