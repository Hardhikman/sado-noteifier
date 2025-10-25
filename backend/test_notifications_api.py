import os
import sys
import json
from ai_services.api.routes.notifications import SubscriptionModel
from ai_services.api.routes.notifications import subscribe_to_notifications

def test_notifications_api():
    # Create a subscription model
    subscription = SubscriptionModel(fcm_token="api-test-token-789")
    
    # Use the user ID we know exists
    user_id = "cb199939-01ce-4444-b345-4e5b61cd604b"
    
    try:
        print("Testing notifications API...")
        result = subscribe_to_notifications(subscription, user_id)
        print("API call successful!")
        print("Result:", result)
        
        # Verify in database
        from ai_services.core.supabase_client import client
        res = client.table("push_subscriptions").select("*").eq("fcm_token", "api-test-token-789").execute()
        print("Database verification:", res)
        
        # Clean up
        client.table("push_subscriptions").delete().eq("fcm_token", "api-test-token-789").execute()
        print("Clean up complete")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_notifications_api()