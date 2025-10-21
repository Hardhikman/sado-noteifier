import os
import json
from typing import List, Dict, Any
from supabase import create_client, Client

# Firebase Admin SDK
FIREBASE_AVAILABLE = False
firebase_admin = None
credentials = None
messaging = None

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    print("Firebase Admin SDK not available. Install firebase-admin to enable FCM notifications.")

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize Firebase Admin SDK
firebase_initialized = False
if FIREBASE_AVAILABLE and firebase_admin is not None:
    try:
        if not firebase_admin._apps:
            # Try to initialize with default credentials (for development)
            # In production, you would use a service account key file
            try:
                if credentials is not None:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, {
                        'projectId': os.getenv('FIREBASE_PROJECT_ID'),
                    })
            except ValueError:
                # If default credentials don't work, initialize without credentials for now
                # You'll need to add a service account key file for production
                firebase_admin.initialize_app()
        firebase_initialized = True
        print("Firebase Admin SDK initialized successfully")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK: {e}")

def get_user_subscriptions(user_id: str) -> List[Dict[Any, Any]]:
    """Get all push subscriptions for a user"""
    try:
        response = supabase.table("push_subscriptions").select("*").eq("user_id", user_id).execute()
        # Handle both possible response formats
        data = None
        if hasattr(response, 'data'):
            data = getattr(response, 'data', None)
        elif isinstance(response, dict):
            data = response.get('data')
        
        # Ensure we return a list of dictionaries
        if not data:
            return []
        
        result = []
        for item in data:
            if isinstance(item, dict):
                result.append(item)
        return result
    except Exception as e:
        print(f"Error fetching subscriptions: {e}")
        return []

def send_push_notification(user_id: str, title: str, body: str, url: str = "/") -> bool:
    """Send a push notification to all of a user's devices using Firebase Cloud Messaging"""
    if not FIREBASE_AVAILABLE or not firebase_initialized or messaging is None:
        print("Firebase not available or not initialized. Cannot send FCM notifications.")
        return False
        
    subscriptions = get_user_subscriptions(user_id)
    if not subscriptions:
        print(f"No subscriptions found for user {user_id}")
        return False

    # Prepare the notification payload
    success_count = 0
    for subscription in subscriptions:
        # Extract FCM token from subscription
        # In FCM, we store the FCM token instead of endpoint and keys
        fcm_token = subscription.get("fcm_token")
        if not fcm_token:
            print(f"No FCM token found for subscription: {subscription.get('id')}")
            continue
            
        try:
            # Create a message to send
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    "url": url,
                    "click_action": "FLUTTER_NOTIFICATION_CLICK"  # For web compatibility
                },
                token=fcm_token,
            )
            
            # Send message
            response = messaging.send(message)
            print(f"Successfully sent message: {response}")
            success_count += 1
            
        except Exception as ex:
            # Handle various FCM exceptions
            error_str = str(ex)
            if "Unregistered" in error_str or "not registered" in error_str.lower():
                print(f"FCM token {fcm_token} is unregistered. Removing subscription.")
                try:
                    supabase.table("push_subscriptions").delete().eq("fcm_token", fcm_token).execute()
                except Exception as delete_error:
                    print(f"Error removing expired subscription: {delete_error}")
            elif "SenderIdMismatch" in error_str:
                print(f"FCM token {fcm_token} has a sender ID mismatch.")
            elif "QuotaExceeded" in error_str:
                print("FCM quota exceeded.")
                break  # Stop sending to avoid further quota issues
            else:
                print(f"Unexpected error sending FCM notification: {ex}")

    print(f"Successfully sent FCM notifications to {success_count}/{len(subscriptions)} subscriptions")
    return success_count > 0