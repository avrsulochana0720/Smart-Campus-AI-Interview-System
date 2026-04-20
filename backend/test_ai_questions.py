import urllib.request
import json
import socket
import time

BASE_URL = 'http://127.0.0.1:8000'
ALTERNATE_PORT = 8001

def check_server_running(url: str, timeout: int = 3) -> bool:
    """Check if the server is running and reachable."""
    try:
        parsed_url = urllib.parse.urlparse(url)
        host = parsed_url.hostname
        port = parsed_url.port or (443 if parsed_url.scheme == 'https' else 80)
        
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False

print("=== Testing AI Question Generation Endpoint ===\n")

# Check if server is running
if not check_server_running(BASE_URL):
    print("ERROR: Backend server is not running!")
    print(f"Please start the backend server using:")
    print("  uvicorn main:app --reload")
    print("\nOr if port 8000 is in use, try:")
    print(f"  uvicorn main:app --port {ALTERNATE_PORT}")
    print(f"Then update BASE_URL in this script to: http://127.0.0.1:{ALTERNATE_PORT}")
    exit(1)

print(f"Server is running on {BASE_URL}\n")

# Step 1: Register a user and get token
print("Step 1: Registering user...")
register_data = {
    "name": "Test User",
    "email": "test1@gmail.com",
    "password": "123456"
}

try:
    url = f'{BASE_URL}/register'
    data = json.dumps(register_data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    
    with urllib.request.urlopen(req) as response:
        print(f"Registration Status: {response.status}")
        response_data = response.read()
        print(f"Response: {json.loads(response_data)}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.reason}")
    error_response = e.read()
    print(f"Error Response: {json.loads(error_response)}")
except urllib.error.URLError as e:
    print(f"Connection Error: {e.reason}")
    print("Make sure the backend server is running!")
    exit(1)
except Exception as e:
    print(f"Registration failed: {e}")

# Step 2: Login to get JWT token
print("\nStep 2: Logging in...")
login_data = {
    "email": "test1@gmail.com",
    "password": "123456"
}

try:
    url = f'{BASE_URL}/login'
    data = json.dumps(login_data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    
    with urllib.request.urlopen(req) as response:
        response_data = response.read()
        token_data = json.loads(response_data)
        token = token_data.get('access_token')
        print(f"Login Status: {response.status}")
        print(f"Token obtained: {token[:50]}..." if token else "No token found")
except urllib.error.URLError as e:
    print(f"Connection Error: {e.reason}")
    print("Make sure the backend server is running!")
    exit(1)
except Exception as e:
    print(f"Login failed: {e}")
    exit(1)

# Step 3: Upload a resume
print("\nStep 3: Uploading resume...")
resume_text = "Experienced Python developer with 5 years of experience in Django, Flask, React, and SQL. Worked on multiple projects involving microservices, Docker, and AWS deployment. Strong knowledge of data structures, algorithms, and REST API development."

try:
    url = f'{BASE_URL}/upload-resume'
    # Create a simple file-like object with resume text
    import io
    file_data = io.BytesIO(resume_text.encode('utf-8'))
    
    # For simplicity, we'll create a minimal multipart request
    # This is a simplified version - in production use requests library
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="resume.txt"\r\n'
        f'Content-Type: text/plain\r\n\r\n'
        f'{resume_text}\r\n'
        f'--{boundary}--\r\n'
    ).encode('utf-8')
    
    req = urllib.request.Request(
        url, 
        data=body,
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'Authorization': f'Bearer {token}'
        },
        method='POST'
    )
    
    with urllib.request.urlopen(req) as response:
        response_data = response.read()
        print(f"Upload Status: {response.status}")
        print(f"Response: {json.loads(response_data)}")
except Exception as e:
    print(f"Resume upload failed: {e}")
    exit(1)

# Step 4: Create interview
print("\nStep 4: Creating interview...")
interview_data = {
    "job_role": "Python Developer",
    "company": "TechCorp Inc."
}

try:
    url = f'{BASE_URL}/create-interview'
    data = json.dumps(interview_data).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        },
        method='POST'
    )
    
    with urllib.request.urlopen(req) as response:
        response_data = response.read()
        interview_data = json.loads(response_data)
        print(f"Create Interview Status: {response.status}")
        print(f"Interview ID: {interview_data.get('interview_id')}")
        interview_id = interview_data.get('interview_id')
except Exception as e:
    print(f"Create interview failed: {e}")
    exit(1)

# Step 5: Generate questions
print("\nStep 5: Generating questions...")
generate_data = {
    "interview_id": interview_id
}

try:
    url = f'{BASE_URL}/generate-questions'
    data = json.dumps(generate_data).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        },
        method='POST'
    )
    
    with urllib.request.urlopen(req) as response:
        response_data = response.read()
        print(f"Generate Questions Status: {response.status}")
        print(f"\nResponse:")
        print(json.dumps(json.loads(response_data), indent=2))
        
except Exception as e:
    print(f"Error: {e}")
