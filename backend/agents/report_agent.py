"""
Report Agent - Compiles interview results and generates comprehensive reports
"""
from typing import Dict, Any, List
from datetime import datetime
import json

class ReportAgent:
    def __init__(self):
        pass
    
    def generate_report(self, interview_id: int, db) -> Dict[str, Any]:
        """Generate comprehensive interview report"""
        try:
            from models import Interview, InterviewQuestion, InterviewReport, User, Resume, ProctoringLog
            
            # Get interview details
            interview = db.query(Interview).filter(Interview.id == interview_id).first()
            if not interview:
                return {"error": "Interview not found"}
            
            # Get user details
            user = db.query(User).filter(User.id == interview.user_id).first()
            
            # Get resume details
            resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
            
            # Get all questions and answers
            questions = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == interview_id
            ).order_by(InterviewQuestion.order_index).all()
            
            # Get proctoring summary
            proctoring_logs = db.query(ProctoringLog).filter(
                ProctoringLog.interview_id == interview_id
            ).all()
            
            # Calculate metrics
            total_score = sum(q.score for q in questions if q.score)
            max_score = sum(q.max_score for q in questions)
            average_score = total_score / len(questions) if questions else 0
            percentage = (total_score / max_score) * 100 if max_score > 0 else 0
            
            # Analyze performance by question type
            performance_by_type = self._analyze_by_question_type(questions)
            
            # Identify strengths and weaknesses
            strengths, weaknesses = self._identify_strengths_weaknesses(questions, performance_by_type)
            
            # Generate skill assessment
            skill_assessment = self._assess_skills(questions, resume)
            
            # Generate behavioral assessment
            behavioral_assessment = self._assess_behavior(questions, resume)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(average_score, strengths, weaknesses)
            
            # Create report record
            report = InterviewReport(
                interview_id=interview_id,
                user_id=interview.user_id,
                overall_score=average_score,
                total_questions=len(questions),
                correct_answers=len([q for q in questions if q.score and q.score >= 6.0]),
                strengths=strengths,
                weaknesses=weaknesses,
                recommendations="\n".join(recommendations),
                detailed_feedback=self._generate_detailed_feedback(questions, interview),
                skill_assessment=skill_assessment,
                behavioral_assessment=behavioral_assessment
            )
            db.add(report)
            db.commit()
            
            return {
                "success": True,
                "report": {
                    "candidate_name": user.name if user else "Unknown",
                    "job_role": interview.job_role,
                    "company": interview.company,
                    "overall_score": round(average_score, 1),
                    "percentage": round(percentage, 1),
                    "total_questions": len(questions),
                    "interview_date": interview.created_at.isoformat(),
                    "completion_time": interview.completed_at.isoformat() if interview.completed_at else None,
                    "performance_by_type": performance_by_type,
                    "strengths": strengths,
                    "weaknesses": weaknesses,
                    "skill_assessment": skill_assessment,
                    "behavioral_assessment": behavioral_assessment,
                    "recommendations": recommendations,
                    "proctoring_summary": {
                        "total_events": len(proctoring_logs),
                        "critical_events": len([log for log in proctoring_logs if log.status == "critical"]),
                        "warning_events": len([log for log in proctoring_logs if log.status == "warning"])
                    },
                    "question_details": [
                        {
                            "question": q.question,
                            "answer": q.answer,
                            "score": q.score,
                            "max_score": q.max_score,
                            "feedback": q.feedback,
                            "question_type": q.question_type,
                            "difficulty": q.difficulty
                        }
                        for q in questions
                    ]
                }
            }
            
        except Exception as e:
            print(f"Error generating report: {e}")
            return {"success": False, "error": str(e)}
    
    def _analyze_by_question_type(self, questions: List) -> Dict[str, Any]:
        """Analyze performance by question type"""
        type_performance = {}
        
        for question in questions:
            q_type = question.question_type
            if q_type not in type_performance:
                type_performance[q_type] = {
                    "total": 0,
                    "score_sum": 0,
                    "max_sum": 0
                }
            
            type_performance[q_type]["total"] += 1
            if question.score:
                type_performance[q_type]["score_sum"] += question.score
            type_performance[q_type]["max_sum"] += question.max_score
        
        # Calculate averages
        for q_type in type_performance:
            total = type_performance[q_type]["total"]
            type_performance[q_type]["average"] = round(
                type_performance[q_type]["score_sum"] / total, 1
            )
            type_performance[q_type]["percentage"] = round(
                (type_performance[q_type]["score_sum"] / type_performance[q_type]["max_sum"]) * 100, 1
            )
        
        return type_performance
    
    def _identify_strengths_weaknesses(self, questions: List, performance_by_type: Dict) -> tuple:
        """Identify strengths and weaknesses from performance"""
        strengths = []
        weaknesses = []
        
        # Analyze by question type
        for q_type, perf in performance_by_type.items():
            if perf["percentage"] >= 70:
                strengths.append(f"Strong performance in {q_type} questions")
            elif perf["percentage"] <= 40:
                weaknesses.append(f"Needs improvement in {q_type} questions")
        
        # Analyze individual question scores
        high_scoring = len([q for q in questions if q.score and q.score >= 8.0])
        low_scoring = len([q for q in questions if q.score and q.score <= 4.0])
        
        if high_scoring >= len(questions) * 0.5:
            strengths.append("Consistently provides high-quality answers")
        if low_scoring >= len(questions) * 0.3:
            weaknesses.append("Several answers need more detail and specificity")
        
        return strengths, weaknesses
    
    def _assess_skills(self, questions: List, resume) -> Dict[str, Any]:
        """Assess technical and professional skills"""
        skill_assessment = {
            "technical_skills": [],
            "communication_skills": [],
            "problem_solving": []
        }
        
        # Analyze technical questions
        tech_questions = [q for q in questions if q.question_type == "technical"]
        if tech_questions:
            avg_tech_score = sum(q.score for q in tech_questions if q.score) / len(tech_questions)
            if avg_tech_score >= 7.0:
                skill_assessment["technical_skills"].append("Strong technical knowledge")
            elif avg_tech_score >= 5.0:
                skill_assessment["technical_skills"].append("Good technical foundation")
            else:
                skill_assessment["technical_skills"].append("Technical skills need development")
        
        # Analyze behavioral questions for communication
        behav_questions = [q for q in questions if q.question_type == "behavioral"]
        if behav_questions:
            avg_behav_score = sum(q.score for q in behav_questions if q.score) / len(behav_questions)
            if avg_behav_score >= 7.0:
                skill_assessment["communication_skills"].append("Excellent communication skills")
            elif avg_behav_score >= 5.0:
                skill_assessment["communication_skills"].append("Good communication ability")
            else:
                skill_assessment["communication_skills"].append("Communication needs improvement")
        
        # Analyze scenario questions for problem solving
        scenario_questions = [q for q in questions if q.question_type == "scenario"]
        if scenario_questions:
            avg_scenario_score = sum(q.score for q in scenario_questions if q.score) / len(scenario_questions)
            if avg_scenario_score >= 7.0:
                skill_assessment["problem_solving"].append("Strong problem-solving approach")
            elif avg_scenario_score >= 5.0:
                skill_assessment["problem_solving"].append("Good problem-solving skills")
            else:
                skill_assessment["problem_solving"].append("Problem-solving needs development")
        
        # Add skills from resume if available
        if resume and resume.classification_details:
            try:
                classification_data = json.loads(resume.classification_details) if isinstance(resume.classification_details, str) else resume.classification_details
                candidate_type = resume.candidate_type
                
                if candidate_type == "IMPACT":
                    skill_assessment["technical_skills"].append("Results-oriented approach")
                elif candidate_type == "MOTIVE":
                    skill_assessment["communication_skills"].append("Leadership potential")
                elif candidate_type == "SYSTEM":
                    skill_assessment["technical_skills"].append("Systems thinking capability")
            except:
                pass
        
        return skill_assessment
    
    def _assess_behavior(self, questions: List, resume) -> Dict[str, Any]:
        """Assess behavioral traits and cultural fit"""
        behavioral_assessment = {
            "teamwork": "Not assessed",
            "leadership": "Not assessed",
            "adaptability": "Not assessed",
            "communication": "Not assessed"
        }
        
        # Analyze behavioral question answers
        behav_questions = [q for q in questions if q.question_type == "behavioral"]
        if behav_questions:
            avg_score = sum(q.score for q in behav_questions if q.score) / len(behav_questions)
            
            if avg_score >= 7.0:
                behavioral_assessment["teamwork"] = "Strong team player"
                behavioral_assessment["leadership"] = "Leadership potential evident"
                behavioral_assessment["adaptability"] = "Highly adaptable"
                behavioral_assessment["communication"] = "Excellent communicator"
            elif avg_score >= 5.0:
                behavioral_assessment["teamwork"] = "Good team collaborator"
                behavioral_assessment["leadership"] = "Developing leadership skills"
                behavioral_assessment["adaptability"] = "Adaptable to change"
                behavioral_assessment["communication"] = "Good communicator"
            else:
                behavioral_assessment["teamwork"] = "Teamwork skills need development"
                behavioral_assessment["leadership"] = "Leadership skills need development"
                behavioral_assessment["adaptability"] = "Adaptability needs improvement"
                behavioral_assessment["communication"] = "Communication needs improvement"
        
        # Incorporate resume classification
        if resume and resume.candidate_type:
            candidate_type = resume.candidate_type
            if candidate_type == "MOTIVE":
                behavioral_assessment["leadership"] = "Natural leadership orientation"
            elif candidate_type == "IMPACT":
                behavioral_assessment["teamwork"] = "Goal-oriented team contributor"
            elif candidate_type == "SYSTEM":
                behavioral_assessment["adaptability"] = "Analytical and systematic approach"
        
        return behavioral_assessment
    
    def _generate_recommendations(self, average_score: float, strengths: List, weaknesses: List) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        if average_score >= 8.0:
            recommendations.append("Candidate demonstrates excellent interview performance and is highly recommended for the position.")
            recommendations.append("Consider for advanced roles or fast-track programs.")
        elif average_score >= 6.0:
            recommendations.append("Candidate shows good potential with solid interview performance.")
            recommendations.append("Recommended for the position with possible mentorship program.")
        elif average_score >= 4.0:
            recommendations.append("Candidate shows potential but needs development in key areas.")
            recommendations.append("Consider for junior position or internship program.")
        else:
            recommendations.append("Candidate needs significant development before consideration.")
            recommendations.append("Not recommended for current position.")
        
        # Add specific recommendations based on weaknesses
        if "technical" in " ".join(weaknesses).lower():
            recommendations.append("Suggest additional technical training or certification.")
        if "communication" in " ".join(weaknesses).lower():
            recommendations.append("Recommend communication skills workshops or practice.")
        if "problem-solving" in " ".join(weaknesses).lower():
            recommendations.append("Suggest problem-solving exercises and case study practice.")
        
        return recommendations
    
    def _generate_detailed_feedback(self, questions: List, interview) -> str:
        """Generate detailed feedback summary"""
        feedback_parts = []
        
        feedback_parts.append(f"Interview for {interview.job_role} position at {interview.company}.")
        feedback_parts.append(f"Total questions answered: {len(questions)}")
        
        if questions:
            avg_score = sum(q.score for q in questions if q.score) / len(questions)
            feedback_parts.append(f"Overall performance: {avg_score:.1f}/10")
        
        feedback_parts.append("\nQuestion-by-question feedback:")
        for i, q in enumerate(questions, 1):
            feedback_parts.append(f"\n{i}. {q.question[:50]}...")
            if q.feedback:
                feedback_parts.append(f"   Score: {q.score}/10")
                feedback_parts.append(f"   Feedback: {q.feedback}")
        
        return "\n".join(feedback_parts)
    
    def send_report_to_tpo(self, report_id: int, db) -> Dict[str, Any]:
        """Mark report as sent to TPO/Recruiter"""
        try:
            from models import InterviewReport
            
            report = db.query(InterviewReport).filter(InterviewReport.id == report_id).first()
            if not report:
                return {"error": "Report not found"}
            
            report.sent_to_tpo = True
            report.sent_at = datetime.utcnow()
            db.commit()
            
            return {
                "success": True,
                "message": "Report marked as sent to TPO",
                "sent_at": report.sent_at.isoformat()
            }
            
        except Exception as e:
            print(f"Error sending report to TPO: {e}")
            return {"success": False, "error": str(e)}
