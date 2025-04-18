import os
import requests
import logging
import json

logger = logging.getLogger(__name__)

class AIAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("Missing OPENROUTER_API_KEY in .env")

        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "mistralai/mistral-7b-instruct"  # free model

    def analyze_email(self, subject: str, content: str, from_address: str) -> dict:
        if not content:
            raise ValueError("Email content is empty")

        prompt = f"""
Analyze the following email:

Subject: {subject}
From: {from_address}

Body:
{content}

Return:
1. Topic
2. Sentiment (positive, neutral, or negative)
3. Priority (high, medium, low)
4. Category (important, promotional, spam, social, updates)
5. Should it be moved to trash? (yes/no with reason)
"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",  # optional, shows up on OpenRouter stats
            "X-Title": "Gmail-AI-Assistant"           # optional
        }

        try:
            logger.debug("Sending prompt to OpenRouter")
            response = requests.post(
                url=self.api_url,
                headers=headers,
                data=json.dumps(payload)
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            logger.debug(f"OpenRouter Response: {content[:200]}")
            return self._parse_response(content)
        except requests.RequestException as e:
            logger.error(f"OpenRouter API error: {e}")
            raise ValueError(f"OpenRouter API failed: {e}")

    def _parse_response(self, raw: str) -> dict:
        """Parse OpenRouter output into structure used by frontend."""
        lines = raw.split("\n")
        result = {
            "topic": "",
            "sentiment": "",
            "priority": "",
            "category": "other",
            "should_trash": False,
            "key_points": [],
            "action_items": []
        }
        for line in lines:
            line = line.strip().lower()
            if "topic" in line:
                result["topic"] = line.split(":", 1)[-1].strip()
            elif "sentiment" in line:
                result["sentiment"] = line.split(":", 1)[-1].strip()
            elif "priority" in line:
                result["priority"] = line.split(":", 1)[-1].strip()
            elif "category" in line:
                result["category"] = line.split(":", 1)[-1].strip()
            elif "trash" in line:
                result["should_trash"] = "yes" in line
            elif "key points" in line:
                result["key_points"].append(line.split(":", 1)[-1].strip())
            elif "action items" in line:
                result["action_items"].append(line.split(":", 1)[-1].strip())
        return result 