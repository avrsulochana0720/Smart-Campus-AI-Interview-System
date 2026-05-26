import sys
import os

# Add backend to sys.path
backend_path = r"c:\Users\ADMIN\OneDrive\Desktop\app\backend"
sys.path.append(backend_path)

print("Starting Direct Gemini Integration Test...")

try:
    from agents.resume_agent import resume_agent
    print("[OK] Successfully imported ResumeAgent!")
    
    print("\n--- Testing Resume Analysis ---")
    analysis = resume_agent.analyze_resume(
        resume_text="Experienced developer skilled in Python, JavaScript, React, Node.js, and Docker.",
        job_role="Senior Fullstack Developer",
        company="Microsoft"
    )
    print("Resume Analysis Output:")
    print(analysis)
    print("Readiness score:", analysis.get("readiness_score"))
except Exception as e:
    print("[ERROR] ResumeAgent Test Failed:", e)

try:
    from ai_service import QuestionGenerator, AnswerEvaluator
    print("\n[OK] Successfully imported QuestionGenerator and AnswerEvaluator!")
    
    print("\n--- Testing Question Generation ---")
    generator = QuestionGenerator()
    questions = generator.generate_ai_questions(
        resume_text="Senior backend python developer",
        job_role="Backend Engineer",
        company="Google",
        phase="technical"
    )
    print("Generated Questions:")
    for i, q in enumerate(questions):
        print(f"  {i+1}. {q.get('question')} ({q.get('type')}, {q.get('difficulty')})")
        
    print("\n--- Testing Answer Evaluation ---")
    evaluator = AnswerEvaluator()
    evaluation = evaluator.evaluate_answer(
        question="Explain the difference between a list and a tuple in Python.",
        user_answer="A list is mutable meaning you can modify it, while a tuple is immutable and cannot be modified after creation.",
        job_role="Python Developer",
        company="Amazon"
    )
    print("Evaluation Output:")
    print(evaluation)
except Exception as e:
    print("[ERROR] AI Service Test Failed:", e)

print("\nDirect Gemini Integration Test Completed!")
