import os
import sys
from ai_services.core.supabase_client import client

def test_notification_subscription():
    # Test inserting a subscription directly
    test_subscription = {
        "user_id": "test-user-id",
        "fcm_token": "test-fcm-token-12345"
    }
    
    try:
        # Insert test subscription
        res = client.table("push_subscriptions").insert(test_subscription).execute()
        print("Insert result:", res)
        
        # Check if it was inserted
        res = client.table("push_subscriptions").select("*").eq("fcm_token", "test-fcm-token-12345").execute()
        print("Select result:", res)
        
        # Clean up
        client.table("push_subscriptions").delete().eq("fcm_token", "test-fcm-token-12345").execute()
        print("Test subscription cleaned up")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_notification_subscription()