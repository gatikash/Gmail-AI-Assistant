from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os
import json
import logging
from typing import List, Dict, Any, Optional
import pickle
from datetime import datetime
import requests

logger = logging.getLogger(__name__)

class GmailService:
    def __init__(self):
        # Update scopes to include userinfo.email
        self.SCOPES = [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/userinfo.email'  # Add this scope
             ,"openid"  
        ]
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/auth/callback')
        
        if not self.client_id or not self.client_secret:
            raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables")
        
    def get_auth_url(self) -> str:
        try:
            logger.debug("Getting auth URL...")
            flow = InstalledAppFlow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES,
                redirect_uri=self.redirect_uri
            )
            auth_url, _ = flow.authorization_url(
                access_type='offline',
                prompt='consent',  # forces re-consent
                include_granted_scopes=False  # prevents scope merging
            )
            logger.debug(f"Generated auth URL: {auth_url}")
            return auth_url
        except Exception as e:
            logger.error(f"Error getting auth URL: {str(e)}")
            raise

    def get_credentials(self, code: str) -> Credentials:
        try:
            logger.debug("Getting credentials from code...")
            flow = InstalledAppFlow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES,
                redirect_uri=self.redirect_uri
            )
            
            # Log the code and redirect URI for debugging
            logger.debug(f"Code received: {code}")
            logger.debug(f"Using redirect URI: {self.redirect_uri}")
            
            # Fetch token with detailed error handling
            try:
                flow.fetch_token(code=code)
                credentials = flow.credentials
                logger.debug("Successfully obtained credentials")
                logger.debug(f"Access token: {credentials.token}")
                logger.debug(f"Refresh token: {credentials.refresh_token}")
                return credentials
            except Exception as token_error:
                logger.error(f"Error fetching token: {str(token_error)}")
                if hasattr(token_error, 'response'):
                    logger.error(f"Error response: {token_error.response.text}")
                raise
                
        except Exception as e:
            logger.error(f"Error in get_credentials: {str(e)}")
            if hasattr(e, 'response'):
                logger.error(f"Error response: {e.response.text}")
            raise ValueError(f"Failed to get credentials: {str(e)}")

    def get_user_email(self, credentials: Credentials) -> Optional[str]:
        try:
            logger.debug("Getting user email from userinfo endpoint...")
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {credentials.token}"}
            response = requests.get(userinfo_url, headers=headers)
            if response.status_code == 200:
                email = response.json().get("email")
                logger.debug(f"Successfully obtained user email: {email}")
                return email
            else:
                logger.error(f"Failed to fetch userinfo: {response.status_code}")
        except Exception as e:
            logger.error(f"Error getting user email: {e}")
        return None

    def get_credentials_from_token(self, token: str) -> Credentials:
        """Create credentials from an access token."""
        try:
            logger.debug("Creating credentials from token...")
            
            # Create credentials with token
            credentials = Credentials(
                token=token,
                refresh_token=None,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.SCOPES
            )
            
            # Get user email
            try:
                email = self.get_user_email(credentials)
                credentials.id_token = email
                logger.debug(f"Successfully obtained user email: {email}")
            except Exception as e:
                logger.warning(f"Could not get user email: {str(e)}")
            
            logger.debug("Successfully created credentials from token")
            return credentials
            
        except Exception as e:
            logger.error(f"Error creating credentials from token: {str(e)}")
            raise

    def get_gmail_service(self, credentials: Credentials):
        try:
            logger.debug("Building Gmail service...")
            
            # Verify credentials are valid
            if not credentials or not credentials.valid:
                if credentials and credentials.expired:
                    logger.debug("Credentials expired, attempting to refresh...")
                    credentials.refresh(Request())
                else:
                    logger.error("Invalid credentials provided")
                    raise ValueError("Invalid credentials provided")
            
            # Build the service
            service = build('gmail', 'v1', credentials=credentials)
            
            # Verify the service is working by making a simple API call
            try:
                profile = service.users().getProfile(userId='me').execute()
                logger.debug(f"Gmail profile verified: {profile}")
            except Exception as e:
                logger.error(f"Failed to verify Gmail service: {str(e)}")
                raise
            
            logger.debug("Successfully built and verified Gmail service")
            return service
        except Exception as e:
            logger.error(f"Error building Gmail service: {str(e)}")
            raise

    def list_emails(self, credentials: Credentials) -> tuple[list[dict], int]:
        """List emails from Gmail inbox."""
        try:
            logger.debug("Starting to list emails...")
            
            # Get Gmail service
            service = self.get_gmail_service(credentials)
            if not service:
                raise ValueError("Failed to initialize Gmail service")
            
            # Get user's profile to verify service is working
            try:
                profile = service.users().getProfile(userId='me').execute()
                logger.debug(f"Gmail profile: {profile}")
            except Exception as e:
                logger.error(f"Error getting Gmail profile: {str(e)}")
                raise
            
            # Get messages
            try:
                results = service.users().messages().list(
                    userId='me',
                    maxResults=10,
                    includeSpamTrash=False
                ).execute()
                
                messages = results.get('messages', [])
                if not messages:
                    logger.warning("No messages found in inbox")
                    return [], 0
                
                logger.debug(f"Found {len(messages)} messages")
                
            except Exception as e:
                logger.error(f"Error listing messages: {str(e)}")
                raise
            
            # Process messages
            processed_emails = []
            moved_to_gator = 0
            
            for message in messages:
                try:
                    msg = service.users().messages().get(
                        userId='me',
                        id=message['id'],
                        format='metadata',
                        metadataHeaders=['Subject', 'From', 'Date']
                    ).execute()
                    
                    # Extract headers
                    headers = msg.get('payload', {}).get('headers', [])
                    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                    from_address = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')
                    date = next((h['value'] for h in headers if h['name'] == 'Date'), 'No Date')
                    
                    # Check if email should be moved to Lator Gator
                    moved_to_gator = False
                    if 'labelIds' in msg:
                        if 'INBOX' in msg['labelIds']:
                            # Here you can add logic to determine if email should be moved
                            # For now, we'll just mark it as not moved
                            moved_to_gator = False
                    
                    processed_emails.append({
                        'id': msg['id'],
                        'thread_id': msg.get('threadId', ''),
                        'message_id': msg['id'],
                        'subject': subject,
                        'from_address': from_address,
                        'date': date,
                        'snippet': msg.get('snippet', ''),
                        'labels': msg.get('labelIds', []),
                        'moved_to_gator': moved_to_gator
                    })
                    
                except Exception as e:
                    logger.error(f"Error processing message {message['id']}: {str(e)}")
                    continue
            
            logger.debug(f"Successfully processed {len(processed_emails)} emails")
            return processed_emails, moved_to_gator
            
        except Exception as e:
            logger.error(f"Error in list_emails: {str(e)}")
            raise

    def get_email(self, service, email_id: str) -> Dict[str, str]:
        try:
            logger.debug(f"Getting email content for ID: {email_id}")
            message = service.users().messages().get(
                userId='me', 
                id=email_id,
                format='full'
            ).execute()

            payload = message['payload']
            headers = payload.get('headers', [])

            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            from_address = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')

            # Extract text/plain part
            import base64
            content = ""
            if 'parts' in payload:
                for part in payload['parts']:
                    if part.get('mimeType') == 'text/plain' and part['body'].get('data'):
                        content = base64.urlsafe_b64decode(part['body']['data']).decode()
                        break
            elif payload['body'].get('data'):
                content = base64.urlsafe_b64decode(payload['body']['data']).decode()

            logger.debug("Successfully retrieved email content and metadata")
            return {
                "subject": subject,
                "from": from_address,
                "content": content
            }
        except Exception as e:
            logger.error(f"Error getting email content: {str(e)}")
            raise

    def create_or_get_label_id(self, service, label_name="Lator Gator") -> str:
        try:
            logger.debug(f"Getting or creating label: {label_name}")
            labels = service.users().labels().list(userId='me').execute().get('labels', [])
            for label in labels:
                if label['name'].lower() == label_name.lower():
                    logger.debug(f"Found existing label: {label['id']}")
                    return label['id']

            # Create the label if not found
            label_object = {
                "name": label_name,
                "labelListVisibility": "labelShow",
                "messageListVisibility": "show"
            }
            label = service.users().labels().create(userId='me', body=label_object).execute()
            logger.debug(f"Created new label: {label['id']}")
            return label['id']
        except Exception as e:
            logger.error(f"Error creating/getting label: {str(e)}")
            raise 