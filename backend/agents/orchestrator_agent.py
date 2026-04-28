"""
Orchestrator Agent - Manages interview session preparation and coordination
"""
from typing import Dict, Any
from datetime import datetime
import json

class OrchestratorAgent:
    def __init__(self):
        self.session_config = {
            "default_questions": 10,
            "time_limit_minutes": 30,
            "proctoring_enabled": True,
            "adaptive_mode": True
        }
    
    def prepare_session(self, user_id: int, resume_id: int, job_role: str, company: str, db) -> Dict[str, Any]:
        """
        Prepare interview session based on resume analysis and job requirements
        """
        try:
            # Get resume details to understand candidate profile
            from models import Resume
            resume = db.query(Resume).filter(Resume.id == resume_id).first()
            
            if not resume:
                return {"error": "Resume not found"}
            
            # Parse classification details
            classification_data = {}
            if resume.classification_details:
                try:
                    classification_data = json.loads(resume.classification_details) if isinstance(resume.classification_details, str) else resume.classification_details
                except:
                    classification_data = {}
            
            # Determine initial difficulty based on candidate type
            candidate_type = resume.candidate_type or "SYSTEM"
            difficulty_level = self._determine_initial_difficulty(candidate_type)
            
            # Prepare session configuration
            session_config = {
                "user_id": user_id,
                "resume_id": resume_id,
                "job_role": job_role,
                "company": company,
                "candidate_type": candidate_type,
                "difficulty_level": difficulty_level,
                "total_questions": self.session_config["default_questions"],
                "proctoring_enabled": self.session_config["proctoring_enabled"],
                "adaptive_mode": self.session_config["adaptive_mode"],
                "time_limit_minutes": self.session_config["time_limit_minutes"],
                "classification_insights": classification_data.get("classification_details", {}),
                "confidence_scores": classification_data.get("confidence_scores", {})
            }
            
            return {
                "success": True,
                "session_config": session_config,
                "instructions": self._generate_instructions(candidate_type, job_role),
                "estimated_duration": f"{self.session_config['time_limit_minutes']} minutes"
            }
            
        except Exception as e:
            print(f"Error in session preparation: {e}")
            return {"error": str(e)}
    
    def _determine_initial_difficulty(self, candidate_type: str) -> str:
        """Determine initial difficulty based on candidate classification"""
        difficulty_map = {
            "IMPACT": "medium",  # Results-oriented - medium technical, high business focus
            "MOTIVE": "easy",    # People-oriented - focus on behavioral questions
            "SYSTEM": "hard"     # Technical-oriented - focus on technical depth
        }
        return difficulty_map.get(candidate_type, "medium")
    
    def _generate_instructions(self, candidate_type: str, job_role: str) -> str:
        """Generate personalized instructions based on candidate profile"""
        base_instructions = """
        Welcome to your Smart Campus Interview!
        
        Here's what you need to know:
        1. The interview consists of {total_questions} questions
        2. You have approximately {time_limit} minutes to complete it
        3. Answer each question thoroughly and to the best of your ability
        4. Your camera and system will be monitored for integrity
        5. Questions will adapt based on your performance
        """
        
        personalized_additions = {
            "IMPACT": "Focus on highlighting your measurable achievements and business impact.",
            "MOTIVE": "Emphasize your leadership experiences and team collaboration skills.",
            "SYSTEM": "Demonstrate your technical expertise and problem-solving approach."
        }
        
        addition = personalized_additions.get(candidate_type, "Showcase your relevant skills and experiences.")
        
        return base_instructions.format(
            total_questions=self.session_config["default_questions"],
            time_limit=self.session_config["time_limit_minutes"]
        ) + f"\n\n{addition}"
    
    def validate_session_start(self, session_config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that session can start (camera check, system check, etc.)"""
        validation_checks = {
            "camera_check": session_config.get("proctoring_enabled", False),
            "system_check": True,
            "resume_uploaded": session_config.get("resume_id") is not None,
            "job_selected": session_config.get("job_role") is not None
        }
        
        all_passed = all(validation_checks.values())
        
        return {
            "can_start": all_passed,
            "checks": validation_checks,
            "message": "All checks passed" if all_passed else "Please complete all required checks"
        }
