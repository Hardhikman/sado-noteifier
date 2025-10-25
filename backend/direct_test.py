import os
import sys
from ai_services.core.supabase_client import client

def test_direct_subscription():
    # Use the user ID we know exists
    user_id = "cb199939-01ce-4444-b345-4e5b61cd604b"
    
    # Test subscription data
    subscription_data = {
        "user_id": user_id,
        "fcm_token": "direct-test-token-456"
    }
    
    try:
        print("Inserting subscription directly...")
        res = client.table("push_subscriptions").insert(subscription_data).execute()
        print("Insert successful!")
        print("Result:", res)
        
        # Check if it was inserted
        print("Verifying insertion...")
        res = client.table("push_subscriptions").select("*").eq("fcm_token", "direct-test-token-456").execute()
        print("Verification result:", res)
        
        # Clean up
        print("Cleaning up...")
        client.table("push_subscriptions").delete().eq("fcm_token", "direct-test-token-456").execute()
        print("Clean up complete")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_direct_subscription()