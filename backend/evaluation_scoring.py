"""
evaluation_scoring.py — Optimized Candidate Evaluation Scoring System
Implements factor-based technical and HR evaluation with Qwen/SLM model.

Technical Factors (70% of final score):
1. Accuracy (30%) - Correctness and alignment with reference
2. Concept Understanding (25%) - Depth and explanation quality
3. Problem Solving (20%) - Logical reasoning and approach
4. Communication Clarity (15%) - Clear technical explanation
5. Code Quality (10%) - Implementation and optimization thinking

HR Factors (30% of final score):
1. Communication Skills (30%) - Fluency and clarity
2. Confidence (20%) - Confidence level in delivery
3. Professionalism (20%) - Attitude and workplace behavior
4. Adaptability (15%) - Learning ability and flexibility
5. Team Collaboration (15%) - Teamwork and cooperation
"""
import json
import re
import os
import sys
from typing import Dict, List, Optional
from datetime import datetime

try:
    from ollama_helper import request_ollama
except ImportError:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from ollama_helper import request_ollama


class EvaluationScoring:
    """
    Implements optimized factor-based evaluation scoring.
    Each factor is scored 0-10, then converted to 0-100 scale.
    """
    
    # Factor weights for technical score
    TECHNICAL_WEIGHTS = {
        "accuracy": 0.30,
        "concept_understanding": 0.25,
        "problem_solving": 0.20,
        "communication_clarity": 0.15,
        "code_quality": 0.10
    }
    
    # Factor weights for HR score
    HR_WEIGHTS = {
        "communication_skills": 0.30,
        "confidence": 0.20,
        "professionalism": 0.20,
        "adaptability": 0.15,
        "team_collaboration": 0.15
    }
    
    # Final score weights
    FINAL_SCORE_WEIGHTS = {
        "technical": 0.70,
        "hr": 0.30
    }
    
    def evaluate_technical_answer(
        self,
        question: str,
        candidate_answer: str,
        reference_answer: str,
        job_role: str = "",
        company: str = "",
        question_topic: str = ""
    ) -> Dict:
        """
        Evaluate a technical answer and return factor scores.
        """
        # Check if the answer is empty or not answered
        clean_ans = candidate_answer.strip().lower() if candidate_answer else ""
        if not clean_ans or clean_ans in ["no answer provided", "not answered", "no response provided", "not answered."]:
            print(f"[EvaluationScoring] Blank or No answer provided. Returning 0 score.")
            factor_scores = {
                "accuracy": 0,
                "concept_understanding": 0,
                "problem_solving": 0,
                "communication_clarity": 0,
                "code_quality": 0
            }
            factor_scores_100 = {k: 0.0 for k in factor_scores}
            return {
                "accuracy": 0.0,
                "concept_understanding": 0.0,
                "problem_solving": 0.0,
                "communication_clarity": 0.0,
                "code_quality": 0.0,
                "overall_technical_score": 0.0,
                "factor_scores_100": factor_scores_100,
                "key_strengths": [],
                "key_weaknesses": ["No response provided."],
                "improvement_suggestions": ["Please provide a detailed answer next time."],
                "detailed_feedback": "Question was not answered."
            }

        prompt = f"""/no_think
You are an expert technical interviewer evaluating a candidate's answer for a {job_role} role at {company}.
Question: {question}

EXPECTED ANSWER (Sourced from RAG PDF Knowledge Base):
{reference_answer}

Candidate's Answer: {candidate_answer}

Compare the Candidate's Answer to the RAG Expected Answer. Evaluate and return a strict JSON object with the following schema:
{{
    "technical_accuracy": <int 0-10>,
    "depth_of_knowledge": <int 0-10>,
    "problem_solving": <int 0-10>,
    "communication": <int 0-10>,
    "code_quality": <int 0-10>,
    "relevance": <int 0-10>,
    "feedback": "<detailed constructive feedback comparing to the RAG context>",
    "question_score": <int 0-10>
}}
Ensure the output is ONLY valid JSON.
"""
        factor_scores = {}
        strengths = []
        weaknesses = []
        suggestions = []
        feedback_text = ""
        overall_score = 0
        
        try:
            raw_response = request_ollama(prompt)
            content = re.sub(r'```json\n?', '', raw_response)
            content = re.sub(r'```\n?', '', content)
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            result = json.loads(content)
            
            factor_scores = {
                "accuracy": max(0, min(10, int(result.get("technical_accuracy", 5)))),
                "concept_understanding": max(0, min(10, int(result.get("depth_of_knowledge", 5)))),
                "problem_solving": max(0, min(10, int(result.get("problem_solving", 5)))),
                "communication_clarity": max(0, min(10, int(result.get("communication", 5)))),
                "code_quality": max(0, min(10, int(result.get("code_quality", 5))))
            }
            feedback_text = result.get("feedback", "")
            overall_score = max(0, min(100, int(result.get("question_score", 5)) * 10))

        except Exception as e:
            print(f"[EvaluationScoring] Qwen fallback in evaluate_technical_answer: {e}")
            factor_scores = {
                "accuracy": self._score_accuracy(candidate_answer, reference_answer, question),
                "concept_understanding": self._score_concept_understanding(candidate_answer, reference_answer, question_topic),
                "problem_solving": self._score_problem_solving(candidate_answer),
                "communication_clarity": self._score_communication_clarity(candidate_answer),
                "code_quality": self._score_code_quality(candidate_answer, question_topic)
            }
            # Ensure unique scores among the factors by adjusting duplicate values
            used_scores = set()
            for k in sorted(factor_scores.keys()):
                val = factor_scores[k]
                orig_val = val
                direction = 1 if val < 8 else -1
                while val in used_scores:
                    val += direction
                    if val > 10 or val < 1:
                        direction = -direction
                        val = orig_val + direction
                factor_scores[k] = val
                used_scores.add(val)
            
            # Calculate weighted overall technical score
            overall = sum(
                factor_scores[factor] * self.TECHNICAL_WEIGHTS[factor]
                for factor in factor_scores
            ) * 10  # Convert to 0-100
            overall_score = round(overall, 2)
        
        # Convert to 0-100 scale
        factor_scores_100 = {k: v * 10 for k, v in factor_scores.items()}
        
        # Generate insights (use heuristic if LLM feedback is too short)
        if len(feedback_text) < 20:
            strengths = self._extract_strengths_technical(factor_scores)
            weaknesses = self._extract_weaknesses_technical(factor_scores)
            suggestions = self._generate_suggestions_technical(factor_scores, question_topic)
            feedback_text = self._generate_technical_feedback(factor_scores, strengths, weaknesses)
        
        return {
            "accuracy": factor_scores["accuracy"],
            "concept_understanding": factor_scores["concept_understanding"],
            "problem_solving": factor_scores["problem_solving"],
            "communication_clarity": factor_scores["communication_clarity"],
            "code_quality": factor_scores["code_quality"],
            "overall_technical_score": overall_score,
            "factor_scores_100": {k: round(v, 2) for k, v in factor_scores_100.items()},
            "key_strengths": strengths,
            "key_weaknesses": weaknesses,
            "improvement_suggestions": suggestions,
            "detailed_feedback": feedback_text
        }
    
    def evaluate_hr_answer(
        self,
        question: str,
        candidate_answer: str,
        job_role: str = "",
        company: str = ""
    ) -> Dict:
        """
        Evaluate an HR answer and return factor scores.
        """
        # Check if the answer is empty or not answered
        clean_ans = candidate_answer.strip().lower() if candidate_answer else ""
        if not clean_ans or clean_ans in ["no answer provided", "not answered", "no response provided", "not answered."]:
            print(f"[EvaluationScoring] Blank or No answer provided. Returning 0 score.")
            factor_scores = {
                "communication_skills": 0,
                "confidence": 0,
                "professionalism": 0,
                "adaptability": 0,
                "team_collaboration": 0
            }
            factor_scores_100 = {k: 0.0 for k in factor_scores}
            return {
                "communication_skills": 0.0,
                "confidence": 0.0,
                "professionalism": 0.0,
                "adaptability": 0.0,
                "team_collaboration": 0.0,
                "overall_hr_score": 0.0,
                "factor_scores_100": factor_scores_100,
                "key_strengths": [],
                "key_weaknesses": ["No response provided."],
                "improvement_suggestions": ["Please provide a detailed answer next time."],
                "detailed_feedback": "Question was not answered."
            }

        prompt = f"""/no_think
You are an expert HR manager evaluating a candidate's behavioral answer for a {job_role} role at {company}.
Question: {question}
Candidate's Answer: {candidate_answer}

Evaluate the candidate's answer and return a strict JSON object with the following schema:
{{
    "relevance": <int 0-10>,
    "depth_of_knowledge": <int 0-10>,
    "problem_solving": <int 0-10>,
    "communication": <int 0-10>,
    "confidence": <int 0-10>,
    "feedback": "<detailed constructive feedback>",
    "question_score": <int 0-10>
}}
Ensure the output is ONLY valid JSON.
"""
        factor_scores = {}
        strengths = []
        weaknesses = []
        suggestions = []
        feedback_text = ""
        overall_score = 0
        
        try:
            raw_response = request_ollama(prompt)
            content = re.sub(r'```json\n?', '', raw_response)
            content = re.sub(r'```\n?', '', content)
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            result = json.loads(content)
            
            factor_scores = {
                "communication_skills": max(0, min(10, int(result.get("communication", 5)))),
                "confidence": max(0, min(10, int(result.get("confidence", 5)))),
                "professionalism": max(0, min(10, int(result.get("relevance", 5)))),  # mapped
                "adaptability": max(0, min(10, int(result.get("problem_solving", 5)))), # mapped
                "team_collaboration": max(0, min(10, int(result.get("depth_of_knowledge", 5)))) # mapped
            }
            feedback_text = result.get("feedback", "")
            overall_score = max(0, min(100, int(result.get("question_score", 5)) * 10))

        except Exception as e:
            print(f"[EvaluationScoring] Qwen fallback in evaluate_hr_answer: {e}")
            factor_scores = {
                "communication_skills": self._score_communication_skills(candidate_answer),
                "confidence": self._score_confidence(candidate_answer),
                "professionalism": self._score_professionalism(candidate_answer),
                "adaptability": self._score_adaptability(candidate_answer, question),
                "team_collaboration": self._score_team_collaboration(candidate_answer, question)
            }
            
            # Ensure unique scores among the factors by adjusting duplicate values
            used_scores = set()
            for k in sorted(factor_scores.keys()):
                val = factor_scores[k]
                orig_val = val
                direction = 1 if val < 8 else -1
                while val in used_scores:
                    val += direction
                    if val > 10 or val < 1:
                        direction = -direction
                        val = orig_val + direction
                factor_scores[k] = val
                used_scores.add(val)
            
            # Calculate weighted overall HR score
            overall = sum(
                factor_scores[factor] * self.HR_WEIGHTS[factor]
                for factor in factor_scores
            ) * 10  # Convert to 0-100
            overall_score = round(overall, 2)
        
        # Generate insights
        if len(feedback_text) < 20:
            strengths = self._extract_strengths_hr(factor_scores)
            weaknesses = self._extract_weaknesses_hr(factor_scores)
            suggestions = self._generate_suggestions_hr(factor_scores, question)
            feedback_text = self._generate_hr_feedback(factor_scores, strengths, weaknesses)
        
        return {
            "communication_skills": factor_scores["communication_skills"],
            "confidence": factor_scores["confidence"],
            "professionalism": factor_scores["professionalism"],
            "adaptability": factor_scores["adaptability"],
            "team_collaboration": factor_scores["team_collaboration"],
            "overall_hr_score": overall_score,
            "factor_scores_100": {k: round(v, 2) for k, v in factor_scores_100.items()},
            "key_strengths": strengths,
            "key_weaknesses": weaknesses,
            "improvement_suggestions": suggestions,
            "detailed_feedback": feedback_text
        }
    
    def calculate_final_score(
        self,
        technical_score: float,
        hr_score: float
    ) -> Dict:
        """
        Calculate final interview score from technical and HR scores.
        
        Final Score = (Technical Score × 70%) + (HR Score × 30%)
        """
        
        # Normalize to 0-100 if not already
        tech_normalized = min(100, max(0, technical_score))
        hr_normalized = min(100, max(0, hr_score))
        
        final_score = (
            tech_normalized * self.FINAL_SCORE_WEIGHTS["technical"] +
            hr_normalized * self.FINAL_SCORE_WEIGHTS["hr"]
        )
        
        recommendation = ""
        if final_score >= 80:
            recommendation = "Strong Hire. The candidate demonstrates excellent technical and communication skills."
        elif final_score >= 65:
            recommendation = "Hire. Solid performance with minor areas for improvement."
        elif final_score >= 50:
            recommendation = "Consider. Average performance, might require additional training."
        else:
            recommendation = "Do Not Hire. Does not meet the baseline requirements."
            
        return {
            "technical_score": round(tech_normalized, 2),
            "hr_score": round(hr_normalized, 2),
            "final_interview_score": round(final_score, 2),
            "overall_score": round(final_score, 2),
            "recommendation": recommendation,
            "score_breakdown": {
                "technical_contribution": round(tech_normalized * 0.70, 2),
                "hr_contribution": round(hr_normalized * 0.30, 2)
            },
            "performance_level": self._categorize_performance(final_score)
        }
    
    # ─────────────────────────────────────────────────────
    # Technical Factor Scoring Methods
    # ─────────────────────────────────────────────────────
    
    def _score_accuracy(self, candidate_answer: str, reference_answer: str, question: str) -> int:
        """Score accuracy (30% weight) - Correctness of answer."""
        # Heuristic scoring based on answer characteristics
        score = 5  # Base score
        
        # Check answer length (too short = low accuracy)
        if len(candidate_answer.split()) < 5:
            score = 2
        elif len(candidate_answer.split()) < 15:
            score = 4
        else:
            score = 6
        
        # Check for keywords from reference answer
        if reference_answer:
            reference_keywords = set(reference_answer.lower().split())
            candidate_keywords = set(candidate_answer.lower().split())
            overlap = len(reference_keywords & candidate_keywords) / max(len(reference_keywords), 1)
            score = int(2 + overlap * 8)  # 2-10 based on overlap
        
        # Check for specific technical terms
        technical_keywords = ["algorithm", "optimize", "complexity", "implementation", "solution", "approach"]
        keyword_count = sum(1 for kw in technical_keywords if kw in candidate_answer.lower())
        if keyword_count >= 2:
            score = min(10, score + 2)
        
        return min(10, max(1, score))
    
    def _score_concept_understanding(self, candidate_answer: str, reference_answer: str, question_topic: str) -> int:
        """Score concept understanding (25% weight) - Depth and explanation quality."""
        score = 5
        
        # Check for explanation depth (longer, more detailed = better)
        word_count = len(candidate_answer.split())
        if word_count < 10:
            score = 2
        elif word_count < 30:
            score = 4
        elif word_count < 60:
            score = 6
        elif word_count < 100:
            score = 7
        else:
            score = 8
        
        # Look for explanatory phrases
        explanation_phrases = ["because", "therefore", "this means", "the reason", "in other words", "specifically", "fundamentally"]
        explanation_count = sum(1 for phrase in explanation_phrases if phrase in candidate_answer.lower())
        if explanation_count >= 2:
            score = min(10, score + 1)
        
        # Look for examples
        if "example" in candidate_answer.lower() or "for instance" in candidate_answer.lower():
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    def _score_problem_solving(self, candidate_answer: str) -> int:
        """Score problem solving (20% weight) - Logical reasoning and approach."""
        score = 5
        
        # Look for structured approach indicators
        structure_phrases = ["first", "step", "approach", "method", "solution", "process", "think"]
        structure_count = sum(1 for phrase in structure_phrases if phrase in candidate_answer.lower())
        if structure_count >= 3:
            score = 7
        elif structure_count >= 1:
            score = 6
        
        # Look for alternatives/edge cases
        if "also consider" in candidate_answer.lower() or "edge case" in candidate_answer.lower():
            score = min(10, score + 2)
        
        # Look for optimization thinking
        if "optimize" in candidate_answer.lower() or "efficient" in candidate_answer.lower():
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    def _score_communication_clarity(self, candidate_answer: str) -> int:
        """Score communication clarity (15% weight) - Clear technical explanation."""
        score = 5
        
        # Check for clarity indicators
        sentences = candidate_answer.split('.')
        avg_sentence_length = len(candidate_answer.split()) / max(len(sentences), 1)
        
        if 5 <= avg_sentence_length <= 20:
            score = 7  # Good sentence structure
        elif avg_sentence_length > 25:
            score = 4  # Too complex
        else:
            score = 5
        
        # Check for jargon/technical terms
        jargon_terms = ["variable", "function", "algorithm", "data structure", "complexity", "logic"]
        jargon_count = sum(1 for term in jargon_terms if term in candidate_answer.lower())
        if jargon_count >= 2:
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    def _score_code_quality(self, candidate_answer: str, question_topic: str) -> int:
        """Score code quality (10% weight) - Implementation and optimization thinking."""
        score = 5
        
        # Check for code-related terms
        code_terms = ["code", "syntax", "variable", "function", "implement", "algorithm"]
        code_count = sum(1 for term in code_terms if term in candidate_answer.lower())
        if code_count >= 2:
            score = 6
        
        # Check for optimization awareness
        if "optimization" in candidate_answer.lower() or "efficient" in candidate_answer.lower():
            score = min(10, score + 2)
        
        # Check for best practices
        if "clean" in candidate_answer.lower() or "readable" in candidate_answer.lower():
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    # ─────────────────────────────────────────────────────
    # HR Factor Scoring Methods
    # ─────────────────────────────────────────────────────
    
    def _score_communication_skills(self, candidate_answer: str) -> int:
        """Score communication skills (30% weight) - Fluency and clarity."""
        score = 5
        
        # Check for fluency (word count, sentence structure)
        sentences = candidate_answer.split('.')
        if len(sentences) < 2:
            score = 3
        elif len(sentences) >= 3:
            score = 6
        
        # Check for clarity keywords
        clarity_phrases = ["clearly", "importantly", "specifically", "in summary", "to elaborate"]
        clarity_count = sum(1 for phrase in clarity_phrases if phrase in candidate_answer.lower())
        if clarity_count >= 1:
            score = min(10, score + 1)
        
        # Avoid filler words
        filler_words = ["uh", "um", "like", "you know", "basically", "literally"]
        filler_count = sum(1 for word in filler_words if word in candidate_answer.lower())
        if filler_count > 2:
            score = max(1, score - 2)
        
        return min(10, max(1, score))
    
    def _score_confidence(self, candidate_answer: str) -> int:
        """Score confidence (20% weight) - Confidence level in delivery."""
        score = 5
        
        # Check for confident language
        confident_phrases = ["i'm confident", "definitely", "absolutely", "certainly", "without a doubt"]
        confident_count = sum(1 for phrase in confident_phrases if phrase in candidate_answer.lower())
        if confident_count >= 1:
            score = min(10, score + 2)
        
        # Check for uncertain language
        uncertain_phrases = ["maybe", "perhaps", "i think", "i guess", "possibly", "i'm not sure"]
        uncertain_count = sum(1 for phrase in uncertain_phrases if phrase in candidate_answer.lower())
        if uncertain_count >= 2:
            score = max(1, score - 2)
        
        # Positive tone indicators
        positive_phrases = ["excellent", "great", "successful", "proud", "achieved"]
        positive_count = sum(1 for phrase in positive_phrases if phrase in candidate_answer.lower())
        if positive_count >= 1:
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    def _score_professionalism(self, candidate_answer: str) -> int:
        """Score professionalism (20% weight) - Workplace behavior and attitude."""
        score = 6  # Assume professional baseline
        
        # Check for professional language
        professional_indicators = ["professional", "workplace", "team", "collaboration", "responsibility"]
        prof_count = sum(1 for ind in professional_indicators if ind in candidate_answer.lower())
        if prof_count >= 2:
            score = min(10, score + 1)
        
        # Check for problem-solving attitude
        attitude_phrases = ["learned", "improved", "worked on", "focused on", "committed"]
        attitude_count = sum(1 for phrase in attitude_phrases if phrase in candidate_answer.lower())
        if attitude_count >= 2:
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    def _score_adaptability(self, candidate_answer: str, question: str) -> int:
        """Score adaptability (15% weight) - Learning ability and flexibility."""
        score = 5
        
        # Check for learning indicators
        learning_phrases = ["learned", "adapted", "new", "skill", "challenge", "improve"]
        learning_count = sum(1 for phrase in learning_phrases if phrase in candidate_answer.lower())
        if learning_count >= 2:
            score = min(10, score + 2)
        
        # Check for flexibility
        flexibility_phrases = ["flexible", "open", "willing", "ready", "able to"]
        flex_count = sum(1 for phrase in flexibility_phrases if phrase in candidate_answer.lower())
        if flex_count >= 1:
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    def _score_team_collaboration(self, candidate_answer: str, question: str) -> int:
        """Score team collaboration (15% weight) - Teamwork and cooperation."""
        score = 5
        
        # Check for collaboration indicators
        collab_phrases = ["team", "collaborate", "together", "group", "worked with", "helped"]
        collab_count = sum(1 for phrase in collab_phrases if phrase in candidate_answer.lower())
        if collab_count >= 2:
            score = min(10, score + 2)
        
        # Check for interpersonal skills
        interpersonal_phrases = ["communicate", "listen", "understand", "support", "mentor"]
        interpersonal_count = sum(1 for phrase in interpersonal_phrases if phrase in candidate_answer.lower())
        if interpersonal_count >= 1:
            score = min(10, score + 1)
        
        return min(10, max(1, score))
    
    # ─────────────────────────────────────────────────────
    # Insight Generation Methods
    # ─────────────────────────────────────────────────────
    
    def _extract_strengths_technical(self, factor_scores: Dict) -> List[str]:
        """Extract key strengths from technical factor scores."""
        strengths = []
        
        for factor, score in factor_scores.items():
            if score >= 8:
                if factor == "accuracy":
                    strengths.append("Excellent technical accuracy")
                elif factor == "concept_understanding":
                    strengths.append("Deep conceptual understanding")
                elif factor == "problem_solving":
                    strengths.append("Strong problem-solving approach")
                elif factor == "communication_clarity":
                    strengths.append("Clear and articulate technical explanation")
                elif factor == "code_quality":
                    strengths.append("Good coding practices and optimization thinking")
        
        return strengths if strengths else ["Solid technical foundation"]
    
    def _extract_weaknesses_technical(self, factor_scores: Dict) -> List[str]:
        """Extract key weaknesses from technical factor scores."""
        weaknesses = []
        
        for factor, score in factor_scores.items():
            if score <= 4:
                if factor == "accuracy":
                    weaknesses.append("Accuracy needs improvement - verify correctness")
                elif factor == "concept_understanding":
                    weaknesses.append("Deeper conceptual understanding needed")
                elif factor == "problem_solving":
                    weaknesses.append("Problem-solving approach could be more systematic")
                elif factor == "communication_clarity":
                    weaknesses.append("Technical explanations need to be clearer")
                elif factor == "code_quality":
                    weaknesses.append("Consider code optimization and best practices")
        
        return weaknesses if weaknesses else []
    
    def _generate_suggestions_technical(self, factor_scores: Dict, question_topic: str) -> List[str]:
        """Generate improvement suggestions based on technical scores."""
        suggestions = []
        
        low_factors = [f for f, s in factor_scores.items() if s <= 5]
        
        if "concept_understanding" in low_factors:
            suggestions.append("Study the fundamental concepts of " + (question_topic or "this topic"))
        
        if "problem_solving" in low_factors:
            suggestions.append("Practice working through complex problems step-by-step")
        
        if "communication_clarity" in low_factors:
            suggestions.append("Practice explaining technical concepts clearly to others")
        
        if "code_quality" in low_factors:
            suggestions.append("Focus on writing clean, optimized code with best practices")
        
        if not suggestions:
            suggestions.append("Continue practicing to refine your technical skills")
        
        return suggestions
    
    def _extract_strengths_hr(self, factor_scores: Dict) -> List[str]:
        """Extract key strengths from HR factor scores."""
        strengths = []
        
        for factor, score in factor_scores.items():
            if score >= 8:
                if factor == "communication_skills":
                    strengths.append("Excellent communication and articulation")
                elif factor == "confidence":
                    strengths.append("Strong confidence and positive demeanor")
                elif factor == "professionalism":
                    strengths.append("High level of professionalism")
                elif factor == "adaptability":
                    strengths.append("Strong adaptability and learning mindset")
                elif factor == "team_collaboration":
                    strengths.append("Great teamwork and collaboration skills")
        
        return strengths if strengths else ["Solid interpersonal skills"]
    
    def _extract_weaknesses_hr(self, factor_scores: Dict) -> List[str]:
        """Extract key weaknesses from HR factor scores."""
        weaknesses = []
        
        for factor, score in factor_scores.items():
            if score <= 4:
                if factor == "communication_skills":
                    weaknesses.append("Work on communication clarity and fluency")
                elif factor == "confidence":
                    weaknesses.append("Build more confidence in responses")
                elif factor == "professionalism":
                    weaknesses.append("Focus on professional tone and attitude")
                elif factor == "adaptability":
                    weaknesses.append("Show more flexibility and learning orientation")
                elif factor == "team_collaboration":
                    weaknesses.append("Emphasize teamwork and collaboration abilities")
        
        return weaknesses if weaknesses else []
    
    def _generate_suggestions_hr(self, factor_scores: Dict, question: str) -> List[str]:
        """Generate HR improvement suggestions."""
        suggestions = []
        
        low_factors = [f for f, s in factor_scores.items() if s <= 5]
        
        if "communication_skills" in low_factors:
            suggestions.append("Practice speaking clearly and concisely")
        
        if "confidence" in low_factors:
            suggestions.append("Build confidence through practice and positive self-reflection")
        
        if "adaptability" in low_factors:
            suggestions.append("Share more examples of adapting to new situations")
        
        if "team_collaboration" in low_factors:
            suggestions.append("Highlight your teamwork and collaboration experiences")
        
        if not suggestions:
            suggestions.append("Continue developing your interpersonal skills")
        
        return suggestions
    
    def _categorize_performance(self, score: float) -> str:
        """Categorize final performance level."""
        if score >= 85:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Average"
        elif score >= 45:
            return "Below Average"
        else:
            return "Poor"
    
    def _generate_technical_feedback(self, scores: Dict, strengths: List[str], weaknesses: List[str]) -> str:
        """Generate overall technical feedback."""
        feedback = "Technical Evaluation: "
        
        if strengths:
            feedback += f"Strengths include {', '.join(strengths).lower()}. "
        
        if weaknesses:
            feedback += f"Areas for improvement: {', '.join(weaknesses).lower()}. "
        
        feedback += "Focus on practicing more complex problems and deepening your conceptual knowledge."
        
        return feedback
    
    def _generate_hr_feedback(self, scores: Dict, strengths: List[str], weaknesses: List[str]) -> str:
        """Generate overall HR feedback."""
        feedback = "HR Evaluation: "
        
        if strengths:
            feedback += f"You demonstrated {', '.join(strengths).lower()}. "
        
        if weaknesses:
            feedback += f"Consider improving: {', '.join(weaknesses).lower()}. "
        
        feedback += "Keep practicing your communication and continue building on your professional strengths."
        
        return feedback


# Singleton instance
evaluation_scoring = EvaluationScoring()
