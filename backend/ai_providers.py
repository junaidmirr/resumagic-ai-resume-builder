"""
AI Provider Architecture Protocol & Resilience Layer
=====================================================
Abstract interface for Large Language Model providers.
Decouples client endpoints from vendor APIs.
Provides Mock, Gemini, and Swirls fallbacks with latency and error tracking.
"""

from typing import Protocol, Dict, Any, List, Optional
import time
import os


class AIProviderResult:
    def __init__(self, content: str, provider_name: str, latency_ms: float, error: Optional[str] = None):
        self.content = content
        self.provider_name = provider_name
        self.latency_ms = latency_ms
        self.error = error
        self.success = error is None

    def to_dict(self):
        return {
            "provider": self.provider_name,
            "latency_ms": round(self.latency_ms, 2),
            "success": self.success,
            "error": self.error,
        }


class AIProvider(Protocol):
    """Protocol for pluggable, testable AI providers."""
    async def generate_text(self, prompt: str, system_prompt: str = "") -> AIProviderResult:
        ...

    async def parse_document(self, text: str) -> AIProviderResult:
        ...


class MockAIProvider:
    """Mock provider for zero-cost, hermetic testing and offline operation."""
    def __init__(self, name: str = "MockProvider"):
        self.name = name

    def generate_text(self, prompt: str, system_prompt: str = "") -> AIProviderResult:
        t0 = time.time()
        time.sleep(0.01)  # Simulate instant micro-response
        sample_response = '{"elements": [{"id": "mock_1", "element_type": "text", "text": "Software Engineer", "x": 50, "y": 700, "width": 400, "height": 30, "font_size": 18}]}'
        return AIProviderResult(sample_response, self.name, (time.time() - t0) * 1000)

    def parse_document(self, text: str) -> AIProviderResult:
        t0 = time.time()
        sample_parsed = '{"basics": {"name": "Alex Developer", "role": "Senior Engineer"}, "skills": ["Python", "React", "Docker"]}'
        return AIProviderResult(sample_parsed, self.name, (time.time() - t0) * 1000)


class GeminiAIProvider:
    """Production provider connecting to Google Gemini API."""
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        self.name = "Gemini"

    def generate_text(self, prompt: str, system_prompt: str = "") -> AIProviderResult:
        if not self.api_key:
            return AIProviderResult("", self.name, 0.0, error="GEMINI_API_KEY not configured")

        t0 = time.time()
        try:
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": f"{system_prompt}\n\n{prompt}".strip()}]}]
            }
            resp = requests.post(url, json=payload, timeout=20)
            latency = (time.time() - t0) * 1000

            if not resp.ok:
                return AIProviderResult("", self.name, latency, error=f"Gemini API HTTP {resp.status_code}")

            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and candidates[0].get("content", {}).get("parts"):
                text = candidates[0]["content"]["parts"][0].get("text", "")
                return AIProviderResult(text, self.name, latency)
            return AIProviderResult("", self.name, latency, error="Empty response candidates from Gemini")
        except Exception as e:
            return AIProviderResult("", self.name, (time.time() - t0) * 1000, error=str(e))

    def parse_document(self, text: str) -> AIProviderResult:
        prompt = f"Parse the following resume into JSON with sections: basics, summary, experience, skills, education:\n\n{text[:12000]}"
        return self.generate_text(prompt, system_prompt="You are an expert ATS resume parser. Output JSON only.")


class ResilientAIPipeline:
    """
    Coordinates primary and secondary AI providers with automatic fallback,
    telemetry recording, and latency tracking.
    """
    def __init__(self, primary: Optional[AIProvider] = None, fallback: Optional[AIProvider] = None):
        self.primary = primary or (GeminiAIProvider() if os.environ.get("GEMINI_API_KEY") else MockAIProvider())
        self.fallback = fallback or MockAIProvider()

    def execute_with_fallback(self, prompt: str, system_prompt: str = "") -> AIProviderResult:
        # Attempt primary
        res = self.primary.generate_text(prompt, system_prompt)
        if res.success and res.content.strip():
            return res

        print(f"[AIPipeline] ⚠️ Primary provider ({getattr(self.primary, 'name', 'primary')}) failed: {res.error}. Switching to fallback provider.")
        # Fallback
        fallback_res = self.fallback.generate_text(prompt, system_prompt)
        return fallback_res
