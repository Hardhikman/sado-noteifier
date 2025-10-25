import requests
import json

# First, let's login to get an auth token
login_url = "http://localhost:8000/auth/login"
login_headers = {
    "Content-Type": "application/json"
}
login_data = {
    "email": "hardhikm.08@gmail.com",
    "password": "password123"  # Use the actual password for this user
}

try:
    login_response = requests.post(login_url, headers=login_headers, data=json.dumps(login_data))
    print(f"Login Status Code: {login_response.status_code}")
    print(f"Login Response: {login_response.text}")
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        access_token = login_result["data"]["access_token"]
        print(f"Access Token: {access_token}")
        
        # Now test the notification subscription endpoint
        subscribe_url = "http://localhost:8000/notifications/subscribe"
        subscribe_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
        subscribe_data = {
            "fcm_token": "test-token-123"
        }
        
        subscribe_response = requests.post(subscribe_url, headers=subscribe_headers, data=json.dumps(subscribe_data))
        print(f"Subscribe Status Code: {subscribe_response.status_code}")
        print(f"Subscribe Response: {subscribe_response.text}")
    else:
        print("Login failed. Cannot proceed with subscription test.")
        
except Exception as e:
    print(f"Error: {e}")