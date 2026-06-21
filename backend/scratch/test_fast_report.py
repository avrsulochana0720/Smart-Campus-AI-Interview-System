import sys
import os
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.eval_agent import eval_agent
from agents.report_agent import report_agent

def test_fast_report():
    print("[TEST] Starting fast evaluation and report generation test...")
    
    # 1. Test answer evaluation speed
    start_eval = time.time()
    for i in range(10):
        q_type = "technical" if i < 5 else "hr"
        eval_result = eval_agent.evaluate_answer(
            question=f"Test question {i+1}",
            user_answer="This is a test response to check the speed of evaluation.",
            job_role="Software Engineer",
            company="Google",
            question_type=q_type
        )
        assert eval_result.get("score") is not None, "Evaluation failed to return a score"
    eval_duration = time.time() - start_eval
    print(f"[TEST] Evaluated 10 answers in {eval_duration:.4f} seconds.")
    assert eval_duration < 0.1, "Evaluating answers took too long"

    # 2. Test report generation speed
    qa_data = [
        {
            "question": f"Test question {i+1}",
            "question_type": "technical" if i < 5 else "hr",
            "answer": "This is a test response.",
            "score": 8 if i % 2 == 0 else 6,
            "feedback": "Good response.",
            "expected_answer": "Expected test response.",
            "accuracy_score": 8 if i < 5 else 0,
            "concept_understanding_score": 8 if i < 5 else 0,
            "problem_solving_score": 8 if i < 5 else 0,
            "communication_clarity_score": 8 if i < 5 else 0,
            "code_quality_score": 8 if i < 5 else 0,
            "communication_skills_score": 8 if i >= 5 else 0,
            "confidence_score": 8 if i >= 5 else 0,
            "professionalism_score": 8 if i >= 5 else 0,
            "adaptability_score": 8 if i >= 5 else 0,
            "team_collaboration_score": 8 if i >= 5 else 0
        }
        for i in range(10)
    ]

    start_report = time.time()
    report = report_agent.generate_report(
        job_role="Software Engineer",
        company="Google",
        qa_data=qa_data,
        resume_text="Experienced engineer.",
        proctoring_summary={"total_violations": 0},
        rag_evaluation={"technical_score": 8, "hr_score": 8, "matching_score": 80, "confidence_score": 8},
        factor_evaluation=None
    )
    report_duration = time.time() - start_report
    print(f"[TEST] Generated report in {report_duration:.4f} seconds.")
    print("[TEST] Sample Report Fields:")
    print(f"  Recommendation: {report.get('recommendation')}")
    print(f"  Strengths: {report.get('strengths')}")
    print(f"  Weaknesses: {report.get('weaknesses')}")
    print(f"  Hiring Readiness Score: {report.get('hiring_readiness_score')}%")
    print(f"  Status: {report.get('status')}")

    assert report_duration < 0.05, "Report generation took too long"
    assert report.get("status") == "completed", "Report status should be 'completed'"
    assert report.get("hiring_readiness_score") is not None, "Report should have a hiring readiness score"
    
    print("[TEST] All fast report assertions passed successfully!")

if __name__ == "__main__":
    test_fast_report()
