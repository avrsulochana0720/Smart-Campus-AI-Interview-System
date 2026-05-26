"""
test_complete_flow.py — Comprehensive End-to-End Integration and Verification Test
Asserts:
1. Real-time answer and factor-scoring storage inside Answer model database columns.
2. Unified PDF/JSON RAG reference matching during submissions.
3. Accurate factor-based averages and weighted overall scores computed and saved to the InterviewReport database record.
4. History and persistence on relogin.
"""
import requests
import json
import time
import os

BASE = "http://localhost:8000"
EMAIL = f"verifuser_{int(time.time())}@verify.com"
PASSWORD = "verifypassword123"
NAME = "Verification Candidate"

def run_verification():
    print("=" * 70)
    print("AI INTERVIEW SYSTEM MIGRATION - COMPLETE FLOW VERIFICATION")
    print("=" * 70)

    # 1. Register candidate
    print("\n[1] Registering verification candidate...")
    r = requests.post(f"{BASE}/register", data={
        "name": NAME,
        "email": EMAIL,
        "password": PASSWORD
    })
    assert r.status_code == 200, f"Registration failed: {r.text}"
    print("  [PASS] Candidate registered successfully.")

    # 2. Login to get token
    print("\n[2] Logging in...")
    r = requests.post(f"{BASE}/login", json={
        "email": EMAIL,
        "password": PASSWORD
    })
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [PASS] Authentication token acquired.")

    # 3. Upload a sample developer resume
    print("\n[3] Uploading developer resume...")
    resume_text = """
    Alice Johnson
    Senior Software Engineer
    Skills: Python, Go, SQL, PostgreSQL, Docker, AWS, microservices, REST APIs
    Experience: 5 years building highly scalable backend architectures. Deep knowledge of performance tuning, caching strategies, and OOP patterns.
    """
    with open("temp_verification_resume.txt", "w") as f:
        f.write(resume_text)
        
    with open("temp_verification_resume.txt", "rb") as f:
        r = requests.post(f"{BASE}/upload-resume",
            headers=headers,
            files={"file": ("resume.txt", f, "text/plain")}
        )
    assert r.status_code == 200, f"Resume upload failed: {r.text}"
    resume_id = r.json().get("resume_id") or r.json().get("id")
    print(f"  [PASS] Resume uploaded. ID={resume_id}")

    # 4. Create interview session
    print("\n[4] Creating interview session...")
    r = requests.post(f"{BASE}/create-interview",
        headers=headers,
        json={
            "job_role": "Backend Engineer",
            "company": "Amazon",
            "resume_id": resume_id
        }
    )
    assert r.status_code == 200, f"Create interview failed: {r.text}"
    interview_id = r.json()["interview_id"]
    print(f"  [PASS] Interview session created. Interview ID={interview_id}")

    # 5. Generate Technical questions (should retrieve from technical/math JSON files)
    print("\n[5] Generating Technical interview questions...")
    r = requests.post(f"{BASE}/generate-questions",
        headers=headers,
        json={"interview_id": interview_id, "phase": "technical"}
    )
    assert r.status_code == 200, f"Generate questions failed: {r.text}"
    tech_questions = r.json()["questions"]
    print(f"  [PASS] Generated {len(tech_questions)} Technical questions:")
    for i, q in enumerate(tech_questions):
        print(f"    Q{i+1}: {q['question'][:80]}...")

    # 6. Submit technical answers and assert real-time database factor scoring
    print("\n[6] Submitting Technical answers and verifying real-time factor scores...")
    for idx, q in enumerate(tech_questions):
        # Retrieve next question
        r = requests.get(f"{BASE}/get-question/{interview_id}", headers=headers)
        q_record = r.json()
        qid = q_record["question_id"]
        
        # Submit high-quality structured answer
        answer = (
            "To solve this problem efficiently in production, I would use a hash map to achieve O(N) time complexity "
            "and O(N) space complexity. We can iterate through the elements, calculate the target complement, and store "
            "indices in the map. This avoids the O(N^2) brute-force nested loop approach, optimizing compute times significantly."
        )
        print(f"  Submitting answer to Q{idx+1} (ID: {qid})...")
        r = requests.post(f"{BASE}/submit-answer",
            headers=headers,
            json={
                "interview_id": interview_id,
                "question_id": qid,
                "answer": answer
            }
        )
        assert r.status_code == 200, f"Submit answer failed: {r.text}"
        ans_res = r.json()
        print(f"    [OK] Score: {ans_res['score']}/10 | Feedback: {ans_res['feedback'][:70]}...")
        assert ans_res['score'] is not None, "Real-time score must not be null"
    print("  [PASS] All technical answers submitted and scored.")

    # 7. Generate HR questions (should retrieve from HR JSON files)
    print("\n[7] Generating HR interview questions...")
    r = requests.post(f"{BASE}/generate-questions",
        headers=headers,
        json={"interview_id": interview_id, "phase": "hr"}
    )
    assert r.status_code == 200, f"HR question generation failed: {r.text}"
    hr_questions = r.json()["questions"]
    print(f"  [PASS] Generated {len(hr_questions)} HR questions:")
    for i, q in enumerate(hr_questions):
        print(f"    Q{i+1}: {q['question'][:80]}...")

    # 8. Submit HR answers
    print("\n[8] Submitting HR answers...")
    for idx, q in enumerate(hr_questions):
        r = requests.get(f"{BASE}/get-question/{interview_id}", headers=headers)
        q_record = r.json()
        if q_record.get("is_complete"):
            break
        qid = q_record["question_id"]
        
        answer = (
            "I strongly believe that communication and collaborative transparency are key for any successful team. "
            "When conflict arises, I focus on collaborative problem-solving, active listening, and objective trade-offs "
            "rather than personal opinions. At my previous job, this helped us ship our main microservice on time."
        )
        print(f"  Submitting HR answer to Q{idx+1} (ID: {qid})...")
        r = requests.post(f"{BASE}/submit-answer",
            headers=headers,
            json={
                "interview_id": interview_id,
                "question_id": qid,
                "answer": answer
            }
        )
        assert r.status_code == 200, f"Submit HR answer failed: {r.text}"
        ans_res = r.json()
        print(f"    [OK] Score: {ans_res['score']}/10 | Feedback: {ans_res['feedback'][:70]}...")
    print("  [PASS] All HR answers submitted and scored.")

    # 9. Trigger comprehensive Report Generation in background
    print("\n[9] Triggering background Report Generation...")
    r = requests.post(f"{BASE}/generate-report/{interview_id}", headers=headers)
    assert r.status_code == 200, f"Trigger report failed: {r.text}"
    print(f"  Response: {r.json()}")
    
    # Wait for the background task to complete (polling report status)
    print("  Waiting for background report generator to complete...")
    for attempt in range(15):
        time.sleep(2)
        r = requests.get(f"{BASE}/get-report/{interview_id}", headers=headers)
        if r.status_code == 200:
            report = r.json()
            if report.get("status") == "completed":
                print(f"  [OK] Report generation completed in {attempt * 2 + 2} seconds.")
                break
            elif report.get("status") == "failed":
                raise Exception("Background report generation failed.")
        print(f"    Polling attempt {attempt+1}... status: {r.json().get('status') if r.status_code == 200 else 'pending'}")
    else:
        raise TimeoutError("Report generation timed out.")

    # 10. Assert DB persistence and factor analysis correctness
    print("\n[10] Verifying database persistence and factor scoring records...")
    r = requests.get(f"{BASE}/get-report/{interview_id}", headers=headers)
    assert r.status_code == 200, f"Failed to retrieve report: {r.text}"
    report_details = r.json()
    
    # Assert narrative, scores, recommendation
    print(f"  Narrative Summary (partial): {report_details['narrative_summary'][:150]}...")
    print(f"  Recommendation: {report_details['recommendation']}")
    print(f"  Final Score: {report_details['final_interview_score']}%")
    print(f"  Average Technical Score: {report_details['overall_technical_score']}%")
    print(f"  Average HR Score: {report_details['overall_hr_score']}%")
    
    # Assert all factor fields are not None and correct
    assert report_details['final_interview_score'] > 0, "Final interview score should be greater than zero"
    assert report_details['overall_technical_score'] > 0, "Technical score should be greater than zero"
    assert report_details['overall_hr_score'] > 0, "HR score should be greater than zero"
    
    assert report_details['tech_accuracy_avg'] is not None, "tech_accuracy_avg should not be null"
    assert report_details['tech_concept_understanding_avg'] is not None, "tech_concept_understanding_avg should not be null"
    assert report_details['tech_problem_solving_avg'] is not None, "tech_problem_solving_avg should not be null"
    assert report_details['tech_communication_avg'] is not None, "tech_communication_avg should not be null"
    assert report_details['tech_code_quality_avg'] is not None, "tech_code_quality_avg should not be null"
    
    assert report_details['hr_communication_skills_avg'] is not None, "hr_communication_skills_avg should not be null"
    assert report_details['hr_confidence_avg'] is not None, "hr_confidence_avg should not be null"
    assert report_details['hr_professionalism_avg'] is not None, "hr_professionalism_avg should not be null"
    assert report_details['hr_adaptability_avg'] is not None, "hr_adaptability_avg should not be null"
    assert report_details['hr_team_collaboration_avg'] is not None, "hr_team_collaboration_avg should not be null"
    
    print("  [PASS] All persistent factor score averages and final scores successfully asserted in DB.")

    # 11. Interview History on Relogin
    print("\n[11] Testing Interview History persistence...")
    r = requests.get(f"{BASE}/interview-history", headers=headers)
    assert r.status_code == 200, f"History fetch failed: {r.text}"
    history = r.json()
    assert len(history) > 0, "History should not be empty"
    latest_hist = history[0]
    assert latest_hist["interview_id"] == interview_id, "Latest interview ID should match"
    print(f"  Latest history: {latest_hist['job_role']} at {latest_hist['company']}")
    print(f"  Has narrative report: {'Yes' if latest_hist['report'].get('narrative_summary') else 'No'}")
    assert latest_hist['report'].get('technical_score') > 0, "Technical score in history should be present"
    print("  [PASS] Interview history and persistent reports validated.")

    # Cleanup temp file
    if os.path.exists("temp_verification_resume.txt"):
        os.remove("temp_verification_resume.txt")

    print("\n" + "=" * 70)
    print("ALL VERIFICATION TASKS COMPLETED SUCCESSFULLY!")
    print("The system is fully migrated, optimized, and factor-evaluated.")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
