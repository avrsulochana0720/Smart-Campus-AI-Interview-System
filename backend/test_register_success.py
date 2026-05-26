import requests
import random

email = f"test_{random.randint(1000, 9999)}@example.com"
url = "http://localhost:8000/register"
data = {
    "name": "Test User",
    "email": email,
    "password": "password123"
}

try:
    response = requests.post(url, data=data)
    print(f"Email: {email}")
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
