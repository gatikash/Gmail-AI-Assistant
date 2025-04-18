from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from dotenv import load_dotenv
from gmail_service import GmailService
from email_analyzer import EmailAnalyzer
from email_drafter import EmailDrafter
from ai_analyzer import AIAnalyzer
from database import SessionLocal, engine
from models import User, EmailLog, init_db

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize database
logger.debug("Initializing database...")
init_db(engine)
logger.debug("Database initialized")

def log_email_activity(email: str, message_id: str, moved: bool):
    db = SessionLocal()
    try:
        logger.debug(f"Logging email activity for {email}, message_id: {message_id}, moved: {moved}")
        
        # Get or create user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.debug(f"Creating new user: {email}")
            user = User(email=email)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create email log
        email_log = EmailLog(
            user_id=user.id,
            message_id=message_id,
            moved_to_gator=moved
        )
        db.add(email_log)
        
        # Update user stats if email was moved
        if moved:
            user.total_moved_to_gator += 1
        
        db.commit()
        logger.debug(f"Successfully logged email activity for {email}")
        
    except Exception as e:
        logger.error(f"Error logging email activity: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

# Initialize services
logger.debug("Initializing services...")
gmail_service = GmailService()
email_analyzer = EmailAnalyzer()
email_drafter = EmailDrafter()
ai_analyzer = AIAnalyzer()
logger.debug("Services initialized")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models
class EmailResponse(BaseModel):
    id: str
    thread_id: str
    message_id: str
    subject: str
    from_address: str
    date: str
    snippet: str
    labels: List[str]

class EmailAnalysis(BaseModel):
    topic: str
    sentiment: str
    priority: str
    key_points: List[str]
    action_items: List[str]

class DraftResponse(BaseModel):
    content: str

# Endpoints
@app.get("/auth/url")
async def get_auth_url():
    try:
        auth_url = gmail_service.get_auth_url()
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Error getting auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/callback")
async def auth_callback(code: str):
    try:
        logger.debug(f"Received auth callback with code: {code}")
        credentials = gmail_service.get_credentials(code)
        token = credentials.token
        logger.debug(f"Generated token: {token[:10]}...")
        
        # Redirect to frontend with token
        frontend_url = f"http://localhost:5173/auth/callback?token={token}"
        logger.debug(f"Redirecting to: {frontend_url}")
        return RedirectResponse(url=frontend_url)
    except Exception as e:
        logger.error(f"Error in auth callback: {str(e)}")
        if hasattr(e, 'response'):
            logger.error(f"Error response: {e.response.text}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/callback")
async def auth_callback_post(code: str):
    try:
        logger.debug(f"Received auth callback POST with code: {code}")
        credentials = gmail_service.get_credentials(code)
        token = credentials.token
        
        # Get user email from ID token if available
        email = None
        if hasattr(credentials, 'id_token') and credentials.id_token:
            try:
                import jwt
                decoded_token = jwt.decode(credentials.id_token, options={"verify_signature": False})
                email = decoded_token.get('email')
                logger.debug(f"Extracted email from ID token: {email}")
            except Exception as e:
                logger.warning(f"Could not decode ID token: {str(e)}")
        
        # Format expiry time
        expires_in = None
        if credentials.expiry:
            expires_in = credentials.expiry.isoformat()
            logger.debug(f"Token expires at: {expires_in}")
        
        logger.debug(f"Generated token: {token[:10]}...")
        return {
            "access_token": token,
            "email": email,
            "expires_in": expires_in
        }
    except Exception as e:
        logger.error(f"Error in auth callback POST: {str(e)}")
        if hasattr(e, 'response'):
            logger.error(f"Error response: {e.response.text}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/emails")
async def get_emails(request: Request):
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        access_token = auth_header.split(' ')[1]
        logger.debug(f"Getting emails with token: {access_token[:10]}...")
        
        credentials = gmail_service.get_credentials_from_token(access_token)
        
        # Get user email from credentials
        user_email = credentials.id_token
        if not user_email:
            # Try to get email from userinfo endpoint
            try:
                import requests
                headers = {'Authorization': f'Bearer {access_token}'}
                response = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers=headers)
                if response.status_code == 200:
                    user_info = response.json()
                    user_email = user_info.get('email')
                    logger.debug(f"User email from userinfo: {user_email}")
            except Exception as e:
                logger.warning(f"Could not get user info: {str(e)}")
        
        if not user_email:
            raise HTTPException(status_code=400, detail="Could not determine user email")
        
        # Get emails and process them
        emails, moved_to_gator = gmail_service.list_emails(credentials)
        
        # Log activity for each email
        if user_email:
            for email in emails:
                try:
                    log_email_activity(
                        email=user_email,
                        message_id=email['message_id'],
                        moved=email.get('moved_to_gator', False)
                    )
                except Exception as e:
                    logger.error(f"Error logging email activity: {str(e)}")
                    # Continue processing other emails even if logging fails
        
        logger.debug(f"Retrieved {len(emails)} emails, moved {moved_to_gator} to Lator Gator")
        return {
            "emails": emails,
            "moved_count": moved_to_gator
        }
        
    except Exception as e:
        logger.error(f"Error getting emails: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/emails/{message_id}/trash")
async def move_to_trash(message_id: str, request: Request):
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        access_token = auth_header.split(' ')[1]
        logger.debug(f"Moving email {message_id} to trash")
        
        credentials = gmail_service.get_credentials_from_token(access_token)
        
        # Get user email from credentials for logging
        user_email = None
        if hasattr(credentials, 'id_token') and credentials.id_token:
            try:
                import jwt
                decoded_token = jwt.decode(credentials.id_token, options={"verify_signature": False})
                user_email = decoded_token.get('email')
                logger.debug(f"User email from token: {user_email}")
            except Exception as e:
                logger.warning(f"Could not decode ID token: {str(e)}")
        
        service = gmail_service.get_gmail_service(credentials)
        
        # Move the email to trash
        service.users().messages().trash(userId='me', id=message_id).execute()
        
        # Log the trash activity
        if user_email:
            log_email_activity(user_email, message_id, moved=False)  # moved=False since it's trashed, not moved to Lator Gator
        
        logger.debug(f"Successfully moved email {message_id} to trash")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error moving email to trash: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/emails/{message_id}/analyze")
async def analyze_email(message_id: str, request: Request):
    try:
        logger.debug(f"Analyzing email {message_id}")
        
        # Get credentials and service
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        access_token = auth_header.split(' ')[1]
        logger.debug(f"Using access token: {access_token[:10]}...")
        
        credentials = gmail_service.get_credentials_from_token(access_token)
        service = gmail_service.get_gmail_service(credentials)
        
        # Get email content
        email_content = gmail_service.get_email(service, message_id)
        if not email_content:
            raise HTTPException(status_code=404, detail="Email not found")
        
        # Extract email details
        subject = email_content.get('subject', '')
        from_address = email_content.get('from', '')
        content = email_content.get('content', '')
        
        logger.debug(f"Email details - Subject: {subject}, From: {from_address}")
        
        if not content:
            raise HTTPException(status_code=400, detail="Email content is empty")
        
        # Analyze email using AI
        try:
            analysis = ai_analyzer.analyze_email(subject, content, from_address)
        except ValueError as e:
            logger.error(f"AI analysis error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.exception("Unexpected error in AI analysis")
            raise HTTPException(status_code=500, detail="Failed to analyze email")
        
        if not analysis:
            raise HTTPException(status_code=500, detail="Empty analysis result")
            
        logger.debug(f"Analysis complete: {analysis}")
        return analysis
        
    except HTTPException as e:
        logger.error(f"HTTP error analyzing email: {str(e)}")
        raise
    except Exception as e:
        logger.exception("Unexpected error analyzing email")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/emails/{message_id}/draft-response")
async def draft_response(message_id: str, tone: str, access_token: str):
    try:
        logger.debug(f"Drafting response for email {message_id} with tone {tone}")
        credentials = gmail_service.get_credentials_from_token(access_token)
        service = gmail_service.get_gmail_service(credentials)
        email_content = gmail_service.get_email(service, message_id)
        draft = f"""
        Thank you for your email. I appreciate you reaching out.
        
        I understand your concerns and will address them promptly.
        
        Best regards,
        [Your Name]
        """
        return {"content": draft}
    except Exception as e:
        logger.error(f"Error drafting response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats(request: Request):
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        access_token = auth_header.split(' ')[1]
        logger.debug(f"Getting stats with token: {access_token[:10]}...")
        
        # Get credentials and user email
        credentials = gmail_service.get_credentials_from_token(access_token)
        email = gmail_service.get_user_email(credentials)
        
        if not email:
            raise HTTPException(status_code=400, detail="Could not determine user email")
        
        # Get stats from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                # Create user if not exists
                user = User(email=email)
                db.add(user)
                db.commit()
                db.refresh(user)
            
            # Get total emails processed
            total_emails = db.query(EmailLog).filter(EmailLog.user_id == user.id).count()
            
            return {
                "total_moved_to_gator": user.total_moved_to_gator,
                "total_emails_processed": total_emails,
                "email": email
            }
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 