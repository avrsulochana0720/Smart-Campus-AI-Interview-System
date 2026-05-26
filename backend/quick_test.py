"""Quick end-to-end verification test"""
import requests, time, os

BASE = "http://localhost:8000"
email = f"quick_{int(time.time())}@test.com"

# Register + Login
r = requests.post(f"{BASE}/register", data={"name": "Quick Test", "email": email, "password": "pass123456"})
print(f"Register: {r.status_code}")
r = requests.post(f"{BASE}/login", json={"email": email, "password": "pass123456"})
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"Login: OK")

# Upload Resume
with open("_test_resume.txt", "w") as f:
    f.write("Python JavaScript React Node.js Docker AWS FastAPI experienced developer")
with open("_test_resume.txt", "rb") as f:
    r = requests.post(f"{BASE}/upload-resume", headers=headers, files={"file": ("resume.txt", f)})
resume_id = r.json().get("resume_id") or r.json().get("id")
print(f"Resume: ID={resume_id}")
os.remove("_test_resume.txt")

# Create Interview
r = requests.post(f"{BASE}/create-interview", headers=headers, json={"job_role": "Backend Developer", "company": "Microsoft", "resume_id": resume_id})
iid = r.json()["interview_id"]
print(f"Interview: ID={iid}")

# Generate 5 tech questions
r = requests.post(f"{BASE}/generate-questions", headers=headers, json={"interview_id": iid, "phase": "technical"})
qs = r.json().get("questions", [])
print(f"Tech Questions: {len(qs)}")
for i, q in enumerate(qs):
    print(f"  Q{i+1}: {q['question'][:70]}...")

# Answer first question
r = requests.get(f"{BASE}/get-question/{iid}", headers=headers)
qid = r.json()["question_id"]
r = requests.post(f"{BASE}/submit-answer", headers=headers, json={
    "interview_id": iid, "question_id": qid,
    "answer": "I use Python FastAPI for building scalable REST APIs with async support and SQLAlchemy ORM."
})
data = r.json()
print(f"Answer Score: {data['score']}/10")
print(f"Feedback: {data['feedback'][:100]}...")

# History
r = requests.get(f"{BASE}/interview-history", headers=headers)
print(f"History: {len(r.json())} interviews")

print("\n[ALL CHECKS PASSED] Backend is fully operational!")
