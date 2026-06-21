import sys
import os
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.resume_agent import resume_agent

TEST_RESUME = """
John Doe
Software Engineer
john.doe@example.com | (123) 456-7890 | Seattle, WA

SUMMARY
Experienced software engineer with a track record of building high-performance web applications and systems.

EDUCATION
University of Washington
Bachelor of Science in Computer Science, 2022

EXPERIENCE
Software Engineer Intern | TechCorp (June 2021 - September 2021)
- Developed a Python FastAPI microservice for high-throughput data processing.
- Built a react-based dashboard for real-time monitoring.

PROJECTS
Smart Campus AI Platform
- Designed a scalable architecture using Kubernetes, Docker, and Python.
- Implemented real-time streaming using Redis.

SKILLS
Python, JavaScript, React, FastAPI, Docker, Kubernetes, SQL, Git

CERTIFICATIONS
AWS Certified Solutions Architect (2023)
"""

def test_fast_resume():
    print("[TEST] Starting fast resume parsing test...")
    start_time = time.time()
    
    info = resume_agent.extract_personal_info(TEST_RESUME)
    duration = time.time() - start_time
    
    print(f"[TEST] Parsed in {duration:.4f} seconds.")
    print("[TEST] Extracted Info:")
    print(f"  Name: {info.get('name')}")
    print(f"  Email: {info.get('email')}")
    print(f"  Phone: {info.get('phone_number')}")
    print(f"  Skills: {info.get('skills')}")
    print(f"  Education: {info.get('education')}")
    print(f"  Projects: {info.get('projects')}")
    print(f"  Experience: {info.get('experience')}")
    print(f"  Certifications: {info.get('certifications')}")
    
    # Assertions
    assert duration < 0.1, f"Parsing took too long: {duration} seconds"
    assert info.get("name") == "John Doe", f"Expected name 'John Doe', got '{info.get('name')}'"
    assert info.get("email") == "john.doe@example.com", f"Expected email, got '{info.get('email')}'"
    assert info.get("phone_number") == "(123) 456-7890", f"Expected phone number, got '{info.get('phone_number')}'"
    assert "python" in info.get("skills"), "Expected 'python' in skills"
    assert any("University of Washington" in edu for edu in info.get("education")), "Expected University of Washington in education"
    
    print("[TEST] All assertions passed successfully!")

if __name__ == "__main__":
    test_fast_resume()
