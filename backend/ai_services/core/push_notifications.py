import os
import json
from typing import List, Dict, Any
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

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
                    # Option 1: Use service account key file
                    cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
                    if cred_path and os.path.exists(cred_path):
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred)
                        print("Firebase Admin initialized with service account file")
                    # Option 2: Use service account key JSON string
                    elif os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
                        cred_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
                        if cred_json:
                            cred_dict = json.loads(cred_json)
                            cred = credentials.Certificate(cred_dict)
                            firebase_admin.initialize_app(cred)
                        print("Firebase Admin initialized with service account JSON")
                    # Option 3: Use default credentials (for some hosting environments)
                    else:
                        cred = credentials.ApplicationDefault()
                        firebase_admin.initialize_app(cred)
                        print("Firebase Admin initialized with default credentials")
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

def get_user_fcm_tokens(user_id):
    """Get all FCM tokens for a specific user"""
    logger.info(f"[TOKEN] Retrieving FCM tokens for user {user_id}")
    try:
        response = supabase.table("push_subscriptions").select("fcm_token").eq("user_id", user_id).execute()
        # Handle both possible response formats
        data = None
        if hasattr(response, 'data'):
            data = getattr(response, 'data', None)
        elif isinstance(response, dict):
            data = response.get('data')
        
        if data:
            tokens = [item['fcm_token'] for item in data if item.get('fcm_token')]
            logger.info(f"[TOKEN] Found {len(tokens)} FCM tokens for user {user_id}")
            logger.debug(f"[TOKEN] Tokens: {[token[:20] + '...' for token in tokens]}")
            return tokens
        else:
            logger.info(f"[TOKEN] No FCM tokens found for user {user_id}")
            return []
    except Exception as e:
        logger.error(f"[TOKEN] Error fetching FCM tokens for user {user_id}: {e}", exc_info=True)
        return []

def send_push_notification_to_token(token, title, body, data=None):
    """Send a push notification to a specific FCM token"""
    logger.info(f"[TOKEN_SEND] Sending push notification to token: {token[:20]}...")
    
    if not FIREBASE_AVAILABLE or not firebase_initialized or messaging is None:
        logger.error("[TOKEN_SEND] Firebase not available or not initialized. Cannot send FCM notifications.")
        return False
        
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        
        logger.debug(f"[TOKEN_SEND] Prepared message: {message}")
        
        response = messaging.send(message)
        logger.info(f"[TOKEN_SEND] Successfully sent message: {response}")
        return True
    except Exception as e:
        logger.error(f"[TOKEN_SEND] Error sending push notification: {e}", exc_info=True)
        # Handle various FCM exceptions
        error_str = str(e)
        if "Unregistered" in error_str or "not registered" in error_str.lower():
            logger.info(f"[TOKEN_SEND] FCM token {token[:20]}... is unregistered. Removing subscription.")
            try:
                supabase.table("push_subscriptions").delete().eq("fcm_token", token).execute()
            except Exception as delete_error:
                logger.error(f"[TOKEN_SEND] Error removing expired subscription: {delete_error}")
        elif "SenderIdMismatch" in error_str:
            logger.warning(f"[TOKEN_SEND] FCM token {token[:20]}... has a sender ID mismatch.")
        elif "QuotaExceeded" in error_str:
            logger.error("[TOKEN_SEND] FCM quota exceeded.")
        return False

def send_multicast_notification_to_tokens(tokens, title, body, data=None):
    """Send a push notification to multiple FCM tokens"""
    if not FIREBASE_AVAILABLE or not firebase_initialized or messaging is None:
        print("Firebase not available or not initialized. Cannot send FCM notifications.")
        return None
        
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )
        
        response = messaging.send_each_for_multicast(message)
        logger.info(f"Successfully sent messages: {response.success_count} success, {response.failure_count} failures")
        return response
    except Exception as e:
        logger.error(f"Error sending multicast notification: {e}")
        return None

def send_push_notification(user_id: str, title: str, body: str, url: str = "/") -> bool:
    """Send a push notification to all of a user's devices using Firebase Cloud Messaging"""
    logger.info(f"[PUSH] Attempting to send push notification to user {user_id}")
    logger.info(f"[PUSH] Notification details - Title: {title}, Body: {body}, URL: {url}")
    
    if not FIREBASE_AVAILABLE or not firebase_initialized or messaging is None:
        logger.error("[PUSH] Firebase not available or not initialized. Cannot send FCM notifications.")
        return False
        
    tokens = get_user_fcm_tokens(user_id)
    logger.info(f"[PUSH] Retrieved {len(tokens)} FCM tokens for user {user_id}")
    
    if not tokens:
        logger.info(f"[PUSH] No tokens found for user {user_id}")
        return False

    # Prepare the notification payload
    data = {
        "url": url,
        "click_action": "FLUTTER_NOTIFICATION_CLICK"  # For web compatibility
    }
    
    logger.info(f"[PUSH] Prepared notification payload: title='{title}', body='{body}', data={data}")

    try:
        if len(tokens) == 1:
            # Single token - send single notification
            logger.info(f"[PUSH] Sending single notification to token: {tokens[0][:20]}...")
            success = send_push_notification_to_token(tokens[0], title, body, data)
            logger.info(f"[PUSH] Sent notification to user {user_id} (1 device) - Success: {success}")
            return success
        else:
            # Multiple tokens - send multicast notification
            logger.info(f"[PUSH] Sending multicast notification to {len(tokens)} tokens")
            response = send_multicast_notification_to_tokens(tokens, title, body, data)
            if response is not None:
                success_count = getattr(response, 'success_count', 0) if response else 0
                logger.info(f"[PUSH] Sent notification to user {user_id} ({len(tokens)} devices) - Success: {success_count}")
                return hasattr(response, 'success_count') and response.success_count > 0
            return False
    except Exception as e:
        logger.error(f"[PUSH] Error sending notification to user {user_id}: {e}", exc_info=True)
        return False

def send_notification_to_multiple_users(user_ids, title, body, data=None):
    """Send a push notification to multiple users"""
    try:
        all_tokens = []
        for user_id in user_ids:
            tokens = get_user_fcm_tokens(user_id)
            all_tokens.extend(tokens)
            
        if not all_tokens:
            logger.info(f"No tokens found for users {user_ids}, skipping notification")
            return None
            
        if len(all_tokens) == 1:
            success = send_push_notification_to_token(all_tokens[0], title, body, data)
            logger.info(f"Sent notification to 1 user (1 device)")
            return success
        else:
            response = send_multicast_notification_to_tokens(all_tokens, title, body, data)
            logger.info(f"Sent notification to {len(user_ids)} users ({len(all_tokens)} devices)")
            return response
    except Exception as e:
        logger.error(f"Error sending notification to multiple users {user_ids}: {e}")
        raise e