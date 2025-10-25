import requests
import json

# First, login to get an auth token from the backend
login_url = "http://localhost:8000/auth/login"
login_headers = {
    "Content-Type": "application/json"
}
login_data = {
    "email": "hardhikm.08@gmail.com",
    "password": "password123"  # We'll need to know the actual password
}

try:
    # We don't know the password, so let's try to get a session from Supabase directly
    # But first, let's check if we can get the session from the frontend
    print("Testing frontend API route with session...")
    
    # Let's check what happens when we try to access the frontend API without proper headers
    url = "http://localhost:3000/api/notifications/subscribe"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "fcm_token": "frontend-test-token"
    }
    
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    # The issue is that the frontend API route expects an Authorization header with a Bearer token
    # But the frontend Supabase client might not be properly configured or the RLS policies
    # might be preventing direct access to the push_subscriptions table
    
except Exception as e:
    print(f"Error: {e}")