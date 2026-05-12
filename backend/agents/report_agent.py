"""
Report Agent - Compiles interview results and generates comprehensive reports using Qwen AI
"""
from typing import Dict, Any, List
from datetime import datetime
import json
import ollama
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

class ReportAgent:
    def __init__(self):
        self.model = OLLAMA_MODEL
    
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
        """Identify strengths and weaknesses using Qwen AI for genuine analysis"""
        # Prepare context for AI analysis
        questions_context = []
        for q in questions:
            questions_context.append({
                "question": q.question,
                "answer": q.answer,
                "score": q.score,
                "question_type": q.question_type,
                "feedback": q.feedback
            })
        
        prompt = f"""
As an expert interviewer, analyze the candidate's performance based on the following interview data:

Question Performance by Type:
{json.dumps(performance_by_type, indent=2)}

Question Details:
{json.dumps(questions_context, indent=2)}

Provide a genuine analysis of the candidate's strengths and weaknesses. Be specific and professional.

Return ONLY a valid JSON object with this exact structure:
{{
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"]
}}
"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.7}
            )
            
            result = response["message"]["content"]
            # Parse JSON response
            analysis = json.loads(result)
            return analysis.get("strengths", []), analysis.get("weaknesses", [])
        except Exception as e:
            print(f"Error using Qwen for strengths/weaknesses: {e}")
            # Fallback to rule-based logic
            strengths = []
            weaknesses = []
            for q_type, perf in performance_by_type.items():
                if perf["percentage"] >= 70:
                    strengths.append(f"Strong performance in {q_type} questions")
                elif perf["percentage"] <= 40:
                    weaknesses.append(f"Needs improvement in {q_type} questions")
            return strengths, weaknesses
    
    def _assess_skills(self, questions: List, resume) -> Dict[str, Any]:
        """Assess technical and professional skills using Qwen AI for genuine analysis"""
        # Prepare context for AI analysis
        questions_context = []
        for q in questions:
            questions_context.append({
                "question": q.question,
                "answer": q.answer,
                "score": q.score,
                "question_type": q.question_type
            })
        
        resume_context = ""
        if resume:
            resume_context = f"""
Resume Analysis:
- Candidate Type: {resume.candidate_type if resume.candidate_type else "Not classified"}
- Classification Details: {resume.classification_details if resume.classification_details else "Not available"}
- Resume Text (first 500 chars): {resume.resume_text[:500] if resume.resume_text else "Not available"}
"""
        
        prompt = f"""
As an expert technical interviewer, assess the candidate's skills based on the interview performance:

{resume_context}

Interview Questions and Answers:
{json.dumps(questions_context, indent=2)}

Provide a genuine assessment of the candidate's skills in three categories:
1. Technical Skills (programming, tools, technologies)
2. Communication Skills (clarity, articulation, listening)
3. Problem Solving (analytical thinking, approach to challenges)

Return ONLY a valid JSON object with this exact structure:
{{
    "technical_skills": ["skill1", "skill2", "skill3"],
    "communication_skills": ["skill1", "skill2", "skill3"],
    "problem_solving": ["skill1", "skill2", "skill3"]
}}
"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.7}
            )
            
            result = response["message"]["content"]
            # Parse JSON response
            assessment = json.loads(result)
            return {
                "technical_skills": assessment.get("technical_skills", []),
                "communication_skills": assessment.get("communication_skills", []),
                "problem_solving": assessment.get("problem_solving", [])
            }
        except Exception as e:
            print(f"Error using Qwen for skill assessment: {e}")
            # Fallback to rule-based logic
            skill_assessment = {
                "technical_skills": [],
                "communication_skills": [],
                "problem_solving": []
            }
            tech_questions = [q for q in questions if q.question_type == "technical"]
            if tech_questions:
                avg_tech_score = sum(q.score for q in tech_questions if q.score) / len(tech_questions)
                if avg_tech_score >= 7.0:
                    skill_assessment["technical_skills"].append("Strong technical knowledge")
                elif avg_tech_score >= 5.0:
                    skill_assessment["technical_skills"].append("Good technical foundation")
                else:
                    skill_assessment["technical_skills"].append("Technical skills need development")
            return skill_assessment
    
    def _assess_behavior(self, questions: List, resume) -> Dict[str, Any]:
        """Assess behavioral traits and cultural fit using Qwen AI for genuine analysis"""
        # Prepare context for AI analysis
        questions_context = []
        for q in questions:
            questions_context.append({
                "question": q.question,
                "answer": q.answer,
                "score": q.score,
                "question_type": q.question_type
            })
        
        resume_context = ""
        if resume:
            resume_context = f"""
Resume Analysis:
- Candidate Type: {resume.candidate_type if resume.candidate_type else "Not classified"}
"""
        
        prompt = f"""
As an expert HR interviewer, assess the candidate's behavioral traits and cultural fit based on interview performance:

{resume_context}

Interview Questions and Answers:
{json.dumps(questions_context, indent=2)}

Provide a genuine assessment of the candidate's behavioral traits in four categories:
1. Teamwork (collaboration, cooperation, team dynamics)
2. Leadership (initiative, guiding others, decision-making)
3. Adaptability (flexibility, learning, handling change)
4. Communication (verbal, written, listening skills)

Return ONLY a valid JSON object with this exact structure:
{{
    "teamwork": "assessment text",
    "leadership": "assessment text",
    "adaptability": "assessment text",
    "communication": "assessment text"
}}
"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.7}
            )
            
            result = response["message"]["content"]
            # Parse JSON response
            assessment = json.loads(result)
            return {
                "teamwork": assessment.get("teamwork", "Not assessed"),
                "leadership": assessment.get("leadership", "Not assessed"),
                "adaptability": assessment.get("adaptability", "Not assessed"),
                "communication": assessment.get("communication", "Not assessed")
            }
        except Exception as e:
            print(f"Error using Qwen for behavioral assessment: {e}")
            # Fallback to rule-based logic
            behavioral_assessment = {
                "teamwork": "Not assessed",
                "leadership": "Not assessed",
                "adaptability": "Not assessed",
                "communication": "Not assessed"
            }
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
            return behavioral_assessment
    
    def _generate_recommendations(self, average_score: float, strengths: List, weaknesses: List) -> List[str]:
        """Generate personalized recommendations using Qwen AI for genuine analysis"""
        prompt = f"""
As an expert hiring manager, provide genuine recommendations for this candidate based on their interview performance:

Overall Score: {average_score}/10

Strengths:
{json.dumps(strengths, indent=2)}

Weaknesses:
{json.dumps(weaknesses, indent=2)}

Provide 3-5 specific, actionable recommendations for:
1. Whether to hire the candidate and at what level
2. Any training or development needed
3. Specific areas for improvement
4. Next steps for the hiring process

Return ONLY a valid JSON object with this exact structure:
{{
    "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"]
}}
"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.7}
            )

            result = response["message"]["content"]
            # Parse JSON response
            recommendations_data = json.loads(result)
            return recommendations_data.get("recommendations", [])
        except Exception as e:
            print(f"Error using Qwen for recommendations: {e}")
            # Fallback to rule-based logic
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
            return recommendations
    
    def _generate_detailed_feedback(self, questions: List, interview) -> str:
        """Generate detailed feedback summary using Qwen AI for genuine analysis"""
        # Prepare context for AI analysis
        questions_context = []
        for q in questions:
            questions_context.append({
                "question": q.question,
                "answer": q.answer,
                "score": q.score,
                "max_score": q.max_score,
                "feedback": q.feedback,
                "question_type": q.question_type
            })
        
        prompt = f"""
As an expert interviewer, provide a comprehensive and genuine detailed feedback report for this candidate:

Position: {interview.job_role} at {interview.company}
Total Questions: {len(questions)}

Question Details:
{json.dumps(questions_context, indent=2)}

Provide a detailed feedback summary that includes:
1. Overall performance assessment
2. Specific feedback on each question
3. Areas where the candidate excelled
4. Areas that need improvement
5. Specific examples from their answers

Return ONLY a valid JSON object with this exact structure:
{{
    "detailed_feedback": "comprehensive feedback text here"
}}
"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.7}
            )

            result = response["message"]["content"]
            # Parse JSON response
            feedback_data = json.loads(result)
            return feedback_data.get("detailed_feedback", "Unable to generate detailed feedback")
        except Exception as e:
            print(f"Error using Qwen for detailed feedback: {e}")
            # Fallback to rule-based logic
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
