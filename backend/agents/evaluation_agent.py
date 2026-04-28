"""
Answer Evaluation Agent - Evaluates interview answers and provides scoring
"""
from typing import Dict, Any
from datetime import datetime
import re
import json

class EvaluationAgent:
    def __init__(self):
        self.evaluation_criteria = {
            "technical": {
                "accuracy": 0.3,
                "depth": 0.3,
                "clarity": 0.2,
                "relevance": 0.2
            },
            "behavioral": {
                "specificity": 0.3,
                "structure": 0.2,
                "relevance": 0.3,
                "impact": 0.2
            },
            "scenario": {
                "problem_solving": 0.3,
                "approach": 0.3,
                "communication": 0.2,
                "feasibility": 0.2
            }
        }
    
    def evaluate_answer(self, question_id: int, answer: str, question_type: str, 
                      difficulty: str, db) -> Dict[str, Any]:
        """Evaluate an interview answer and provide score with feedback"""
        try:
            from models import InterviewQuestion, Interview
            
            # Get question details
            question = db.query(InterviewQuestion).filter(Interview.id == question_id).first()
            if not question:
                return {"error": "Question not found"}
            
            # Perform evaluation
            evaluation_result = self._perform_evaluation(answer, question_type, difficulty)
            
            # Update question record
            question.answer = answer
            question.score = evaluation_result["score"]
            question.feedback = evaluation_result["feedback"]
            question.answered_at = datetime.utcnow()
            db.commit()
            
            # Update interview progress
            interview = db.query(Interview).filter(Interview.id == question.interview_id).first()
            if interview:
                interview.current_question_index += 1
                db.commit()
            
            return {
                "success": True,
                "score": evaluation_result["score"],
                "max_score": question.max_score,
                "feedback": evaluation_result["feedback"],
                "strengths": evaluation_result["strengths"],
                "weaknesses": evaluation_result["weaknesses"],
                "next_difficulty": evaluation_result["suggested_difficulty"]
            }
            
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return {"success": False, "error": str(e)}
    
    def _perform_evaluation(self, answer: str, question_type: str, difficulty: str) -> Dict[str, Any]:
        """Perform the actual evaluation of the answer"""
        # Basic metrics
        answer_length = len(answer.strip())
        word_count = len(answer.split())
        
        # Minimum requirements
        min_words = {
            "easy": 20,
            "medium": 40,
            "hard": 60
        }
        
        required_words = min_words.get(difficulty, 30)
        
        # Calculate base score from length and content
        length_score = min(word_count / required_words, 1.5) * 3  # Max 4.5 points
        
        # Content analysis
        content_score = self._analyze_content(answer, question_type)
        
        # Structure analysis
        structure_score = self._analyze_structure(answer)
        
        # Calculate total score
        total_score = min(length_score + content_score + structure_score, 10.0)
        
        # Generate feedback
        feedback = self._generate_feedback(total_score, question_type, word_count, required_words)
        
        # Determine strengths and weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(answer, total_score, question_type)
        
        # Suggest next difficulty
        suggested_difficulty = self._suggest_next_difficulty(total_score, difficulty)
        
        return {
            "score": round(total_score, 1),
            "feedback": feedback,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "suggested_difficulty": suggested_difficulty,
            "metrics": {
                "word_count": word_count,
                "required_words": required_words,
                "length_score": length_score,
                "content_score": content_score,
                "structure_score": structure_score
            }
        }
    
    def _analyze_content(self, answer: str, question_type: str) -> float:
        """Analyze the content quality of the answer"""
        content_indicators = {
            "technical": ["algorithm", "implementation", "code", "system", "architecture", "design", "develop", "programming"],
            "behavioral": ["team", "collaborate", "communication", "leadership", "experience", "situation", "challenged"],
            "scenario": ["approach", "solution", "handle", "manage", "strategy", "implement", "resolve"]
        }
        
        indicators = content_indicators.get(question_type, [])
        answer_lower = answer.lower()
        
        indicator_count = sum(1 for indicator in indicators if indicator in answer_lower)
        content_score = min(indicator_count * 0.5, 3.0)  # Max 3 points
        
        return content_score
    
    def _analyze_structure(self, answer: str) -> float:
        """Analyze the structure of the answer"""
        structure_score = 0.0
        
        # Check for proper sentence structure
        sentences = re.split(r'[.!?]+', answer)
        if len(sentences) >= 2:
            structure_score += 1.0
        
        # Check for paragraphs or structure
        if '\n' in answer or len(answer) > 200:
            structure_score += 0.5
        
        # Check for logical flow indicators
        flow_indicators = ["first", "then", "next", "finally", "however", "therefore", "because", "so"]
        answer_lower = answer.lower()
        if any(indicator in answer_lower for indicator in flow_indicators):
            structure_score += 0.5
        
        return min(structure_score, 2.5)  # Max 2.5 points
    
    def _generate_feedback(self, score: float, question_type: str, word_count: int, required_words: int) -> str:
        """Generate feedback based on score"""
        if score >= 8.0:
            return f"Excellent answer! Your response was comprehensive and well-structured. You provided {word_count} words, which shows good depth of knowledge."
        elif score >= 6.0:
            return f"Good answer with solid content. Your response of {word_count} words covers the key points, but could benefit from more specific examples."
        elif score >= 4.0:
            return f"Adequate answer. While you provided {word_count} words, try to be more specific and provide concrete examples to improve your response."
        else:
            return f"Your answer needs improvement. With only {word_count} words, please expand on your response with more details and specific examples."
    
    def _identify_strengths_weaknesses(self, answer: str, score: float, question_type: str) -> tuple:
        """Identify strengths and weaknesses in the answer"""
        strengths = []
        weaknesses = []
        
        if score >= 7.0:
            strengths.append("Comprehensive response")
            strengths.append("Good structure and flow")
        elif score >= 5.0:
            strengths.append("Adequate coverage of topic")
            weaknesses.append("Could be more specific")
        else:
            weaknesses.append("Response too brief")
            weaknesses.append("Lacks concrete examples")
        
        # Question-specific feedback
        if question_type == "technical" and "code" not in answer.lower() and "implement" not in answer.lower():
            weaknesses.append("Could include more technical details")
        elif question_type == "behavioral" and "team" not in answer.lower():
            weaknesses.append("Could emphasize teamwork more")
        elif question_type == "scenario" and "approach" not in answer.lower():
            weaknesses.append("Could describe your approach more clearly")
        
        return strengths, weaknesses
    
    def _suggest_next_difficulty(self, score: float, current_difficulty: str) -> str:
        """Suggest the difficulty for the next question"""
        difficulty_levels = ["easy", "medium", "hard"]
        current_index = difficulty_levels.index(current_difficulty)
        
        if score >= 8.0:
            new_index = min(current_index + 1, len(difficulty_levels) - 1)
        elif score <= 4.0:
            new_index = max(current_index - 1, 0)
        else:
            new_index = current_index
        
        return difficulty_levels[new_index]
    
    def calculate_overall_score(self, interview_id: int, db) -> Dict[str, Any]:
        """Calculate overall score for an interview"""
        try:
            from models import InterviewQuestion, Interview
            
            questions = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == interview_id,
                InterviewQuestion.score.isnot(None)
            ).all()
            
            if not questions:
                return {"error": "No questions answered yet"}
            
            total_score = sum(q.score for q in questions)
            max_possible = sum(q.max_score for q in questions)
            average_score = total_score / len(questions)
            percentage = (total_score / max_possible) * 100 if max_possible > 0 else 0
            
            # Update interview with overall score
            interview = db.query(Interview).filter(Interview.id == interview_id).first()
            if interview:
                interview.overall_score = average_score
                interview.status = "completed"
                interview.completed_at = datetime.utcnow()
                db.commit()
            
            return {
                "success": True,
                "total_score": round(total_score, 1),
                "max_possible": round(max_possible, 1),
                "average_score": round(average_score, 1),
                "percentage": round(percentage, 1),
                "questions_answered": len(questions)
            }
            
        except Exception as e:
            print(f"Error calculating overall score: {e}")
            return {"success": False, "error": str(e)}
