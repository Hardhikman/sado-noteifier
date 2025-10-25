import requests
import json

# Test the notification subscription endpoint
url = "http://localhost:8000/notifications/subscribe"
headers = {
    "Content-Type": "application/json"
}
data = {
    "fcm_token": "test-token-123"
}

try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")