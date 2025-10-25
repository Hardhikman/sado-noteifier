import requests
import json

# Test the frontend API route directly
url = "http://localhost:3000/api/notifications/subscribe"
headers = {
    "Content-Type": "application/json"
}
data = {
    "fcm_token": "frontend-test-token"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")