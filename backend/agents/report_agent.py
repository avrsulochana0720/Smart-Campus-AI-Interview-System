"""
report_agent.py — Qwen generates final honest report
Uses Qwen (Ollama) to generate comprehensive, honest interview reports.
Enhanced with RAG-based expected answer matching and detailed scoring:
- Answer matching score
- Technical knowledge score
- HR communication score
- Confidence analysis
- Strengths / Weaknesses
- Missing concepts
- Improvement suggestions
- Overall interview rating
"""
import os
import re
import json
import time
from typing import Dict, List
from datetime import datetime
from dotenv import load_dotenv
from metrics import record_metric

try:
    from gemini_helper import request_gemini
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from gemini_helper import request_gemini

load_dotenv()

# Gemini config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Ollama fallback
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")


class ReportAgent:
    def __init__(self):
        self.gemini_key = GEMINI_API_KEY
        self.gemini_model = GEMINI_MODEL
        self.ollama_model = OLLAMA_MODEL

    def generate_report(
        self,
        job_role: str,
        company: str,
        qa_data: List[Dict],
        resume_text: str = "",
        proctoring_summary: Dict = None,
        rag_evaluation: Dict = None
    ) -> Dict:
        """
        Generate a comprehensive interview performance report.
        Uses Qwen (Ollama) to generate reports.
        Includes RAG-based evaluation data for enhanced reporting.
        
        Required fields in the report:
        - answer matching score
        - technical knowledge score
        - HR communication score
        - confidence analysis
        - strengths
        - weaknesses
        - missing concepts
        - improvement suggestions
        - overall interview rating
        """
        if not qa_data:
            return {
                "narrative_summary": "No interview data available to generate report.",
                "average_score": 0,
                "total_questions": 0,
                "answered_questions": 0,
                "strengths": "",
                "weaknesses": "",
                "recommendation": "",
                "technical_score": 0,
                "hr_score": 0,
                "confidence_score": 0,
                "missing_concepts": "",
                "improvement_suggestions": "",
                "rag_matching_data": "",
                "status": "failed"
            }

        # Calculate metrics
        total_questions = len(qa_data)
        answered = [qa for qa in qa_data if qa.get("answer") and qa["answer"] != "Not answered"]
        answered_questions = len(answered)
        avg_score = sum(qa.get("score", 0) for qa in qa_data) / total_questions if total_questions > 0 else 0

        # Extract RAG evaluation scores if available
        tech_score = 0
        hr_score = 0
        matching_score = 0
        confidence_from_eval = 0
        eval_strengths = []
        eval_weaknesses = []
        eval_missing = []

        if rag_evaluation:
            tech_score = rag_evaluation.get("technical_score", 0)
            hr_score = rag_evaluation.get("hr_score", 0)
            matching_score = rag_evaluation.get("matching_score", 0)
            confidence_from_eval = rag_evaluation.get("confidence_score", 0)
            eval_strengths = rag_evaluation.get("strengths", [])
            eval_weaknesses = rag_evaluation.get("weaknesses", [])
            eval_missing = rag_evaluation.get("missing_concepts", [])

        # Build QA transcript with expected answers
        qa_transcript = ""
        for i, qa in enumerate(qa_data):
            qa_transcript += f"Q{i+1} ({qa.get('question_type', 'general')}): {qa['question']}\n"
            qa_transcript += f"Answer: {qa.get('answer', 'Not answered')}\n"
            qa_transcript += f"Score: {qa.get('score', 0)}/10\n"
            if qa.get("feedback"):
                qa_transcript += f"Feedback: {qa['feedback']}\n"
            if qa.get("expected_answer"):
                exp_preview = qa['expected_answer'][:100]
                qa_transcript += f"Expected Answer (from knowledge base): {exp_preview}...\n"
            if qa.get("matching_score"):
                qa_transcript += f"Knowledge Base Match: {qa['matching_score']}%\n"
            qa_transcript += "\n"

        resume_context = resume_text[:800] if resume_text else "No resume provided."

        # Proctoring context
        proctor_ctx = ""
        if proctoring_summary and proctoring_summary.get("total_violations", 0) > 0:
            proctor_ctx = f"""
PROCTORING DATA:
- Total Violations: {proctoring_summary['total_violations']}
- Risk Score: {proctoring_summary.get('risk_score', 0)}
- Risk Level: {proctoring_summary.get('risk_level', 'clean')}
- Critical Events: {proctoring_summary.get('critical_events', 0)}
"""

        # RAG matching summary
        rag_ctx = ""
        if rag_evaluation:
            rag_ctx = f"""
RAG KNOWLEDGE BASE MATCHING:
- Technical Knowledge Score: {tech_score}/10
- HR Communication Score: {hr_score}/10
- Answer-to-Expected Match: {matching_score}%
- Confidence Score: {confidence_from_eval}/10
- Total Questions with PDF Matches: {rag_evaluation.get('total_answered', 0)}
- Key Strengths from evaluation: {', '.join(eval_strengths[:3]) if eval_strengths else 'N/A'}
- Key Weaknesses from evaluation: {', '.join(eval_weaknesses[:3]) if eval_weaknesses else 'N/A'}
- Missing Concepts: {', '.join(eval_missing[:3]) if eval_missing else 'N/A'}
"""

        prompt = f"""You are a senior hiring manager writing an honest, professional interview performance report.

INTERVIEW DETAILS:
Position: {job_role}
Company: {company}
Total Questions: {total_questions}
Questions Answered: {answered_questions}
Average Score: {avg_score:.1f}/10
{rag_ctx}
CANDIDATE RESUME:
{resume_context}
{proctor_ctx}
INTERVIEW TRANSCRIPT:
{qa_transcript}

Generate an HONEST and PROFESSIONAL report. Do NOT sugarcoat poor performance.

Include these sections:
1. OVERALL ASSESSMENT (2-3 sentences summarizing performance)
2. ANSWER MATCHING SCORE (how well answers matched expected knowledge base answers, percentage)
3. TECHNICAL KNOWLEDGE SCORE (assessment of technical competency out of 10)
4. HR COMMUNICATION SCORE (assessment of soft skills and communication out of 10)
5. CONFIDENCE ANALYSIS (how confidently the candidate answered, scored out of 10)
6. STRENGTHS (2-3 specific strengths with evidence from answers)
7. WEAKNESSES (2-3 specific weaknesses with evidence)
8. MISSING CONCEPTS (key concepts the candidate failed to mention)
9. IMPROVEMENT SUGGESTIONS (actionable advice for the candidate)
10. OVERALL INTERVIEW RATING (out of 10 with clear recommendation)

Return ONLY a valid JSON object:
{{
    "narrative_summary": "Full report text with all sections above formatted professionally",
    "strengths": "Comma-separated key strengths",
    "weaknesses": "Comma-separated key weaknesses",
    "recommendation": "Hire / Conditional Hire / Not Recommended — with reasoning",
    "confidence_score": (float 0-10),
    "missing_concepts": "Comma-separated missing concepts",
    "improvement_suggestions": "Comma-separated improvement suggestions"
}}"""

        # Route to high-speed cloud Gemini API instead of slow local Ollama
        start_time = time.time()
        report_text = request_gemini(prompt)
        duration = time.time() - start_time
        record_metric("generate_report", duration)

        if report_text:
            try:
                # Try to parse as JSON
                cleaned = re.sub(r'```json\n?', '', report_text)
                cleaned = re.sub(r'```\n?', '', cleaned)
                # Remove thinking tags if present
                cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL)
                json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
                if json_match:
                    cleaned = json_match.group(0)
                parsed = json.loads(cleaned)

                return {
                    "narrative_summary": parsed.get("narrative_summary", report_text),
                    "average_score": int(avg_score),
                    "total_questions": total_questions,
                    "answered_questions": answered_questions,
                    "strengths": parsed.get("strengths", ", ".join(eval_strengths) if eval_strengths else ""),
                    "weaknesses": parsed.get("weaknesses", ", ".join(eval_weaknesses) if eval_weaknesses else ""),
                    "recommendation": parsed.get("recommendation", ""),
                    "technical_score": tech_score or round(avg_score, 1),
                    "hr_score": hr_score or round(avg_score, 1),
                    "confidence_score": parsed.get("confidence_score", confidence_from_eval or 0),
                    "missing_concepts": parsed.get("missing_concepts", ", ".join(eval_missing) if eval_missing else ""),
                    "improvement_suggestions": parsed.get("improvement_suggestions", ""),
                    "rag_matching_data": json.dumps({
                        "matching_score": matching_score,
                        "per_question": rag_evaluation.get("per_question", []) if rag_evaluation else []
                    }),
                    "status": "completed"
                }
            except json.JSONDecodeError:
                # If JSON parsing fails, use raw text as narrative
                return {
                    "narrative_summary": report_text,
                    "average_score": int(avg_score),
                    "total_questions": total_questions,
                    "answered_questions": answered_questions,
                    "strengths": ", ".join(eval_strengths) if eval_strengths else "",
                    "weaknesses": ", ".join(eval_weaknesses) if eval_weaknesses else "",
                    "recommendation": "",
                    "technical_score": tech_score,
                    "hr_score": hr_score,
                    "confidence_score": confidence_from_eval,
                    "missing_concepts": ", ".join(eval_missing) if eval_missing else "",
                    "improvement_suggestions": "",
                    "rag_matching_data": "",
                    "status": "completed"
                }

        # Complete fallback — no AI available
        return self._rule_based_report_full(
            job_role, company, qa_data, avg_score,
            total_questions, answered_questions,
            tech_score, hr_score, confidence_from_eval,
            matching_score, eval_strengths, eval_weaknesses, eval_missing
        )

    # ── Gemini Call ───────────────────────────────────
    def _call_ollama(self, prompt: str) -> str:
        """Call Gemini."""
        try:
            full_prompt = f"/no_think\n{prompt}"
            text = request_gemini(full_prompt)
            text = text.strip()
            # Remove thinking tags if present
            text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
            return text
        except Exception as e:
            print(f"[ReportAgent] Gemini error: {e}")
            return None

    # ── Rule-based Fallback ───────────────────────────
    def _rule_based_report_full(
        self, job_role, company, qa_data, avg_score,
        total_questions, answered_questions,
        tech_score, hr_score, confidence_score,
        matching_score, strengths_list, weaknesses_list, missing_list
    ) -> Dict:
        """Generate a comprehensive rule-based report when all AI services are unavailable."""
        answered = [qa for qa in qa_data if qa.get("answer") and qa["answer"] != "Not answered"]

        if avg_score >= 8:
            overall = f"The candidate demonstrated excellent performance in the {job_role} interview at {company}, with strong answers across both technical and HR rounds."
            rec = "Strongly recommended for hire."
        elif avg_score >= 6:
            overall = f"The candidate showed good potential for the {job_role} position at {company}, with solid performance in most areas."
            rec = "Recommended for hire with mentoring."
        elif avg_score >= 4:
            overall = f"The candidate showed mixed performance for the {job_role} role at {company}. Some areas were acceptable while others need improvement."
            rec = "Conditional hire — consider for junior position or probation period."
        else:
            overall = f"The candidate's performance in the {job_role} interview at {company} was below expectations."
            rec = "Not recommended for the current position."

        report = f"""OVERALL ASSESSMENT:
{overall}

SCORES:
- Average Score: {avg_score:.1f}/10
- Technical Knowledge: {tech_score}/10
- HR Communication: {hr_score}/10
- Confidence Score: {confidence_score}/10
- Answer Matching: {matching_score}%
- Questions Answered: {answered_questions}/{total_questions}

STRENGTHS:
{chr(10).join('- ' + s for s in strengths_list[:3]) if strengths_list else '- Assessment requires AI evaluation'}

WEAKNESSES:
{chr(10).join('- ' + w for w in weaknesses_list[:3]) if weaknesses_list else '- Assessment requires AI evaluation'}

MISSING CONCEPTS:
{chr(10).join('- ' + m for m in missing_list[:3]) if missing_list else '- No specific gaps identified'}

QUESTION-BY-QUESTION BREAKDOWN:
"""
        for i, qa in enumerate(qa_data):
            report += f"\n{i+1}. ({qa.get('question_type', 'general')}) {qa['question']}\n"
            report += f"   Score: {qa.get('score', 0)}/10\n"
            if qa.get("feedback"):
                report += f"   Feedback: {qa['feedback']}\n"
            if qa.get("expected_answer"):
                report += f"   Expected: {qa['expected_answer'][:100]}...\n"

        report += f"\nRECOMMENDATION:\n{rec}"

        return {
            "narrative_summary": report,
            "average_score": int(avg_score),
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "strengths": ", ".join(strengths_list[:3]) if strengths_list else "",
            "weaknesses": ", ".join(weaknesses_list[:3]) if weaknesses_list else "",
            "recommendation": rec,
            "technical_score": tech_score,
            "hr_score": hr_score,
            "confidence_score": confidence_score,
            "missing_concepts": ", ".join(missing_list[:3]) if missing_list else "",
            "improvement_suggestions": "Practice more interview scenarios, review core concepts, prepare structured answers",
            "rag_matching_data": json.dumps({"matching_score": matching_score}),
            "status": "completed"
        }


# Singleton
report_agent = ReportAgent()
