import sys
import os
import time

# Add parent directory to sys.path so we can import agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.question_agent import question_agent

resume = "Senior Software Engineer with 6 years of experience in Python, Django, PostgreSQL, and AWS. Strong in system design, APIs, and microservices."
job_role = "Python Backend Developer"
company = "Google"

print("--- Testing Question Generation Time ---")
print(f"Model: {question_agent.model}")
print("Generating exactly 1 customized question...")

start = time.time()
questions = question_agent.generate_questions(
    resume_text=resume,
    job_role=job_role,
    company=company,
    phase="technical",
    existing_questions=[],
    rag_context=None,
    count=1
)
duration = time.time() - start

print("\n--- Result ---")
print(f"Time Taken: {duration:.4f} seconds")
print(f"Generated Question: {questions}")
