import subprocess
import urllib.request
import urllib.parse
import json
import socket
import sys
import time
import os

BASE_URL = 'http://127.0.0.1:8000'
PDF_PATH = r"C:\Users\ADMIN\OneDrive\Desktop\app\public\Adimireddy-gari-Reddy-Sulochana-FlowCV-Resume-20250510 (3).pdf"

# Check if target resume exists
if not os.path.exists(PDF_PATH):
    print(f"[-] ERROR: Target resume PDF not found at path: {PDF_PATH}")
    sys.exit(1)

def check_server_running(url: str, timeout: int = 2) -> bool:
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

# Start backend server programmatically if not running
server_process = None
if not check_server_running(BASE_URL):
    print("[*] Backend server is not running. Starting local Uvicorn instance...")
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    
    # Run uvicorn as subprocess (redirect stdout/stderr to DEVNULL to prevent pipe buffer deadlock)
    server_process = subprocess.Popen(
        [venv_python, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=backend_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait for server to become ready
    print("[*] Waiting for server to spin up...")
    retries = 30
    while retries > 0:
        time.sleep(1)
        if check_server_running(BASE_URL):
            print("[+] Server started successfully!")
            break
        retries -= 1
    else:
        print("[-] ERROR: Server failed to start in 30 seconds.")
        if server_process:
            server_process.kill()
        sys.exit(1)
else:
    print("[+] Server is already running. Using existing instance.")

token = None
user_id = None
resume_id = None
interview_id = None

# dynamic email to ensure clean registration
unique_suffix = int(time.time())
test_email = f"sulochana_sim_{unique_suffix}@gmail.com"
test_password = "securepassword123"

# Utility to call API easily
def call_api(endpoint, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{endpoint}"
    req_headers = {'Content-Type': 'application/json'}
    if token:
        req_headers['Authorization'] = f'Bearer {token}'
    if headers:
        req_headers.update(headers)
        
    req_data = None
    if data:
        if isinstance(data, bytes):
            req_data = data
        else:
            req_data = json.dumps(data).encode('utf-8')
            
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req) as response:
            latency = time.time() - start_time
            resp_body = response.read()
            return json.loads(resp_body.decode('utf-8')), response.status, latency
    except urllib.error.HTTPError as e:
        latency = time.time() - start_time
        err_body = e.read().decode('utf-8')
        try:
            err_json = json.loads(err_body)
            detail = err_json.get("detail", err_body)
        except Exception:
            detail = err_body
        raise Exception(f"API Error {e.code}: {detail} (Latency: {latency:.2f}s)")
    except Exception as e:
        latency = time.time() - start_time
        raise Exception(f"Connection Error on {endpoint}: {e} (Latency: {latency:.2f}s)")

print("\n==================================================")
print("     STARTING LIVE INTERVIEW SIMULATION           ")
print("==================================================\n")

try:
    # Step 1: Register User
    print(f"[*] Registering simulation user: {test_email}...")
    register_data = urllib.parse.urlencode({
        "name": "Sulochana Adimireddy",
        "email": test_email,
        "password": test_password
    }).encode('utf-8')
    
    url = f"{BASE_URL}/register"
    req = urllib.request.Request(url, data=register_data, headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
    with urllib.request.urlopen(req) as response:
        user_data = json.loads(response.read().decode('utf-8'))
        user_id = user_data["id"]
        print(f"    [OK] User registered. ID: {user_id}")

    # Step 2: Login
    print("[*] Logging in...")
    login_res, status, lat = call_api("/login", method="POST", data={
        "email": test_email,
        "password": test_password
    })
    token = login_res["access_token"]
    print(f"    [OK] Logged in. Token verified. (Latency: {lat:.2f}s)")

    # Step 3: Upload Sulochana's Resume PDF
    print(f"[*] Uploading resume: {os.path.basename(PDF_PATH)}...")
    with open(PDF_PATH, 'rb') as f:
        pdf_bytes = f.read()
    
    boundary = '----WebKitFormBoundarySulochanaSim'
    multipart_data = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="{os.path.basename(PDF_PATH)}"\r\n'
        f'Content-Type: application/pdf\r\n\r\n'.encode('utf-8') +
        pdf_bytes +
        f'\r\n--{boundary}--\r\n'.encode('utf-8')
    )
    
    resume_res, status, lat = call_api(
        "/upload-resume", 
        method="POST", 
        data=multipart_data, 
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    resume_id = resume_res["id"]
    print(f"    [OK] Resume uploaded successfully! Linked ID: {resume_id} (Latency: {lat:.2f}s)")
    print(f"    [Skills Extracted]: {resume_res.get('skills', [])}")

    # Step 4: Create Interview Session
    print("[*] Creating interview session for 'AI Software Engineer' at 'Google'...")
    int_res, status, lat = call_api("/create-interview", method="POST", data={
        "job_role": "AI Software Engineer",
        "company": "Google",
        "resume_id": resume_id
    })
    interview_id = int_res["interview_id"]
    print(f"    [OK] Interview Session ID {interview_id} active. (Latency: {lat:.2f}s)")
    print("    [Background Task]: Pre-generation of all 10 questions has started asynchronously.")

    # Step 5: Trigger technical question loading
    print("[*] Querying initial questions structure...")
    tech_res, status, lat = call_api("/generate-questions", method="POST", data={
        "interview_id": interview_id,
        "phase": "technical"
    })
    print(f"    [OK] Technical Questions Structure Initialized. (Latency: {lat:.2f}s)")

    # Simulate answering all 10 questions sequentially
    print("\n--- ATTENDING THE INTERVIEW (10 Questions: 5 Technical + 5 HR) ---")
    
    # Generic smart answers depending on phase
    mock_answers = {
        "technical": [
            "I design robust machine learning models, leveraging deep neural networks, spaCy, and Transformer embeddings. I focus on optimizing matrix operations and clean database indexing.",
            "I write unit tests, enforce rigorous code-review metrics, perform regular regression checks, and automate building via CI/CD pipelines.",
            "We faced a severe database bottleneck where queries took 50+ seconds. I traced the query analyzer, found missing composite keys, added indexes, and decreased query time to 50ms.",
            "Using standard frameworks offers speed, reliability, and built-in community support. However, it increases package overhead, limits granular control, and introduces third-party dependencies.",
            "I would check the query execution plan (EXPLAIN), see if it is doing full-table scans, add appropriate B-Tree indexes, rewrite complex subqueries into joins, and implement caching."
        ],
        "hr": [
            "I am a passionate AI software engineer skilled in building complex intelligent systems. I want to join Google because of your standard-setting engineering scale and impact.",
            "My biggest professional achievement was designing and deploying a multi-model RAG search backend that reduced semantic lookup errors by 90% in production.",
            "I resolve conflicts by scheduling a prompt one-on-one alignment session, listening to the core rationale, separating personal bias, and deciding strictly based on project metrics.",
            "I took leadership of an AI integration project when the team leader fell ill. I realigned deadlines, assigned tasks based on individual strengths, and successfully delivered the module.",
            "In five years, I see myself as a senior AI systems architect leading a team of talented engineers to build next-generation intelligent applications."
        ]
    }
    
    start_time = time.time()
    
    for step in range(1, 11):
        phase = "technical" if step <= 5 else "hr"
        phase_idx = (step - 1) % 5
        
        print(f"\n--- Question {step}/10 [{phase.upper()}] ---")
        
        # 1. Fetch next unanswered question
        fetch_res, status, lat = call_api(f"/get-question/{interview_id}", method="GET")
        
        q_id = fetch_res.get("question_id")
        q_text = fetch_res.get("question")
        
        # Check if the question text is a generic fallback template or a custom AI question
        is_fallback = any(q_text.startswith(p) for p in [
            "Explain the core", "How do you ensure", "Describe a complex", "What are the", "How would you optimize",
            "Tell me about", "What is your", "How do you handle", "Describe a time", "Where do you see"
        ])
        
        q_type_str = "FALLBACK PLACEHOLDER" if is_fallback else "AI-CUSTOMIZED SEMANTIC QUESTION"
        print(f"    [Question ID {q_id}]: \"{q_text}\"")
        print(f"    [Type]: {q_type_str} (Fetched in: {lat:.2f}s)")
        
        # 2. Simulate candidate reading and answering (sleep 3 seconds)
        print("    [*] Candidate is formulating answer (simulating 3 seconds thinking/typing)...")
        time.sleep(3)
        
        # 3. Submit answer to backend and measure grading latency
        ans_text = mock_answers[phase][phase_idx]
        print(f"    [*] Submitting Answer: \"{ans_text[:70]}...\"")
        
        submit_data = {
            "interview_id": interview_id,
            "question_id": q_id,
            "answer": ans_text
        }
        
        submit_res, status, lat_grade = call_api("/submit-answer", method="POST", data=submit_data)
        
        print(f"    [OK] Answer Registered and Evaluated! (Evaluation Latency: {lat_grade:.2f}s)")
        print(f"    [Score Assigned]: {submit_res.get('score')}/10")
        print(f"    [AI Feedback]: {submit_res.get('feedback')}")
        
    print("\n==================================================")
    print("     INTERVIEW COMPLETED SUCCESSFULLY!            ")
    print("==================================================\n")

    # Step 6: Fetch Interview Report
    print("[*] Generating and fetching final comprehensive report...")
    report_res, status, lat = call_api(f"/interview-report/{interview_id}", method="GET")
    print(f"    [OK] Comprehensive Report Fetched. (Latency: {lat:.2f}s)")
    print(f"    [Average Grade]: {report_res.get('average_score')}/10")
    print(f"    [Narrative Summary]: {report_res.get('narrative_summary')[:300]}...")

    total_duration = time.time() - start_time
    print(f"\n[+] Total Live Simulation Duration: {total_duration:.1f}s")
    
except Exception as e:
    print(f"\n[-] SIMULATION ERROR: {e}")
finally:
    # Safely close programmatically started server
    if server_process:
        print("\n[*] Stopping programmatically started Uvicorn server...")
        server_process.kill()
        server_process.wait()
        print("[+] Uvicorn server stopped cleanly.")

print("\n==================================================")
print("     SIMULATION WALKTHROUGH COMPLETED             ")
print("==================================================")
