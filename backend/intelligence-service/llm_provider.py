import os
import logging
from abc import ABC, abstractmethod
from typing import Dict, Optional, List
import json

from groq import Groq
from openai import OpenAI

logger = logging.getLogger("LLM_PROVIDER")

class BaseProvider(ABC):
    @abstractmethod
    async def analyze(self, prompt: str, system_prompt: str) -> Dict:
        pass

class GroqProvider(BaseProvider):
    def __init__(self, api_key: str, model: str = "llama-3.2-3b-preview"):
        self.client = Groq(api_key=api_key)
        self.model = model

    async def analyze(self, prompt: str, system_prompt: str) -> Dict:
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                response_format={"type": "json_object"}
            )
            return json.loads(chat_completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq Analysis Error: {e}")
            return {}

class LocalProvider(BaseProvider):
    def __init__(self, base_url: str = "http://localhost:11434/v1", api_key: str = "ollama", model: str = "llama3.2"):
        self.client = OpenAI(base_url=base_url, api_key=api_key)
        self.model = model

    async def analyze(self, prompt: str, system_prompt: str) -> Dict:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Local LLM Analysis Error: {e}")
            return {}

def get_llm_provider() -> Optional[BaseProvider]:
    provider_type = os.getenv("LLM_PROVIDER", "none").lower()
    
    if provider_type == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not found. Defaulting to none.")
            return None
        return GroqProvider(api_key=api_key)
    
    elif provider_type == "local" or provider_type == "ollama":
        base_url = os.getenv("LOCAL_LLM_URL", "http://localhost:11434/v1")
        model = os.getenv("LOCAL_LLM_MODEL", "llama3.2")
        return LocalProvider(base_url=base_url, model=model)
    
    return None
