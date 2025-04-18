from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
import os
from config import settings

class GmailService:
    def __init__(self):
        self.SCOPES = [
            'https://www.googleapis.com/auth/gmail.readonly'        ]
        self.flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
                }
            },
            scopes=self.SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )

    def get_auth_url(self):
        auth_url, _ = self.flow.authorization_url(
            access_type='offline',
prompt='consent',  # forces Google to re-ask for all scopes
    include_granted_scopes=False  # don't combine with old scopes
                    )
        return auth_url

    def get_credentials(self, code):
        self.flow.fetch_token(code=code)
        credentials = self.flow.credentials
        return credentials

    def get_gmail_service(self, credentials):
        return build('gmail', 'v1', credentials=credentials)

    def list_emails(self, service, max_results=10):
        results = service.users().messages().list(
            userId='me',
            maxResults=max_results
        ).execute()
        return results.get('messages', [])

    def get_email(self, service, message_id):
        message = service.users().messages().get(
            userId='me',
            id=message_id,
            format='full'
        ).execute()
        return message 