# Deployment Guide for SaDo Noteifier

This guide explains how to deploy the SaDo Noteifier application to Vercel (frontend) and Render (backend).

## Prerequisites

Before deploying, you'll need to set up the following services:

1. **Supabase Account** - For database and authentication
2. **Firebase Project** - For push notifications
3. **Google AI API Key** - For Gemini integration

## Environment Variables

### Frontend (Vercel)

The following environment variables need to be set in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_firebase_vapid_key_here
NEXT_PUBLIC_API_URL=https://your-render-app-name.onrender.com
```

### Backend (Render)

The following environment variables need to be set in your Render project settings:

```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
GOOGLE_API_KEY=your_google_ai_api_key_here
```

Additionally, you'll need to upload your Firebase service account JSON file to Render and reference it in your environment variables:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/firebase-service-account.json
```

## Vercel Deployment (Frontend)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `/frontend`
3. Add all the required environment variables listed above
4. Deploy!

## Render Deployment (Backend)

1. Connect your GitHub repository to Render
2. Select "Web Service" as the service type
3. Set the root directory to `/`
4. Add all the required environment variables listed above
5. Upload your Firebase service account JSON file
6. Deploy!

## Post-Deployment Steps

After deploying both services:

1. Update `NEXT_PUBLIC_API_URL` in your Vercel environment variables to point to your Render backend URL
2. Test the connection between frontend and backend
3. Verify that push notifications work correctly