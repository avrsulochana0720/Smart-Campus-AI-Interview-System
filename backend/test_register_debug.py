import requests

url = "http://localhost:8000/register"
data = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
}

try:
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
