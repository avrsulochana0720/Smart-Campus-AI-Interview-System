"""
eval_agent.py — Qwen scores every answer 0-10 deeply
Evaluates each interview answer using Ollama (Qwen) with resume-aware,
role-specific scoring and detailed feedback.
Enhanced with RAG-based expected answer comparison and bulk evaluation.
"""
import os
import re
import json
import time
from typing import Dict, List, Optional
from dotenv import load_dotenv
from metrics import record_metric

try:
    from gemini_helper import request_gemini
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from gemini_helper import request_gemini

load_dotenv()


class EvalAgent:
    def __init__(self):
        self.model = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")

    def evaluate_answer(
        self,
        question: str,
        user_answer: str,
        job_role: str,
        company: str,
        resume_summary: str = "",
        expected_answer: str = None,
        question_type: str = "technical"
    ) -> Dict:
        """
        Score an answer 0-10 with deep, honest feedback.
        Includes factor-based scoring for Technical or HR questions.
        """
        resume_ctx = resume_summary[:500] if resume_summary else "No resume context."

        # Build expected answer section for the prompt
        expected_section = ""
        if expected_answer:
            expected_preview = expected_answer[:800] if len(expected_answer) > 800 else expected_answer
            expected_section = f"""
EXPECTED/REFERENCE ANSWER (from knowledge base):
{expected_preview}

Compare the candidate's answer with the expected answer above. Consider:
- Does the candidate cover the same key points?
- Are there important concepts missing from the candidate's answer?
- Does the candidate add valuable insights beyond the reference?
"""

        if question_type == "technical":
            prompt = f"""/no_think
You are an expert technical interviewer at {company}. Evaluate the candidate's response for a {job_role} position.

QUESTION: {question}
CANDIDATE'S ANSWER: {user_answer}
{expected_section}

EVALUATION RUBRIC (Score each factor 0-10, and matching_score 0-100%):
1. ACCURACY: Does the candidate use correct terminology and provide an accurate solution? (0-10)
2. CONCEPT UNDERSTANDING: Do they explain the 'why' and 'how', showing deep conceptual depth? (0-10)
3. PROBLEM SOLVING: Do they demonstrate structured logic and systematic problem-solving? (0-10)
4. COMMUNICATION CLARITY: Is their technical explanation clear, articulate, and well-structured? (0-10)
5. CODE QUALITY: Do they demonstrate code optimization thinking, clean structure, or best practices? (0-10)
6. SEMANTIC MATCH: How closely does this align with the EXPECTED ANSWER (if provided)? (0-100%)

INSTRUCTIONS:
- Be strict. If the answer is vague or generic, score low.
- If an EXPECTED ANSWER is provided, the 'matching_score' must reflect semantic similarity. 0% if irrelevant, 100% if functionally identical.
- Provide 2-3 sentences of HONEST feedback.

Return ONLY a valid JSON object:
{{
  "accuracy": (integer 0-10),
  "concept_understanding": (integer 0-10),
  "problem_solving": (integer 0-10),
  "communication_clarity": (integer 0-10),
  "code_quality": (integer 0-10),
  "matching_score": (integer 0-100, 0 if no expected answer),
  "feedback": "Specific strengths or weaknesses mentioned in the answer.",
  "next_question": "A logical follow-up question."
}}"""
        else:
            prompt = f"""/no_think
You are an expert HR interviewer at {company}. Evaluate the candidate's response for a {job_role} position.

QUESTION: {question}
CANDIDATE'S ANSWER: {user_answer}
{expected_section}

EVALUATION RUBRIC (Score each factor 0-10, and matching_score 0-100%):
1. COMMUNICATION SKILLS: Are they fluent, clear, and articulate? (0-10)
2. CONFIDENCE: Do they speak with confidence, positive tone, and conviction? (0-10)
3. PROFESSIONALISM: Do they show workplace appropriate behavior, attitude, and maturity? (0-10)
4. ADAPTABILITY: Do they show learning agility, flexibility, and openness to growth? (0-10)
5. TEAM COLLABORATION: Do they emphasize collaboration, teamwork, and supporting others? (0-10)
6. SEMANTIC MATCH: How closely does this align with the EXPECTED ANSWER (if provided)? (0-100%)

INSTRUCTIONS:
- Be strict. If the answer is vague, generic, or uses too many filler words, score low.
- Provide 2-3 sentences of HONEST feedback.

Return ONLY a valid JSON object:
{{
  "communication_skills": (integer 0-10),
  "confidence": (integer 0-10),
  "professionalism": (integer 0-10),
  "adaptability": (integer 0-10),
  "team_collaboration": (integer 0-10),
  "matching_score": (integer 0-100, 0 if no expected answer),
  "feedback": "Specific strengths or weaknesses mentioned in the answer.",
  "next_question": "A logical follow-up question."
}}"""

        try:
            start_time = time.time()
            content = request_gemini(prompt)
            duration = time.time() - start_time
            record_metric("evaluate_answer", duration)
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            result = json.loads(content)

            # Extract scores and calculate overall score based on the rubric weights
            if question_type == "technical":
                accuracy = max(0, min(10, int(result.get("accuracy", 5))))
                concept = max(0, min(10, int(result.get("concept_understanding", concept_understanding_score if 'concept_understanding_score' in locals() else 5)))) if "concept_understanding" not in result else max(0, min(10, int(result.get("concept_understanding", 5))))
                problem = max(0, min(10, int(result.get("problem_solving", 5))))
                comm = max(0, min(10, int(result.get("communication_clarity", 5))))
                code = max(0, min(10, int(result.get("code_quality", 5))))
                
                # Calculate weighted overall score (0-10 scale)
                overall = accuracy * 0.30 + concept * 0.25 + problem * 0.20 + comm * 0.15 + code * 0.10
                overall_score = max(0, min(10, int(round(overall))))
                
                return {
                    "score": overall_score,
                    "feedback": result.get("feedback", "Answer recorded."),
                    "next_question": result.get("next_question", ""),
                    "matching_score": max(0, min(100, int(result.get("matching_score", 0)))),
                    "accuracy": accuracy,
                    "concept_understanding": concept,
                    "problem_solving": problem,
                    "communication_clarity": comm,
                    "code_quality": code
                }
            else:
                comm_skills = max(0, min(10, int(result.get("communication_skills", 5))))
                confidence = max(0, min(10, int(result.get("confidence", 5))))
                prof = max(0, min(10, int(result.get("professionalism", 5))))
                adapt = max(0, min(10, int(result.get("adaptability", 5))))
                team = max(0, min(10, int(result.get("team_collaboration", 5))))
                
                # Calculate weighted overall score (0-10 scale)
                overall = comm_skills * 0.30 + confidence * 0.20 + prof * 0.20 + adapt * 0.15 + team * 0.15
                overall_score = max(0, min(10, int(round(overall))))
                
                return {
                    "score": overall_score,
                    "feedback": result.get("feedback", "Answer recorded."),
                    "next_question": result.get("next_question", ""),
                    "matching_score": max(0, min(100, int(result.get("matching_score", 0)))),
                    "communication_skills": comm_skills,
                    "confidence": confidence,
                    "professionalism": prof,
                    "adaptability": adapt,
                    "team_collaboration": team
                }
        except Exception as e:
            print(f"[EvalAgent] Qwen evaluation error: {e}")
            return self._fallback_evaluation(question, user_answer, job_role, company, question_type)

    def _fallback_evaluation(self, question, user_answer, job_role, company, question_type: str = "technical") -> Dict:
        """Rule-based fallback when Qwen is unavailable."""
        word_count = len(user_answer.split())
        if word_count < 10:
            score = 2
            feedback = "Your answer is too brief. Please provide more detail and specific examples."
        elif word_count < 30:
            score = 4
            feedback = "Your answer touches on the topic but lacks depth. Try to include concrete examples."
        elif word_count < 60:
            score = 6
            feedback = "Decent answer with reasonable coverage. Adding more technical depth would strengthen it."
        else:
            score = 7
            feedback = "Good answer with adequate detail. Consider structuring your response more clearly."

        if question_type == "technical":
            return {
                "score": score,
                "feedback": feedback,
                "next_question": f"Based on your experience, how would you handle a complex challenge in {job_role}?",
                "matching_score": 0,
                "accuracy": score,
                "concept_understanding": score,
                "problem_solving": score,
                "communication_clarity": score,
                "code_quality": score
            }
        else:
            return {
                "score": score,
                "feedback": feedback,
                "next_question": f"Based on your experience, how would you handle a complex challenge in {job_role}?",
                "matching_score": 0,
                "communication_skills": score,
                "confidence": score,
                "professionalism": score,
                "adaptability": score,
                "team_collaboration": score
            }

    def evaluate_with_rag(
        self,
        questions_answers: List[Dict],
        job_role: str,
        company: str,
        resume_text: str = ""
    ) -> Dict:
        """
        Evaluate all answers at once with RAG context for comprehensive report.
        Returns detailed per-question evaluation and aggregate scores.

        Each item in questions_answers should have:
        - question, answer, question_type, expected_answer (optional)
        """
        results = []
        total_score = 0
        tech_scores = []
        hr_scores = []
        matching_scores = []
        strengths = []
        weaknesses = []
        missing_concepts = []

        for qa in questions_answers:
            if qa.get("answer") == "Not answered":
                results.append({
                    "question": qa["question"],
                    "answer": "Not answered",
                    "score": 0,
                    "feedback": "Question was not answered.",
                    "matching_score": 0,
                    "question_type": qa.get("question_type", "general"),
                    "expected_answer": qa.get("expected_answer", "")
                })
                missing_concepts.append(f"Unanswered: {qa['question'][:50]}")
                continue

            eval_result = self.evaluate_answer(
                question=qa["question"],
                user_answer=qa["answer"],
                job_role=job_role,
                company=company,
                resume_summary=resume_text[:300],
                expected_answer=qa.get("expected_answer"),
                question_type=qa.get("question_type", "technical")
            )

            score = eval_result["score"]
            matching = eval_result.get("matching_score", 0)

            results.append({
                "question": qa["question"],
                "answer": qa["answer"],
                "score": score,
                "feedback": eval_result["feedback"],
                "matching_score": matching,
                "question_type": qa.get("question_type", "general"),
                "expected_answer": qa.get("expected_answer", "")
            })

            total_score += score

            if qa.get("question_type") == "technical":
                tech_scores.append(score)
            elif qa.get("question_type") == "hr":
                hr_scores.append(score)

            if matching > 0:
                matching_scores.append(matching)

            # Collect strengths/weaknesses
            if score >= 7:
                strengths.append(qa["question"][:60])
            elif score <= 4:
                weaknesses.append(qa["question"][:60])
                if qa.get("expected_answer") and matching < 50:
                    missing_concepts.append(f"Low match on: {qa['question'][:40]}")

        answered = [r for r in results if r["answer"] != "Not answered"]
        avg_score = total_score / len(answered) if answered else 0
        avg_tech = sum(tech_scores) / len(tech_scores) if tech_scores else 0
        avg_hr = sum(hr_scores) / len(hr_scores) if hr_scores else 0
        avg_matching = sum(matching_scores) / len(matching_scores) if matching_scores else 0

        # Confidence analysis: based on answer lengths and consistency
        confidence = self._analyze_confidence(answered)

        return {
            "per_question": results,
            "average_score": round(avg_score, 1),
            "technical_score": round(avg_tech, 1),
            "hr_score": round(avg_hr, 1),
            "matching_score": round(avg_matching, 1),
            "confidence_score": round(confidence, 1),
            "total_answered": len(answered),
            "total_questions": len(questions_answers),
            "strengths": strengths[:5],
            "weaknesses": weaknesses[:5],
            "missing_concepts": missing_concepts[:5]
        }

    def _analyze_confidence(self, answered_results: List[Dict]) -> float:
        """
        Analyze candidate confidence based on answer patterns.
        Returns a score from 0-10.
        """
        if not answered_results:
            return 0.0

        scores = [r["score"] for r in answered_results]
        avg = sum(scores) / len(scores) if scores else 0

        # Check consistency (low variance = more confident)
        if len(scores) > 1:
            mean = sum(scores) / len(scores)
            variance = sum((s - mean) ** 2 for s in scores) / len(scores)
            consistency_bonus = max(0, 2 - variance * 0.5)
        else:
            consistency_bonus = 1

        # Check answer lengths (longer = more confident generally)
        answer_lengths = [len(r.get("answer", "").split()) for r in answered_results]
        avg_length = sum(answer_lengths) / len(answer_lengths) if answer_lengths else 0
        length_bonus = min(2, avg_length / 30)

        confidence = min(10, avg * 0.7 + consistency_bonus + length_bonus)
        return confidence

    def generate_narrative_summary(self, job_role, company, qa_data) -> str:
        """Generate a narrative summary of the interview for the report endpoint."""
        qa_summary = ""
        for i, qa in enumerate(qa_data):
            qa_summary += f"Q{i+1}: {qa['question']}\nA: {qa['answer']}\nScore: {qa['score']}/10\n\n"

        prompt = f"""/no_think
Based on the following interview transcript for the {job_role} position at {company},
write a concise narrative summary (2-3 paragraphs) of the candidate's performance,
strengths, and areas for improvement.

Interview Data:
{qa_summary}

Summary:"""

        try:
            text = request_gemini(prompt)
            # Remove thinking tags if present
            text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
            return text
        except Exception as e:
            print(f"[EvalAgent] Narrative summary error: {e}")
            return "Narrative summary unavailable."

    # ──────────────────────────────────────────────────────
    # NEW: Factor-Based Evaluation Methods
    # ──────────────────────────────────────────────────────

    def evaluate_with_factors(
        self,
        questions_answers: List[Dict],
        job_role: str,
        company: str,
        resume_text: str = ""
    ) -> Dict:
        """
        Comprehensive evaluation with factor-based scoring.
        Returns technical factors, HR factors, and final score.
        
        Replaces evaluate_with_rag for factor-based reporting.
        """
        from evaluation_scoring import evaluation_scoring
        
        tech_results = []
        hr_results = []
        all_factor_scores = {
            "accuracy": [],
            "concept_understanding": [],
            "problem_solving": [],
            "communication_clarity": [],
            "code_quality": [],
            "communication_skills": [],
            "confidence": [],
            "professionalism": [],
            "adaptability": [],
            "team_collaboration": []
        }
        
        print(f"[EvalAgent] Evaluating {len(questions_answers)} Q&A pairs with factor-based scoring")
        
        for qa in questions_answers:
            question_text = qa.get("question", "")
            answer_text = qa.get("answer", "")
            question_type = qa.get("question_type", "technical")
            reference_answer = qa.get("expected_answer", "")
            
            if answer_text == "Not answered":
                continue
            
            try:
                if question_type == "technical":
                    # Evaluate technical answer
                    eval_result = evaluation_scoring.evaluate_technical_answer(
                        question=question_text,
                        candidate_answer=answer_text,
                        reference_answer=reference_answer,
                        job_role=job_role,
                        company=company,
                        question_topic=qa.get("category", "")
                    )
                    
                    tech_results.append({
                        "question": question_text,
                        "answer": answer_text,
                        "factors": {
                            "accuracy": eval_result["accuracy"],
                            "concept_understanding": eval_result["concept_understanding"],
                            "problem_solving": eval_result["problem_solving"],
                            "communication_clarity": eval_result["communication_clarity"],
                            "code_quality": eval_result["code_quality"]
                        },
                        "overall_score": eval_result["overall_technical_score"],
                        "strengths": eval_result["key_strengths"],
                        "weaknesses": eval_result["key_weaknesses"]
                    })
                    
                    # Accumulate factor scores
                    all_factor_scores["accuracy"].append(eval_result["accuracy"])
                    all_factor_scores["concept_understanding"].append(eval_result["concept_understanding"])
                    all_factor_scores["problem_solving"].append(eval_result["problem_solving"])
                    all_factor_scores["communication_clarity"].append(eval_result["communication_clarity"])
                    all_factor_scores["code_quality"].append(eval_result["code_quality"])
                    
                else:
                    # Evaluate HR answer
                    eval_result = evaluation_scoring.evaluate_hr_answer(
                        question=question_text,
                        candidate_answer=answer_text,
                        job_role=job_role,
                        company=company
                    )
                    
                    hr_results.append({
                        "question": question_text,
                        "answer": answer_text,
                        "factors": {
                            "communication_skills": eval_result["communication_skills"],
                            "confidence": eval_result["confidence"],
                            "professionalism": eval_result["professionalism"],
                            "adaptability": eval_result["adaptability"],
                            "team_collaboration": eval_result["team_collaboration"]
                        },
                        "overall_score": eval_result["overall_hr_score"],
                        "strengths": eval_result["key_strengths"],
                        "weaknesses": eval_result["key_weaknesses"]
                    })
                    
                    # Accumulate factor scores
                    all_factor_scores["communication_skills"].append(eval_result["communication_skills"])
                    all_factor_scores["confidence"].append(eval_result["confidence"])
                    all_factor_scores["professionalism"].append(eval_result["professionalism"])
                    all_factor_scores["adaptability"].append(eval_result["adaptability"])
                    all_factor_scores["team_collaboration"].append(eval_result["team_collaboration"])
                    
            except Exception as e:
                print(f"[EvalAgent] Factor evaluation error for Q: {question_text[:50]}: {e}")
                continue
        
        # Calculate average factor scores
        avg_factors = {}
        for factor, scores in all_factor_scores.items():
            if scores:
                avg_factors[factor] = sum(scores) / len(scores)
        
        # Calculate technical score (0-100)
        tech_factor_scores = {
            "accuracy": avg_factors.get("accuracy", 5) * 10,
            "concept_understanding": avg_factors.get("concept_understanding", 5) * 10,
            "problem_solving": avg_factors.get("problem_solving", 5) * 10,
            "communication_clarity": avg_factors.get("communication_clarity", 5) * 10,
            "code_quality": avg_factors.get("code_quality", 5) * 10
        }
        
        tech_score = (
            tech_factor_scores["accuracy"] * 0.30 +
            tech_factor_scores["concept_understanding"] * 0.25 +
            tech_factor_scores["problem_solving"] * 0.20 +
            tech_factor_scores["communication_clarity"] * 0.15 +
            tech_factor_scores["code_quality"] * 0.10
        )
        
        # Calculate HR score (0-100)
        hr_factor_scores = {
            "communication_skills": avg_factors.get("communication_skills", 5) * 10,
            "confidence": avg_factors.get("confidence", 5) * 10,
            "professionalism": avg_factors.get("professionalism", 5) * 10,
            "adaptability": avg_factors.get("adaptability", 5) * 10,
            "team_collaboration": avg_factors.get("team_collaboration", 5) * 10
        }
        
        hr_score = (
            hr_factor_scores["communication_skills"] * 0.30 +
            hr_factor_scores["confidence"] * 0.20 +
            hr_factor_scores["professionalism"] * 0.20 +
            hr_factor_scores["adaptability"] * 0.15 +
            hr_factor_scores["team_collaboration"] * 0.15
        )
        
        # Calculate final score
        final_score_result = evaluation_scoring.calculate_final_score(tech_score, hr_score)
        
        # Collect all strengths and weaknesses
        all_strengths = set()
        all_weaknesses = set()
        for result in tech_results + hr_results:
            all_strengths.update(result.get("strengths", []))
            all_weaknesses.update(result.get("weaknesses", []))
        
        return {
            "technical_evaluation": {
                "accuracy": round(tech_factor_scores["accuracy"], 2),
                "concept_understanding": round(tech_factor_scores["concept_understanding"], 2),
                "problem_solving": round(tech_factor_scores["problem_solving"], 2),
                "communication_clarity": round(tech_factor_scores["communication_clarity"], 2),
                "code_quality": round(tech_factor_scores["code_quality"], 2),
                "overall_technical_score": round(tech_score, 2)
            },
            "hr_evaluation": {
                "communication_skills": round(hr_factor_scores["communication_skills"], 2),
                "confidence": round(hr_factor_scores["confidence"], 2),
                "professionalism": round(hr_factor_scores["professionalism"], 2),
                "adaptability": round(hr_factor_scores["adaptability"], 2),
                "team_collaboration": round(hr_factor_scores["team_collaboration"], 2),
                "overall_hr_score": round(hr_score, 2)
            },
            "final_score": round(final_score_result["final_interview_score"], 2),
            "performance_level": final_score_result["performance_level"],
            "score_breakdown": final_score_result["score_breakdown"],
            "strengths": list(all_strengths)[:5],
            "weaknesses": list(all_weaknesses)[:5],
            "detailed_results": {
                "technical_answers": tech_results,
                "hr_answers": hr_results
            }
        }


# Singleton
eval_agent = EvalAgent()
