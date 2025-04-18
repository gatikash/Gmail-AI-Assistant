# Gmail AI Assistant

A fullstack application that uses Gmail API and Google's Gemini AI to help manage and respond to emails.

## Features

- Gmail OAuth integration
- Email listing and viewing
- AI-powered email analysis
- AI-assisted response drafting
- Modern React frontend with TailwindCSS
- FastAPI backend

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example` and fill in your credentials:
- Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
- Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

5. Run the backend server:
```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

## API Endpoints

- `GET /auth/url` - Get Google OAuth URL
- `POST /auth/callback` - Handle OAuth callback
- `GET /emails` - List emails
- `GET /emails/{message_id}/analyze` - Analyze email content
- `POST /emails/{message_id}/draft-response` - Generate email response draft

## Environment Variables

### Backend (.env)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI
- `GEMINI_API_KEY` - Google Gemini API key
- `JWT_SECRET_KEY` - JWT secret key
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time 