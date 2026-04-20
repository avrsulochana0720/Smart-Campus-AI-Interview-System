import urllib.request
import json
import socket

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

print("=== Testing All Backend APIs ===\n")

# Check if server is running
if not check_server_running(BASE_URL):
    print("ERROR: Backend server is not running!")
    print(f"Please start the backend server using:")
    print("  uvicorn main:app --reload")
    exit(1)

print(f"Server is running on {BASE_URL}\n")

# Step 1: Register a user
print("Step 1: Registering user...")
register_data = {
    "name": "Test User",
    "email": "testapi@gmail.com",
    "password": "123456"
}

try:
    url = f'{BASE_URL}/register'
    data = json.dumps(register_data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    
    with urllib.request.urlopen(req) as response:
        print(f"✅ /register: {response.status} OK")
        response_data = response.read()
        user_data = json.loads(response_data)
        print(f"   User ID: {user_data.get('id')}")
except urllib.error.HTTPError as e:
    if e.code == 400:
        print(f"⚠️  /register: {e.code} - User already exists (OK for testing)")
    else:
        print(f"❌ /register: {e.code} - {e.reason}")
except Exception as e:
    print(f"❌ /register: {e}")

# Step 2: Login
print("\nStep 2: Logging in...")
login_data = {
    "email": "testapi@gmail.com",
    "password": "123456"
}

try:
    url = f'{BASE_URL}/login'
    data = json.dumps(login_data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    
    with urllib.request.urlopen(req) as response:
        print(f"✅ /login: {response.status} OK")
        response_data = response.read()
        token_data = json.loads(response_data)
        token = token_data.get('access_token')
        print(f"   Token: {token[:50]}...")
except Exception as e:
    print(f"❌ /login: {e}")
    exit(1)

# Step 3: Upload resume
print("\nStep 3: Uploading resume...")
resume_text = "Experienced Python developer with 5 years of experience in Django, Flask, React, and SQL."

try:
    url = f'{BASE_URL}/upload-resume'
    import io
    file_data = io.BytesIO(resume_text.encode('utf-8'))
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
        print(f"✅ /upload-resume: {response.status} OK")
        response_data = response.read()
        resume_data = json.loads(response_data)
        print(f"   Resume ID: {resume_data.get('id')}")
        resume_id = resume_data.get('id')
except Exception as e:
    print(f"❌ /upload-resume: {e}")

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
        print(f"✅ /create-interview: {response.status} OK")
        response_data = response.read()
        interview_data = json.loads(response_data)
        print(f"   Interview ID: {interview_data.get('interview_id')}")
        interview_id = interview_data.get('interview_id')
except Exception as e:
    print(f"❌ /create-interview: {e}")

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
        print(f"✅ /generate-questions: {response.status} OK")
        response_data = response.read()
        questions_data = json.loads(response_data)
        questions = questions_data.get('questions', [])
        print(f"   Questions generated: {len(questions)}")
except Exception as e:
    print(f"❌ /generate-questions: {e}")

# Step 6: Get question
print("\nStep 6: Getting question...")
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
        print(f"✅ /get-question/{interview_id}: {response.status} OK")
        response_data = response.read()
        question_data = json.loads(response_data)
        print(f"   Question ID: {question_data.get('question_id')}")
        question_id = question_data.get('question_id')
except Exception as e:
    print(f"❌ /get-question: {e}")

# Step 7: Submit answer
print("\nStep 7: Submitting answer...")
answer_data = {
    "interview_id": interview_id,
    "question_id": question_id,
    "answer": "Lists are mutable, tuples are immutable. Lists use square brackets [], tuples use parentheses ()."
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
        print(f"✅ /submit-answer: {response.status} OK")
        response_data = response.read()
        answer_result = json.loads(response_data)
        print(f"   Score: {answer_result.get('score')}")
        print(f"   Next question: {'Yes' if answer_result.get('next_question') else 'No'}")
except Exception as e:
    print(f"❌ /submit-answer: {e}")

# Step 8: Get interview report
print("\nStep 8: Getting interview report...")
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
        print(f"✅ /interview-report/{interview_id}: {response.status} OK")
        response_data = response.read()
        report_data = json.loads(response_data)
        print(f"   Average Score: {report_data.get('average_score')}")
        print(f"   Questions: {len(report_data.get('questions', []))}")
except Exception as e:
    print(f"❌ /interview-report: {e}")

# Step 9: Get interview history
print("\nStep 9: Getting interview history...")
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
        print(f"✅ /interview-history: {response.status} OK")
        response_data = response.read()
        history_data = json.loads(response_data)
        print(f"   Interviews: {len(history_data)}")
except Exception as e:
    print(f"❌ /interview-history: {e}")

print("\n=== All API Tests Complete ===")
