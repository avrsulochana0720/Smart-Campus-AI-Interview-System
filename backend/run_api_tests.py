import urllib.request
import urllib.parse
import json
import socket
import sys
import time

BASE_URL = 'http://127.0.0.1:8000'

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

print("=== STARTING AUTOMATIC API SEQUENTIAL TESTS ===")
print(f"Target URL: {BASE_URL}")

# Check if server is running
if not check_server_running(BASE_URL):
    print("[-] ERROR: Backend server is not running on port 8000!")
    print("Please make sure the server is started before running this script.")
    sys.exit(1)

print("[+] Server is running and reachable.\n")

token = None
user_id = None
resume_id = None
interview_id = None
question_id = None

# We use a unique email to guarantee a new registration each time
unique_suffix = int(time.time())
test_email = f"apitest_{unique_suffix}@gmail.com"
test_password = "securepassword123"

# Step 1: Register a user using form-data
print(f"Step 1: Registering user (/register) with email: {test_email}...")
register_data = {
    "name": "API Test User",
    "email": test_email,
    "password": test_password
}

try:
    url = f'{BASE_URL}/register'
    # FastAPI Form parameters are parsed from application/x-www-form-urlencoded
    data = urllib.parse.urlencode(register_data).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={'Content-Type': 'application/x-www-form-urlencoded'}, 
        method='POST'
    )
    
    with urllib.request.urlopen(req) as response:
        print(f"    SUCCESS: /register - Status {response.status} OK")
        response_data = response.read()
        user_data = json.loads(response_data)
        user_id = user_data.get('id')
        print(f"    Registered User ID: {user_id}")
except urllib.error.HTTPError as e:
    # Read the response body if possible to print detail
    err_body = e.read().decode('utf-8')
    print(f"    FAILED: /register - Status {e.code}: {e.reason}")
    print(f"    Details: {err_body}")
    sys.exit(1)
except Exception as e:
    print(f"    FAILED: /register - Error: {e}")
    sys.exit(1)

# Step 2: Login
print(f"\nStep 2: Logging in (/login) with email: {test_email}...")
login_data = {
    "email": test_email,
    "password": test_password
}

try:
    url = f'{BASE_URL}/login'
    data = json.dumps(login_data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    
    with urllib.request.urlopen(req) as response:
        print(f"    SUCCESS: /login - Status {response.status} OK")
        response_data = response.read()
        token_data = json.loads(response_data)
        token = token_data.get('access_token')
        print(f"    Access Token: {token[:40]}...")
except Exception as e:
    print(f"    FAILED: /login - Error: {e}")
    sys.exit(1)

# Step 3: Upload resume
print("\nStep 3: Uploading mock resume (/upload-resume)...")
resume_text = "Experienced Python Software Engineer. Skilled in FastAPI, SQL databases, AI models, and cloud deployments."

try:
    url = f'{BASE_URL}/upload-resume'
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="mock_resume.txt"\r\n'
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
        print(f"    SUCCESS: /upload-resume - Status {response.status} OK")
        response_data = response.read()
        resume_data = json.loads(response_data)
        resume_id = resume_data.get('id')
        print(f"    Uploaded Resume ID: {resume_id}")
except Exception as e:
    print(f"    FAILED: /upload-resume - Error: {e}")

# Step 4: Create interview
print("\nStep 4: Creating interview session (/create-interview)...")
interview_data = {
    "job_role": "Python Developer",
    "company": "TechCorp Solutions"
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
        print(f"    SUCCESS: /create-interview - Status {response.status} OK")
        response_data = response.read()
        int_data = json.loads(response_data)
        interview_id = int_data.get('interview_id')
        print(f"    Created Interview ID: {interview_id}")
except Exception as e:
    print(f"    FAILED: /create-interview - Error: {e}")
    sys.exit(1)

# Step 5: Generate questions
print("\nStep 5: Triggering question generation (/generate-questions)...")
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
        print(f"    SUCCESS: /generate-questions - Status {response.status} OK")
        response_data = response.read()
        questions_data = json.loads(response_data)
        questions = questions_data.get('questions', [])
        print(f"    Number of questions generated in DB: {len(questions)}")
except Exception as e:
    print(f"    FAILED: /generate-questions - Error: {e}")

# Wait briefly for RAG background tasks to settle
time.sleep(1)

# Step 6: Get question
print("\nStep 6: Fetching next unanswered question (/get-question/{id})...")
try:
    url = f'{BASE_URL}/get-question/{interview_id}'
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {token}'
        },
        method='GET'
    )
    
    with urllib.request.urlopen(req) as response:
        print(f"    SUCCESS: /get-question - Status {response.status} OK")
        response_data = response.read()
        q_data = json.loads(response_data)
        question_id = q_data.get('question_id')
        question_text = q_data.get('question')
        print(f"    Question ID: {question_id}")
        print(f"    Question Text: {question_text}")
except Exception as e:
    print(f"    FAILED: /get-question - Error: {e}")

# Step 7: Submit answer
if question_id:
    print("\nStep 7: Submitting response to question (/submit-answer)...")
    answer_data = {
        "interview_id": interview_id,
        "question_id": question_id,
        "answer": "FastAPI is a modern, fast (high-performance) web framework for building APIs with Python 3.8+ based on standard Python type hints. It is fast, easy to code, and ready for production."
    }

    try:
        url = f'{BASE_URL}/submit-answer'
        data = json.dumps(answer_data).encode('utf-8')
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
            print(f"    SUCCESS: /submit-answer - Status {response.status} OK")
            response_data = response.read()
            answer_result = json.loads(response_data)
            print(f"    Score assigned: {answer_result.get('score')}/10")
            print(f"    Feedback: {answer_result.get('feedback')}")
            print(f"    More questions left: {'Yes' if answer_result.get('next_question') else 'No'}")
    except Exception as e:
        print(f"    FAILED: /submit-answer - Error: {e}")
else:
    print("\nStep 7: Skipping submit answer (no valid question ID found)")

# Step 8: Get interview report
print("\nStep 8: Fetching comprehensive report (/interview-report/{id})...")
try:
    url = f'{BASE_URL}/interview-report/{interview_id}'
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {token}'
        },
        method='GET'
    )
    
    with urllib.request.urlopen(req) as response:
        print(f"    SUCCESS: /interview-report - Status {response.status} OK")
        response_data = response.read()
        report_data = json.loads(response_data)
        print(f"    Report Status: {report_data.get('status')}")
        print(f"    Average Score: {report_data.get('average_score')}")
except Exception as e:
    print(f"    FAILED: /interview-report - Error: {e}")

# Step 9: Get interview history
print("\nStep 9: Fetching user history (/interview-history)...")
try:
    url = f'{BASE_URL}/interview-history'
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {token}'
        },
        method='GET'
    )
    
    with urllib.request.urlopen(req) as response:
        print(f"    SUCCESS: /interview-history - Status {response.status} OK")
        response_data = response.read()
        history_data = json.loads(response_data)
        print(f"    Total previous interviews found: {len(history_data)}")
except Exception as e:
    print(f"    FAILED: /interview-history - Error: {e}")

print("\n=== SEQUENTIAL API TEST SYSTEM RUN COMPLETED ===")
