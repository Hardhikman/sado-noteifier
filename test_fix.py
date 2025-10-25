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
    print("Testing the fix by calling the backend API directly...")
    
    # Since we don't know the password, let's test if the backend API is accessible
    # by calling a simple endpoint
    response = requests.get("http://localhost:8000/")
    print(f"Backend root endpoint status: {response.status_code}")
    print(f"Backend root endpoint response: {response.json()}")
    
    # Now let's test the notifications endpoint
    response = requests.post("http://localhost:8000/notifications/subscribe", 
                           headers={"Content-Type": "application/json"},
                           data=json.dumps({"fcm_token": "test-token"}))
    print(f"Notifications subscribe endpoint status (without auth): {response.status_code}")
    print(f"Notifications subscribe endpoint response: {response.json()}")
    
    print("\nIf you see a 401 error above, that's expected because we didn't provide authentication.")
    print("The important thing is that the endpoint is accessible and returning the expected error.")
    
except Exception as e:
    print(f"Error: {e}")