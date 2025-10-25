import requests
import json

# First, register a new user
register_url = "http://localhost:8000/auth/register"
register_headers = {
    "Content-Type": "application/json"
}
register_data = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
}

try:
    print("Registering new user...")
    register_response = requests.post(register_url, headers=register_headers, data=json.dumps(register_data))
    print(f"Register Status Code: {register_response.status_code}")
    print(f"Register Response: {register_response.text}")
    
    if register_response.status_code == 201:
        print("User registered successfully. Now logging in...")
        
        # Login to get an auth token
        login_url = "http://localhost:8000/auth/login"
        login_headers = {
            "Content-Type": "application/json"
        }
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        login_response = requests.post(login_url, headers=login_headers, data=json.dumps(login_data))
        print(f"Login Status Code: {login_response.status_code}")
        # print(f"Login Response: {login_response.text}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result["data"]["access_token"]
            print(f"Access Token obtained: {access_token[:20]}...")
            
            # Now test the notification subscription endpoint
            subscribe_url = "http://localhost:8000/notifications/subscribe"
            subscribe_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            }
            subscribe_data = {
                "fcm_token": "test-token-123"
            }
            
            print("Subscribing to notifications...")
            subscribe_response = requests.post(subscribe_url, headers=subscribe_headers, data=json.dumps(subscribe_data))
            print(f"Subscribe Status Code: {subscribe_response.status_code}")
            print(f"Subscribe Response: {subscribe_response.text}")
            
            if subscribe_response.status_code == 200:
                print("Subscription successful!")
                
                # Let's verify the subscription was stored in the database
                print("Verifying subscription in database...")
                verify_url = "http://localhost:8000/notifications/test-subscription"
                verify_headers = {
                    "Authorization": f"Bearer {access_token}"
                }
                
                # We'll need to create a verification endpoint or use the backend directly
                # For now, let's just check if we can retrieve the subscription
                from backend.ai_services.core.supabase_client import client
                res = client.table("push_subscriptions").select("*").eq("fcm_token", "test-token-123").execute()
                print(f"Database verification: {res}")
            else:
                print("Subscription failed.")
        else:
            print("Login failed. Cannot proceed with subscription test.")
    else:
        print("Registration failed. Cannot proceed with login and subscription test.")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()