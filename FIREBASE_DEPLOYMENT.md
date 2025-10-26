# Firebase Production Deployment Guide

This guide explains how to configure Firebase for production deployment of the SaDo Notifier application.

## 1. Firebase Project Setup

### Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enable Firebase Cloud Messaging (FCM) in the project

### Register Web Application
1. In Firebase Console, go to Project Settings
2. Under "General" tab, click "Add app" and select "Web"
3. Register your production domain(s)
4. Note down the Firebase configuration values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId`

### Enable Cloud Messaging
1. In Firebase Console, go to "Cloud Messaging" section
2. Enable Cloud Messaging if not already enabled
3. Generate a VAPID key:
   - Click the settings icon (gear) next to "Cloud Messaging API (Legacy)"
   - Click "Manage API in Google Cloud Console"
   - Generate a new key pair and note down the "Web Push certificates" key

### Create Service Account for Backend
1. In Firebase Console, go to Project Settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely - this will be used for backend authentication

## 2. Frontend Configuration

### Environment Variables (.env.production)
Set the following environment variables in your frontend:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcd1234
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
NEXT_PUBLIC_API_URL=https://your-production-domain.com
```

### HTTPS Requirement
Ensure your production domain uses HTTPS, as FCM requires HTTPS except for localhost.

## 3. Backend Configuration

### Environment Variables (.env.production)
Set the following environment variables in your backend:

```env
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# Or alternatively:
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### Service Account Key
Place the service account JSON file in a secure location on your server and reference it with `GOOGLE_APPLICATION_CREDENTIALS`.

## 4. Domain Verification

### Authorized Domains
In Firebase Console > Project Settings > General:
1. Add your production domain(s) to the list of authorized domains
2. Ensure all domains that will use FCM are listed

### CORS Configuration
Ensure your backend allows CORS requests from your production frontend domain.

## 5. Service Worker Deployment

### File Locations
Ensure the following files are accessible at the root of your domain:
- `/sw.js` - Main service worker
- `/firebase-messaging-sw.js` - Firebase messaging service worker

### Service Worker Registration
The service workers should be automatically registered by the application code.

## 6. Testing in Production

### Verification Steps
1. Deploy your application
2. Open the production URL in a supported browser
3. Check browser console for any errors
4. Test FCM token generation
5. Verify notifications are received

## 7. Troubleshooting

### Common Issues

#### Service Worker 404 Errors
- Ensure service worker files are in the correct location
- Check web server configuration to serve JS files correctly

#### FCM Token Generation Failures
- Verify VAPID key is correct
- Check that HTTPS is used in production
- Ensure notification permissions are granted

#### Notification Delivery Failures
- Verify service account key is correct
- Check Firebase project settings
- Ensure backend can reach Firebase servers

### Debugging Tools
1. Browser Developer Tools > Application > Service Workers
2. Browser Developer Tools > Console for error messages
3. Firebase Console > Cloud Messaging > Reports for delivery metrics

## 8. Security Considerations

### Service Account Key Security
- Store service account keys securely
- Never commit keys to version control
- Rotate keys periodically
- Use least privilege principle

### Environment Variables
- Keep environment variables secure
- Use different keys for development and production
- Never expose keys in client-side code

## 9. Monitoring and Maintenance

### Logging
- Monitor Firebase Admin SDK logs
- Track notification delivery success/failure rates
- Log FCM token registration/unregistration events

### Updates
- Keep Firebase SDK versions up to date
- Monitor Firebase service status
- Update configuration as needed for new features