"""
profile_system.py — High-fidelity profiling script to benchmark every step of the AI Interview System.
"""
import sys
import os
import time
import json
import hashlib
import psutil

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
from models import User, Interview, Resume, InterviewQuestion, Answer, InterviewReport
from agents.resume_agent import resume_agent
from agents.question_agent import question_agent
from agents.eval_agent import eval_agent
from agents.rag_agent import rag_agent

def get_memory_usage():
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)  # MB

def run_profile():
    print("========== PROFILE BENCHMARK START ==========")
    start_memory = get_memory_usage()
    print(f"Initial Memory Usage: {start_memory:.2f} MB")
    
    # Ensure all tables are created (especially if falling back to SQLite)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Profile JSON Knowledge Base Pre-loading
    print("\n--- Step 1: JSON Knowledge Base Preloading ---")
    t0 = time.time()
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_result = rag_agent.load_json_knowledge_base(base_path=base_path, db=db)
    t1 = time.time()
    json_time = t1 - t0
    json_mem = get_memory_usage()
    print(f"JSON Preload Time: {json_time:.4f}s")
    print(f"Memory Usage after preload: {json_mem:.2f} MB (Delta: {json_mem - start_memory:.2f} MB)")
    print(f"Loaded {json_result.get('total_entries_loaded', 0)} entries")

    # 2. Profile RAG Index Rebuilding / DB retrieval
    print("\n--- Step 2: RAG Index Rebuilding ---")
    t0 = time.time()
    rag_agent._rebuild_index(db)
    t1 = time.time()
    index_time = t1 - t0
    index_mem = get_memory_usage()
    print(f"RAG Index Rebuild Time: {index_time:.4f}s")
    print(f"Memory after index: {index_mem:.2f} MB")

    # 3. Profile Resume Text Extraction and Extracted Skills
    print("\n--- Step 3: Resume Analysis & Skills Extraction ---")
    mock_resume_text = "Experienced Backend Engineer skilled in Python, FastAPI, React, Node.js, Docker, PostgreSQL, and AWS. Built multiple scalable microservices, REST APIs, and managed CI/CD pipelines."
    t0 = time.time()
    skills = resume_agent.extract_skills(mock_resume_text)
    t1 = time.time()
    skills_time = t1 - t0
    print(f"Skills Extraction Time: {skills_time:.4f}s")
    print(f"Extracted Skills: {skills}")

    t0 = time.time()
    # Resume Analysis (Inference)
    analysis = resume_agent.analyze_resume(
        resume_text=mock_resume_text,
        job_role="Backend Developer",
        company="Google"
    )
    t1 = time.time()
    analysis_time = t1 - t0
    print(f"Resume AI Analysis Time (Inference): {analysis_time:.4f}s")
    print(f"AI Readiness Score: {analysis.get('readiness_score')}/10")

    # 4. Profile RAG Context Retrieval (Technical & HR)
    print("\n--- Step 4: RAG Retrieval ---")
    t0 = time.time()
    tech_context = rag_agent.retrieve_context(
        resume_text=mock_resume_text,
        job_role="Backend Developer",
        company="Google",
        phase="technical",
        top_k=5,
        db=db
    )
    t1 = time.time()
    tech_rag_time = t1 - t0
    print(f"Technical RAG Context Retrieval Time: {tech_rag_time:.4f}s")
    print(f"Retrieved: {len(tech_context.get('qa_pairs', []))} Q&A pairs, {len(tech_context.get('context_chunks', []))} chunks")

    # Check cache hit RAG context retrieval
    t0 = time.time()
    tech_context_cached = rag_agent.retrieve_context(
        resume_text=mock_resume_text,
        job_role="Backend Developer",
        company="Google",
        phase="technical",
        top_k=5,
        db=db
    )
    t1 = time.time()
    tech_rag_cached_time = t1 - t0
    print(f"Technical RAG Context Retrieval Time (Cached Hit): {tech_rag_cached_time:.4f}s (Speedup: {tech_rag_time/max(0.0001, tech_rag_cached_time):.1f}x)")

    # 5. Profile Question Generation (Model Inference)
    print("\n--- Step 5: Question Generation ---")
    t0 = time.time()
    tech_questions = question_agent.generate_questions(
        resume_text=mock_resume_text,
        job_role="Backend Developer",
        company="Google",
        phase="technical",
        rag_context=tech_context
    )
    t1 = time.time()
    tech_q_time = t1 - t0
    print(f"Technical Question Generation Time (Inference): {tech_q_time:.4f}s")
    print(f"Generated {len(tech_questions)} questions:")
    for idx, q in enumerate(tech_questions[:2]):
        print(f"  Q{idx+1}: {q.get('question') if isinstance(q, dict) else q}")

    # HR RAG + HR generation
    t0 = time.time()
    hr_context = rag_agent.retrieve_context(
        resume_text=mock_resume_text,
        job_role="Backend Developer",
        company="Google",
        phase="hr",
        top_k=5,
        db=db
    )
    hr_questions = question_agent.generate_questions(
        resume_text=mock_resume_text,
        job_role="Backend Developer",
        company="Google",
        phase="hr",
        rag_context=hr_context
    )
    t1 = time.time()
    hr_time = t1 - t0
    print(f"HR Question Generation Time (Inference + RAG): {hr_time:.4f}s")

    # 6. Profile Answer Evaluation (Model Inference)
    print("\n--- Step 6: Answer Evaluation ---")
    test_question = "Explain the core architecture of a project you built using Python/FastAPI."
    test_answer = "I built a high-performance REST API using FastAPI. It utilizes asynchronous event-loop architecture for handling concurrent requests without blocking, uses SQLAlchemy as ORM connected to PostgreSQL, and is fully containerized using Docker."
    expected_answer = "FastAPI uses an ASGI server like uvicorn, supports python type hints, uses Pydantic for validation, and operates asynchronously using python's asyncio and async/await syntax to achieve comparable performance to Node.js and Go."

    t0 = time.time()
    evaluation = eval_agent.evaluate_answer(
        question=test_question,
        user_answer=test_answer,
        job_role="Backend Developer",
        company="Google",
        resume_summary=mock_resume_text,
        expected_answer=expected_answer,
        question_type="technical"
    )
    t1 = time.time()
    eval_time = t1 - t0
    print(f"AI Answer Evaluation Time (Inference): {eval_time:.4f}s")
    print(f"Overall Evaluation Score: {evaluation.get('score')}/10")
    print(f"Feedback: {evaluation.get('feedback')}")

    # 7. Expected Answer Retrieval Matching
    print("\n--- Step 7: Expected Answer Retrieval ---")
    t0 = time.time()
    expected_result = rag_agent.get_expected_answers([test_question], db=db)
    t1 = time.time()
    expected_time = t1 - t0
    print(f"Expected Answer Matching Time: {expected_time:.4f}s")
    print(f"Matched Answer Source: {expected_result[0].get('source')}")

    t0 = time.time()
    expected_result_cached = rag_agent.get_expected_answers([test_question], db=db)
    t1 = time.time()
    expected_cached_time = t1 - t0
    print(f"Expected Answer Matching Time (Cached): {expected_cached_time:.4f}s")

    # 8. Report Generation & Narrative Summary
    print("\n--- Step 8: Report Narrative Summary ---")
    qa_data = [
        {"question": test_question, "answer": test_answer, "score": 9}
    ]
    t0 = time.time()
    narrative = eval_agent.generate_narrative_summary(
        job_role="Backend Developer",
        company="Google",
        qa_data=qa_data
    )
    t1 = time.time()
    narrative_time = t1 - t0
    print(f"Report Narrative Generation Time (Inference): {narrative_time:.4f}s")
    print(f"Narrative Summary Preview: {narrative[:150]}...")

    db.close()
    
    # Compile performance logs
    print("\n================ BENCHMARK SUMMARY ================")
    print(f"{'Step Name':<35} | {'Latency':<10} | {'Memory (MB)':<12} | {'Bottleneck Level'}")
    print("-" * 80)
    print(f"{'1. JSON Preloading & DB Sync':<35} | {json_time:>8.3f}s | {json_mem:>10.2f} | Low")
    print(f"{'2. RAG Indexing Rebuild':<35} | {index_time:>8.3f}s | {index_mem:>10.2f} | Low")
    print(f"{'3. Skills Keyword Extraction':<35} | {skills_time:>8.3f}s | {index_mem:>10.2f} | Negligible")
    print(f"{'4. Resume AI Analysis (Inference)':<35} | {analysis_time:>8.3f}s | {index_mem:>10.2f} | High")
    print(f"{'5. Technical RAG Context Retrieval':<35} | {tech_rag_time:>8.3f}s | {index_mem:>10.2f} | Negligible")
    print(f"{'6. RAG Context Retrieval (Cached)':<35} | {tech_rag_cached_time:>8.3f}s | {index_mem:>10.2f} | Negligible")
    print(f"{'7. Tech Question Generation (Model)':<35} | {tech_q_time:>8.3f}s | {index_mem:>10.2f} | Critical")
    print(f"{'8. HR Question Gen + RAG (Model)':<35} | {hr_time:>8.3f}s | {index_mem:>10.2f} | Critical")
    print(f"{'9. Answer AI Evaluation (Inference)':<35} | {eval_time:>8.3f}s | {index_mem:>10.2f} | Critical")
    print(f"{'10. Expected Answer Retrieval':<35} | {expected_time:>8.3f}s | {index_mem:>10.2f} | Negligible")
    print(f"{'11. Expected Answer (Cached)':<35} | {expected_cached_time:>8.3f}s | {index_mem:>10.2f} | Negligible")
    print(f"{'12. Report Narrative Generation':<35} | {narrative_time:>8.3f}s | {index_mem:>10.2f} | Critical")
    print("==================================================")

if __name__ == "__main__":
    run_profile()
