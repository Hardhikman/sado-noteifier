# SaDo Noteifier

A Note + Notiifcaton AI webapp

<img width="335" height="353" alt="Screenshot 2025-10-22 140114" src="https://github.com/user-attachments/assets/f8f5ae10-63c9-4873-abbb-c85bac595f8c" />
<img width="1915" height="981" alt="Screenshot 2025-10-22 133310" src="https://github.com/user-attachments/assets/4d0a2e5a-01ca-426f-a5fb-f0a34ce6bca1" />
<img width="976" height="950" alt="Screenshot 2025-10-22 135805" src="https://github.com/user-attachments/assets/5f321a3c-f15b-4ec0-a096-3e1545f223ea" />

## Features
- Create, edit, and delete notes
- AI-powered note summarization using Google Gemini
- Smart notification reminders (hourly/daily) with end date scheduling
- Push notifications via Firebase Cloud Messaging (FCM)
- Google authentication through Supabase Auth
- Responsive design with Tailwind CSS
- Progressive Web App (PWA) support

## Prerequisites
- Python 3.8+
- Node.js 14+
- Supabase account
- Firebase project for push notifications
- Google AI API key for Gemini integration

## Security Notice for Public Repositories

⚠️ **Important**: This repository contains example configuration files. Never commit actual credentials to version control. Always use environment variables and add sensitive files to `.gitignore`.

## Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv new_venv
   # On Windows
   new_venv\Scripts\activate
   # On macOS/Linux
   source new_venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your configuration:
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials (never commit this file)
   ```

5. Set up Google AI for Gemini integration:
   - Obtain a Google AI API key from [Google AI Studio](https://aistudio.google.com/)
   - Add `GOOGLE_API_KEY=your_api_key_here` to your backend `.env` file

### Frontend Setup
1. Create a `.env.local` file in the `frontend` directory:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your actual credentials (never commit this file)
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables

For security, this project uses environment variables for all sensitive configuration. The `.env.example` files show what variables are needed:

**Frontend** (in `frontend/.env.local`):
- Firebase configuration for client-side initialization
- Supabase credentials
- API endpoint URLs

**Backend** (in `backend/.env`):
- Firebase service account credentials (use `FIREBASE_SERVICE_ACCOUNT_KEY` with JSON content)
- Supabase service role key
- Google AI API key

Never commit your actual `.env` or `.env.local` files to version control. The `.gitignore` file is configured to prevent this.

### Database Setup
1. Run the SQL scripts in the `backend/db` directory to set up the database tables:
   - `users.sql`
   - `notes.sql`
   - `notifications.sql`

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Register your web app in Firebase to get the configuration values
3. Enable Cloud Messaging in your Firebase project
4. Generate a VAPID key for FCM:
   - Go to Project Settings > Cloud Messaging
   - Generate a new key pair for Web Push certificates
5. Add the Firebase configuration to your frontend `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (the public VAPID key from step 4)
6. Add your Firebase project ID to your backend `.env`:
   - `FIREBASE_PROJECT_ID=your_firebase_project_id_here`
7. For production, download the service account JSON file from Firebase:
   - Go to Project Settings > Service accounts
   - Generate a new private key
   - For security, convert the JSON content to an environment variable:
     - `FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}`

### Push Notification Setup
The application now uses Firebase Cloud Messaging (FCM) instead of the traditional Web Push API. Follow the Firebase Setup instructions in the previous section.

For production deployments, use the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable with the complete JSON content instead of file paths. This follows the 12-factor app methodology and is more secure for cloud deployments.

## Running the Application

1. Start the backend:
   ```bash
   cd backend
   set PYTHONPATH=.
   python -m uvicorn ai_services.api.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. In a separate terminal, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Using Push Notifications

1. When creating or editing a note, select "Save with Notification"
2. Choose hourly or daily reminders and set an end date
3. Grant notification permissions when prompted
4. The browser will automatically subscribe to Firebase Cloud Messaging
5. When the scheduled time arrives, you'll receive a push notification
6. Notifications include AI-generated summaries of your notes for better context

## Testing Push Notifications

To test the push notification functionality:

1. Ensure you've set up Firebase as described above
2. Open the application in a browser that supports push notifications (Chrome, Firefox, Edge)
3. Create a note with notifications enabled
4. Manually trigger a notification by calling the notification job endpoint or wait for the scheduled time
5. For background notification support, ensure the service worker (`public/sw.js`) is properly configured and deployed

## Deployment

This application can be deployed to Vercel (frontend) and Render (backend). See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deployment Steps

1. Set up your Supabase, Firebase, and Google AI accounts
2. Configure environment variables as specified in `.env.production` files
3. Deploy the frontend to Vercel (root directory: `/frontend`)
4. Deploy the backend to Render (root directory: `/`)
5. Update the frontend's `NEXT_PUBLIC_API_URL` to point to your Render backend

For detailed deployment instructions, run:
- On Windows: `DEPLOY.bat`
- On macOS/Linux: `chmod +x DEPLOY.sh && ./DEPLOY.sh`

## API Documentation
Once the backend is running, visit `http://localhost:8000/swagger` for API documentation.

### Key API Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /notes` - Create a new note
- `POST /notes/notify` - Create a new note with notification
- `GET /notes` - Get all notes for the authenticated user
- `GET /notes/{id}` - Get a specific note by ID
- `PUT /notes/{id}` - Update an existing note
- `PUT /notes/{id}/notify` - Update an existing note with notification settings
- `DELETE /notes/{id}` - Delete a note
- `POST /notifications/subscribe` - Subscribe to FCM notifications
- `POST /notifications/unsubscribe` - Unsubscribe from FCM notifications

## Project Structure
- `backend/` - FastAPI backend with Supabase integration
  - `ai_services/` - AI-powered features using Google Gemini
  - `core/` - Core services (Supabase client, note saver, push notifications)
  - `api/` - API routes and authentication
  - `db/` - Database schema files
- `frontend/` - Next.js frontend with TypeScript and Tailwind CSS
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `pages/` - Next.js pages and API routes
  - `public/` - Static assets and service worker
  - `lib/` - Utility functions and Supabase client