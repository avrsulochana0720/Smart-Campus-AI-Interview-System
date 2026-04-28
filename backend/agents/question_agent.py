"""
Question Agent - Generates and serves interview questions with adaptive difficulty
"""
from typing import Dict, Any, List
from datetime import datetime
import random

class QuestionAgent:
    def __init__(self):
        # Question database organized by difficulty and type
        self.question_bank = {
            "technical": {
                "easy": [
                    "What programming languages are you most comfortable with?",
                    "Explain the concept of object-oriented programming.",
                    "What is the difference between SQL and NoSQL databases?",
                    "Describe the software development lifecycle."
                ],
                "medium": [
                    "How do you handle error handling in your applications?",
                    "Explain the concept of API design and RESTful services.",
                    "Describe your experience with cloud platforms and services.",
                    "How do you ensure code quality in your projects?"
                ],
                "hard": [
                    "Design a scalable architecture for a high-traffic application.",
                    "Explain how you would optimize database performance for large datasets.",
                    "Describe your approach to solving complex technical problems.",
                    "How do you balance technical debt with new feature development?"
                ]
            },
            "behavioral": {
                "easy": [
                    "Tell me about yourself and your background.",
                    "Why are you interested in this position?",
                    "What do you know about our company?",
                    "Describe your ideal work environment."
                ],
                "medium": [
                    "Tell me about a time you had to work in a team.",
                    "How do you handle stress and pressure?",
                    "Describe a situation where you had to learn something new quickly.",
                    "How do you prioritize your tasks when everything seems important?"
                ],
                "hard": [
                    "Tell me about a time you had to lead a team through a difficult situation.",
                    "How do you handle conflicts with team members?",
                    "Describe a situation where you had to make a tough decision.",
                    "How do you motivate team members who are struggling?"
                ]
            },
            "scenario": {
                "easy": [
                    "How would you handle a bug that's found just before a deadline?",
                    "What would you do if you disagreed with your manager's approach?",
                    "How would you handle a situation where you're falling behind on a project?"
                ],
                "medium": [
                    "How would you handle a situation where a key team member leaves mid-project?",
                    "Describe how you would approach a project with unclear requirements.",
                    "How would you handle a situation where technical constraints change suddenly?"
                ],
                "hard": [
                    "How would you handle a major system outage during peak hours?",
                    "Describe how you would manage a project with conflicting stakeholder requirements.",
                    "How would you approach a situation where your technical solution is rejected by business stakeholders?"
                ]
            }
        }
    
    def get_next_question(self, interview_id: int, current_index: int, difficulty: str, 
                         candidate_type: str, job_role: str, db) -> Dict[str, Any]:
        """Get the next question with adaptive difficulty"""
        try:
            from models import InterviewQuestion, Interview
            
            # Get interview details
            interview = db.query(Interview).filter(Interview.id == interview_id).first()
            if not interview:
                return {"error": "Interview not found"}
            
            # Determine question type based on candidate type and current index
            question_type = self._determine_question_type(candidate_type, current_index)
            
            # Get question from bank
            question_text = self._get_question_from_bank(question_type, difficulty)
            
            # If no questions available, generate one dynamically
            if not question_text:
                question_text = self._generate_dynamic_question(question_type, difficulty, job_role)
            
            # Create question record
            question_record = InterviewQuestion(
                interview_id=interview_id,
                question=question_text,
                difficulty=difficulty,
                question_type=question_type,
                order_index=current_index,
                max_score=10.0
            )
            db.add(question_record)
            db.commit()
            db.refresh(question_record)
            
            return {
                "success": True,
                "question_id": question_record.id,
                "question": question_text,
                "question_type": question_type,
                "difficulty": difficulty,
                "order_index": current_index,
                "time_limit_minutes": 3  # Default time limit per question
            }
            
        except Exception as e:
            print(f"Error getting next question: {e}")
            return {"success": False, "error": str(e)}
    
    def _determine_question_type(self, candidate_type: str, current_index: int) -> str:
        """Determine question type based on candidate profile and question index"""
        # Mix of question types based on candidate type
        type_rotation = {
            "IMPACT": ["technical", "scenario", "behavioral"],
            "MOTIVE": ["behavioral", "scenario", "technical"],
            "SYSTEM": ["technical", "technical", "scenario", "behavioral"]
        }
        
        rotation = type_rotation.get(candidate_type, ["technical", "behavioral", "scenario"])
        return rotation[current_index % len(rotation)]
    
    def _get_question_from_bank(self, question_type: str, difficulty: str) -> str:
        """Get a question from the question bank"""
        try:
            questions = self.question_bank.get(question_type, {}).get(difficulty, [])
            if questions:
                return random.choice(questions)
        except:
            pass
        return None
    
    def _generate_dynamic_question(self, question_type: str, difficulty: str, job_role: str) -> str:
        """Generate a dynamic question when bank is empty"""
        templates = {
            "technical": {
                "easy": f"What technical skills do you think are most important for a {job_role} role?",
                "medium": f"How would you apply your technical knowledge to solve a common problem in {job_role}?",
                "hard": f"Describe a complex technical challenge you faced in {job_role} and how you solved it."
            },
            "behavioral": {
                "easy": f"What interests you most about working in {job_role}?",
                "medium": f"Describe how your personality fits well with a {job_role} role.",
                "hard": f"Tell me about a time your behavioral skills helped you succeed in a {job_role} context."
            },
            "scenario": {
                "easy": f"How would you handle a typical challenge in {job_role}?",
                "medium": f"Describe how you would approach a complex situation in {job_role}.",
                "hard": f"How would you handle a crisis situation as a {job_role}?"
            }
        }
        
        return templates.get(question_type, {}).get(difficulty, f"Tell me about your experience with {job_role}.")
    
    def adjust_difficulty(self, current_difficulty: str, previous_score: float, 
                         adaptive_mode: bool) -> str:
        """Adjust difficulty based on previous answer performance"""
        if not adaptive_mode:
            return current_difficulty
        
        difficulty_levels = ["easy", "medium", "hard"]
        current_index = difficulty_levels.index(current_difficulty)
        
        # Increase difficulty if score is high, decrease if low
        if previous_score >= 8.0:
            new_index = min(current_index + 1, len(difficulty_levels) - 1)
        elif previous_score <= 5.0:
            new_index = max(current_index - 1, 0)
        else:
            new_index = current_index
        
        return difficulty_levels[new_index]
    
    def get_remaining_questions(self, interview_id: int, db) -> Dict[str, Any]:
        """Get remaining questions for an interview"""
        try:
            from models import Interview, InterviewQuestion
            
            interview = db.query(Interview).filter(Interview.id == interview_id).first()
            if not interview:
                return {"error": "Interview not found"}
            
            answered_questions = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == interview_id,
                InterviewQuestion.answer.isnot(None)
            ).count()
            
            remaining = interview.total_questions - answered_questions
            
            return {
                "success": True,
                "total_questions": interview.total_questions,
                "answered": answered_questions,
                "remaining": remaining,
                "current_index": interview.current_question_index
            }
            
        except Exception as e:
            print(f"Error getting remaining questions: {e}")
            return {"success": False, "error": str(e)}
