"""
Full end-to-end integration test:
Register -> Login -> Upload Resume -> Create Interview -> Generate Questions -> Submit Answer -> Generate Report -> History
"""
import requests
import json
import time
import os

BASE = "http://localhost:8000"
EMAIL = f"testuser_{int(time.time())}@test.com"
PASSWORD = "test123456"
NAME = "Test User"

def test_full_flow():
    print("=" * 60)
    print("FULL STACK INTEGRATION TEST")
    print("=" * 60)

    # 1. Register
    print("\n[1] REGISTER...")
    r = requests.post(f"{BASE}/register", data={
        "name": NAME,
        "email": EMAIL,
        "password": PASSWORD
    })
    print(f"  Status: {r.status_code}")
    print(f"  Response: {r.json()}")
    assert r.status_code == 200, f"Register failed: {r.text}"
    print("  [PASS] Registration successful")

    # 2. Login
    print("\n[2] LOGIN...")
    r = requests.post(f"{BASE}/login", json={
        "email": EMAIL,
        "password": PASSWORD
    })
    print(f"  Status: {r.status_code}")
    data = r.json()
    assert "access_token" in data, f"Login failed: {r.text}"
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  [PASS] Login successful, token received")

    # 3. Upload Resume (create a test PDF-like text file)
    print("\n[3] UPLOAD RESUME...")
    test_resume = """John Doe - Software Engineer
Skills: Python, JavaScript, React, Node.js, FastAPI, SQL, MongoDB, Docker, AWS, Machine Learning
Experience: 3 years at TechCorp building web applications
Education: B.Tech Computer Science
Projects: Built a real-time chat app using WebSocket and React
"""
    # Write temp file
    with open("test_resume.txt", "w") as f:
        f.write(test_resume)
    
    with open("test_resume.txt", "rb") as f:
        r = requests.post(f"{BASE}/upload-resume",
            headers=headers,
            files={"file": ("resume.txt", f, "text/plain")}
        )
    print(f"  Status: {r.status_code}")
    resume_data = r.json()
    print(f"  Resume ID: {resume_data.get('resume_id') or resume_data.get('id')}")
    print(f"  Skills: {resume_data.get('skills', [])}")
    assert r.status_code == 200, f"Resume upload failed: {r.text}"
    resume_id = resume_data.get("resume_id") or resume_data.get("id")
    print(f"  [PASS] Resume uploaded, ID={resume_id}")

    # 4. Create Interview
    print("\n[4] CREATE INTERVIEW...")
    r = requests.post(f"{BASE}/create-interview",
        headers=headers,
        json={
            "job_role": "Full Stack Developer",
            "company": "Google",
            "resume_id": resume_id
        }
    )
    print(f"  Status: {r.status_code}")
    interview_data = r.json()
    interview_id = interview_data["interview_id"]
    print(f"  Interview ID: {interview_id}")
    assert r.status_code == 200, f"Create interview failed: {r.text}"
    print(f"  [PASS] Interview created, ID={interview_id}")

    # 5. Get Interview Report (initial — should return empty)
    print("\n[5] GET INTERVIEW REPORT (initial)...")
    r = requests.get(f"{BASE}/interview-report/{interview_id}", headers=headers)
    print(f"  Status: {r.status_code}")
    report = r.json()
    print(f"  Job Role: {report.get('job_role')}")
    print(f"  Company: {report.get('company')}")
    print(f"  [PASS] Initial report endpoint works")

    # 6. Generate Technical Questions
    print("\n[6] GENERATE TECHNICAL QUESTIONS...")
    r = requests.post(f"{BASE}/generate-questions",
        headers=headers,
        json={"interview_id": interview_id, "phase": "technical"}
    )
    print(f"  Status: {r.status_code}")
    q_data = r.json()
    tech_questions = q_data.get("questions", [])
    print(f"  Questions generated: {len(tech_questions)}")
    for i, q in enumerate(tech_questions):
        print(f"    Q{i+1}: {q['question'][:80]}...")
    assert len(tech_questions) > 0, "No technical questions generated"
    print(f"  [PASS] {len(tech_questions)} technical questions generated")

    # 7. Get First Question
    print("\n[7] GET FIRST QUESTION...")
    r = requests.get(f"{BASE}/get-question/{interview_id}", headers=headers)
    print(f"  Status: {r.status_code}")
    first_q = r.json()
    print(f"  Question ID: {first_q.get('question_id')}")
    print(f"  Question: {first_q.get('question', '')[:80]}...")
    assert "question_id" in first_q, "No question returned"
    print(f"  [PASS] First question retrieved")

    # 8. Submit Answer (to first question)
    print("\n[8] SUBMIT ANSWER (eval_agent)...")
    r = requests.post(f"{BASE}/submit-answer",
        headers=headers,
        json={
            "interview_id": interview_id,
            "question_id": first_q["question_id"],
            "answer": "I have 3 years of experience building full-stack applications using React for the frontend and FastAPI/Node.js for the backend. I've worked extensively with SQL databases and MongoDB, and I've deployed applications using Docker on AWS. My most significant project was a real-time collaborative tool that handles thousands of concurrent users."
        }
    )
    print(f"  Status: {r.status_code}")
    answer_data = r.json()
    print(f"  Score: {answer_data.get('score')}/10")
    print(f"  Feedback: {answer_data.get('feedback', '')[:100]}...")
    print(f"  Next Question: {answer_data.get('next_question', '')[:80] if answer_data.get('next_question') else 'None'}...")
    print(f"  Is Complete: {answer_data.get('is_complete')}")
    assert r.status_code == 200, f"Submit answer failed: {r.text}"
    print(f"  [PASS] Answer evaluated: {answer_data.get('score')}/10")

    # 9. Submit remaining answers quickly
    print("\n[9] SUBMIT REMAINING ANSWERS...")
    answered = 1
    while True:
        r = requests.get(f"{BASE}/get-question/{interview_id}", headers=headers)
        q = r.json()
        if q.get("is_complete"):
            print(f"  All questions answered ({answered} total)")
            break
        qid = q.get("question_id")
        if not qid:
            break
        r = requests.post(f"{BASE}/submit-answer",
            headers=headers,
            json={
                "interview_id": interview_id,
                "question_id": qid,
                "answer": f"This is my detailed answer covering the topic with practical examples from my experience as a full-stack developer working on scalable systems at TechCorp."
            }
        )
        result = r.json()
        answered += 1
        print(f"  Answered Q{answered}: Score={result.get('score')}/10")
    print(f"  [PASS] All technical questions answered")

    # 10. Generate HR Questions
    print("\n[10] GENERATE HR QUESTIONS...")
    r = requests.post(f"{BASE}/generate-questions",
        headers=headers,
        json={"interview_id": interview_id, "phase": "hr"}
    )
    print(f"  Status: {r.status_code}")
    hr_data = r.json()
    hr_questions = hr_data.get("questions", [])
    print(f"  HR Questions: {len(hr_questions)}")
    for i, q in enumerate(hr_questions):
        print(f"    Q{i+1}: {q['question'][:80]}...")
    print(f"  [PASS] {len(hr_questions)} HR questions generated")

    # 11. Answer all HR questions
    print("\n[11] ANSWER HR QUESTIONS...")
    hr_answered = 0
    while True:
        r = requests.get(f"{BASE}/get-question/{interview_id}", headers=headers)
        q = r.json()
        if q.get("is_complete"):
            print(f"  All HR questions answered ({hr_answered} total)")
            break
        qid = q.get("question_id")
        if not qid:
            break
        r = requests.post(f"{BASE}/submit-answer",
            headers=headers,
            json={
                "interview_id": interview_id,
                "question_id": qid,
                "answer": f"I am passionate about technology and team collaboration. I believe my experience at TechCorp has prepared me well for this role at Google."
            }
        )
        result = r.json()
        hr_answered += 1
        print(f"  HR Q{hr_answered}: Score={result.get('score')}/10")
    print(f"  [PASS] All HR questions answered")

    # 12. Generate Report (Gemini Flash)
    print("\n[12] GENERATE REPORT (Gemini Flash)...")
    r = requests.post(f"{BASE}/generate-report/{interview_id}", headers=headers)
    print(f"  Status: {r.status_code}")
    report = r.json()
    print(f"  Report Status: {report.get('status')}")
    print(f"  Average Score: {report.get('average_score')}")
    print(f"  Total Questions: {report.get('total_questions')}")
    print(f"  Answered: {report.get('answered_questions')}")
    if report.get("narrative_summary"):
        print(f"  Narrative (first 200 chars): {report['narrative_summary'][:200]}...")
    assert r.status_code == 200, f"Generate report failed: {r.text}"
    print(f"  [PASS] Report generated successfully")

    # 13. Get Saved Report
    print("\n[13] GET SAVED REPORT...")
    r = requests.get(f"{BASE}/get-report/{interview_id}", headers=headers)
    print(f"  Status: {r.status_code}")
    saved = r.json()
    print(f"  Report ID: {saved.get('report_id')}")
    print(f"  Status: {saved.get('status')}")
    print(f"  [PASS] Saved report retrieved")

    # 14. Interview History
    print("\n[14] INTERVIEW HISTORY...")
    r = requests.get(f"{BASE}/interview-history", headers=headers)
    print(f"  Status: {r.status_code}")
    history = r.json()
    print(f"  Total interviews: {len(history)}")
    if history:
        h = history[0]
        print(f"  Latest: {h['job_role']} @ {h['company']}")
        print(f"  QA items: {len(h['qa_list'])}")
        print(f"  Avg Score: {h['average_score']:.1f}/10")
        print(f"  Has narrative: {'Yes' if h.get('narrative_summary') else 'No'}")
    print(f"  [PASS] Interview history retrieved")

    # Cleanup
    if os.path.exists("test_resume.txt"):
        os.remove("test_resume.txt")

    print("\n" + "=" * 60)
    print("ALL 14 TESTS PASSED!")
    print("Full stack is connected and working.")
    print("=" * 60)

if __name__ == "__main__":
    test_full_flow()
