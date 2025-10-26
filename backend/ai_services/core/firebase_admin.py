import firebase_admin
from firebase_admin import credentials, messaging
import os
import json

# Initialize Firebase Admin SDK
def initialize_firebase():
    try:
        if not firebase_admin._apps:
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
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")

# Initialize on module import
initialize_firebase()

def send_push_notification(token, title, body, data=None):
    """Send a push notification to a specific device"""
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        
        response = messaging.send(message)
        print(f"Successfully sent message: {response}")
        return response
    except Exception as e:
        print(f"Error sending push notification: {e}")
        raise e

def send_multicast_notification(tokens, title, body, data=None):
    """Send a push notification to multiple devices"""
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
        print(f"Successfully sent messages: {response.success_count} success, {response.failure_count} failures")
        return response
    except Exception as e:
        print(f"Error sending multicast notification: {e}")
        raise e