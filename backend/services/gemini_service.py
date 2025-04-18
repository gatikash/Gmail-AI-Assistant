import google.generativeai as genai
from config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        try:
            genai.configure(api_key="APi KEy Here")
            
            # List available models
            available_models = genai.list_models()
            logger.info("Available models:")
            for model in available_models:
                logger.info(f"- {model.name}")
            
            # Use gemini-pro (free tier model)
            self.model = genai.GenerativeModel('gemini-1.5-pro-latest')
            logger.info("Using gemini-pro model")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {str(e)}")
            raise

    def analyze_email(self, email_content):
        try:
            if not email_content:
                raise ValueError("Email content is empty")
                
            prompt = f"""
            Analyze this email and provide a structured response in the following format:
            
            1. Topic: [main topic/subject]
            2. Key Points:
            - [point 1]
            - [point 2]
            - [point 3]
            3. Action Items:
            - [item 1]
            - [item 2]
            4. Sentiment: [positive/negative/neutral]
            5. Priority: [High/Medium/Low]
            
            Email content:
            {email_content}
            """
            
            logger.debug("Sending prompt to Gemini")
            response = self.model.generate_content(prompt)
            
            if not response or not response.text:
                raise ValueError("Empty response from Gemini")
                
            logger.debug(f"Received response: {response.text[:100]}...")
            return response.text
            
        except Exception as e:
            logger.error(f"Error analyzing email: {str(e)}")
            raise

    def draft_response(self, email_content, tone="professional"):
        try:
            if not email_content:
                raise ValueError("Email content is empty")
                
            prompt = f"""
            Draft a {tone} response to this email. Keep it concise and professional.
            
            Original email:
            {email_content}
            """
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Error drafting response: {str(e)}")
            raise 