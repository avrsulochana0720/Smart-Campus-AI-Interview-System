import os
from typing import List, Dict, Any
import re
import json
from dotenv import load_dotenv

try:
    from ollama_helper import request_ollama
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from ollama_helper import request_ollama

# Load environment variables
load_dotenv()

# Ollama configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

class QuestionGenerator:
    def __init__(self):
        self.model = OLLAMA_MODEL
    
    def extract_resume_skills(self, resume_text: str) -> List[str]:
        """
        Extract key skills, technologies, and keywords from resume text.
        """
        # Common tech keywords
        tech_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js', 'django', 'flask',
            'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes',
            'aws', 'azure', 'gcp', 'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch',
            'git', 'ci/cd', 'agile', 'scrum', 'rest api', 'graphql', 'microservices',
            'html', 'css', 'typescript', 'c++', 'c#', '.net', 'spring boot', 'hibernate'
        ]
        
        found_skills = []
        resume_lower = resume_text.lower()
        
        for keyword in tech_keywords:
            if keyword.lower() in resume_lower:
                found_skills.append(keyword)
        
        return list(set(found_skills))
    
    def generate_ai_questions(
        self, 
        resume_text: str, 
        job_role: str, 
        company: str, 
        experience_level: str = "mid",
        phase: str = "hr",
        existing_questions: List[str] = None
    ) -> List[Dict]:
        """
        Generate interview questions using Ollama (Qwen).
        Tailors questions based on Job Role, Company, and Resume Analysis.
        """
        skills = self.extract_resume_skills(resume_text)
        skills_str = ", ".join(skills) if skills else "various technologies"
        
        # Limit resume text to avoid prompt overflow but keep essential info
        resume_context = resume_text[:2000] if resume_text else "No resume content provided."
        
        if phase == "hr":
            prompt = f"""
As an AI HR Interviewer, generate 5 professional behavioral and HR questions for a candidate applying for the {job_role} position at {company}.
The candidate's resume context is: {resume_context}

Focus on:
1. Introduction and motivation for {job_role} at {company}.
2. Relevant experiences and projects mentioned in the resume.
3. Soft skills (leadership, teamwork, or communication) tailored to a {job_role}.
4. Culture fit for {company}.
5. Career goals and future growth.

Requirements:
- Generate exactly 5 questions.
- Questions should NOT be in this list: {existing_questions if existing_questions else "None"}
- Return ONLY a valid JSON object.

Exact Structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "type": "hr",
            "difficulty": "medium"
        }}
    ]
}}
"""
        else:
            prompt = f"""
As an AI Technical Interviewer, generate 5 deep technical and scenario-based questions for a {job_role} position at {company}.
Analyze the candidate's resume and expertise:
Resume Context: {resume_context}
Identified Skills: {skills_str}

Focus on:
1. Core technical fundamentals relevant to {job_role} and candidate's projects.
2. Real-world problem-solving scenarios based on the candidate's experience.
3. System design or edge cases related to {skills_str}.
4. Optimization and performance in the context of {job_role}.
5. Emerging trends or specific tools mentioned in the resume.

Requirements:
- Generate exactly 5 questions.
- Questions should NOT be in this list: {existing_questions if existing_questions else "None"}
- Return ONLY a valid JSON object.

Exact Structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "type": "technical",
            "difficulty": "hard"
        }}
    ]
}}
"""
        
        try:
            content = request_ollama(prompt)
            content = content.strip()
            
            # Clean up JSON response
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            
            # Try to find the JSON object if there's extra text
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            result = json.loads(content)
            questions = result.get("questions", [])
            print("\n" + "="*80)
            print(f"[AI SERVICE GENERATED QUESTIONS - {phase.upper()} PHASE]")
            for i, q in enumerate(questions):
                print(f"  Q{i+1}: {q.get('question')}")
            print("="*80 + "\n")
            return questions
            
        except Exception as e:
            print(f"Error generating questions with Ollama: {e}")
            raise e

class AnswerEvaluator:
    def __init__(self):
        self.model = OLLAMA_MODEL
    
    def evaluate_answer(
        self,
        question: str,
        user_answer: str,
        job_role: str,
        company: str,
        resume_summary: str = ""
    ) -> Dict:
        """
        Evaluate user answer using Ollama (Qwen).
        Uses Job Role, Company, and Resume context for evaluation.
        """
        prompt = f"""
As an expert technical interviewer for {company}, evaluate the candidate's response for the {job_role} position.
The candidate's resume summary/context: {resume_summary[:1000]}

Question: {question}
Answer: {user_answer}

Evaluation Criteria:
1. Accuracy: Is the answer technically correct?
2. Completeness: Did the candidate cover all parts of the question?
3. Contextual Relevance: Does it align with the {job_role} role at {company}?
4. Resume Alignment: Does the answer reflect the skills mentioned in their resume?

Return ONLY a valid JSON object with this exact structure:
{{
  "score": (integer from 0 to 10),
  "feedback": "Concise technical feedback (max 2 sentences)",
  "next_question": "A follow-up or next logical interview question based on the candidate's performance"
}}
"""
        
        try:
            content = request_ollama(prompt)
            content = content.strip()
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            result = json.loads(content)
            return {
                "score": result.get("score", 5),
                "feedback": result.get("feedback", "Completed"),
                "next_question": result.get("next_question", "Next question")
            }
            
        except Exception as e:
            print(f"Error evaluating answer with Ollama: {e}")
            return {"score": 5, "feedback": "Answer recorded.", "next_question": "Continue"}

    def evaluate_template_answer(
        self,
        question: str,
        user_answer: str,
        job_role: str,
        company: str
    ) -> Dict:
        """
        Fallback evaluation when AI fails.
        """
        # Simple length-based scoring for fallback
        score = min(len(user_answer.split()) // 5 + 3, 8)
        return {
            "score": score,
            "feedback": "Answer analyzed based on length and relevance to job role.",
            "next_question": f"Based on your experience, how would you handle a complex project in {job_role}?"
        }

    def generate_narrative_summary(
        self,
        job_role: str,
        company: str,
        qa_data: List[Dict]
    ) -> str:
        """
        Generate a narrative report summary based on all answers.
        """
        qa_summary = ""
        for i, qa in enumerate(qa_data):
            qa_summary += f"Q{i+1}: {qa['question']}\nA: {qa['answer']}\nScore: {qa['score']}/10\n\n"
        
        prompt = f"""
Based on the following interview transcript for the {job_role} position at {company}, 
write a concise narrative summary (2-3 paragraphs) of the candidate's performance, 
strengths, and areas for improvement.

Interview Data:
{qa_summary}

Summary:
"""
        
        try:
            content = request_ollama(prompt)
            content = content.strip()
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            return content
        except Exception as e:
            print(f"Error generating summary with Ollama: {e}")
            return "Narrative summary unavailable."

    def generate_interview_report(
        self,
        job_role: str,
        company: str,
        qa_data: List[Dict],
        resume_text: str = ""
    ) -> Dict:
        """
        Generate a comprehensive interview performance report using the same Qwen model.
        Uses all saved answers from the database to create a detailed assessment.
        
        Args:
            job_role: The job position being interviewed for
            company: The company conducting the interview
            qa_data: List of dicts with 'question', 'answer', 'score', 'feedback' keys
            resume_text: Candidate's resume text for context
        
        Returns:
            Dict with narrative_summary, average_score, and other metrics
        """
        if not qa_data:
            return {
                "narrative_summary": "No interview data available to generate report.",
                "average_score": 0,
                "total_questions": 0,
                "answered_questions": 0
            }
        
        # Calculate metrics
        total_questions = len(qa_data)
        answered_questions = sum(1 for qa in qa_data if qa.get('answer') and qa['answer'] != "Not answered")
        average_score = sum(qa.get('score', 0) for qa in qa_data) / total_questions if total_questions > 0 else 0
        
        # Build comprehensive QA summary for the prompt
        qa_summary = ""
        for i, qa in enumerate(qa_data):
            qa_summary += f"Q{i+1} ({qa.get('question_type', 'general')}): {qa['question']}\n"
            qa_summary += f"Answer: {qa['answer'] if qa['answer'] != 'Not answered' else 'Not answered'}\n"
            qa_summary += f"Score: {qa.get('score', 0)}/10\n"
            if qa.get('feedback'):
                qa_summary += f"Feedback: {qa['feedback']}\n"
            qa_summary += "\n"
        
        # Build resume context (limited to avoid token overflow)
        resume_context = resume_text[:1500] if resume_text else "No resume provided"
        
        # Create comprehensive prompt for report generation
        prompt = f"""You are an expert HR and technical interviewer generating a comprehensive interview report.

INTERVIEW DETAILS:
Position: {job_role}
Company: {company}
Total Questions Asked: {total_questions}
Questions Answered: {answered_questions}
Average Score: {average_score:.1f}/10

CANDIDATE RESUME SUMMARY:
{resume_context}

INTERVIEW TRANSCRIPT AND SCORES:
{qa_summary}

Based on the interview data above, generate a professional interview performance report. The report should include:

1. OVERALL ASSESSMENT: A 2-3 sentence summary of the candidate's overall performance
2. STRENGTHS: Key strengths demonstrated during the interview (2-3 points)
3. AREAS FOR IMPROVEMENT: Constructive feedback on areas to develop (2-3 points)
4. TECHNICAL COMPETENCY: Assessment of technical skills if applicable (1-2 sentences)
5. SOFT SKILLS: Assessment of communication, problem-solving, and interpersonal skills (1-2 sentences)
6. RECOMMENDATION: Hiring recommendation with brief reasoning (1-2 sentences)

Format the response as a professional report with clear sections. Be specific and reference examples from the interview answers."""
        
        try:
            content = request_ollama(prompt)
            narrative = content.strip()
            narrative = re.sub(r'<think>.*?</think>', '', narrative, flags=re.DOTALL)
            
            return {
                "narrative_summary": narrative,
                "average_score": int(average_score),
                "total_questions": total_questions,
                "answered_questions": answered_questions,
                "status": "completed"
            }
            
        except Exception as e:
            print(f"Error generating interview report with Ollama: {e}")
            return {
                "narrative_summary": "Interview report could not be generated at this time. Please try again later.",
                "average_score": int(average_score),
                "total_questions": total_questions,
                "answered_questions": answered_questions,
                "status": "failed"
            }

# Singleton instances
question_generator = QuestionGenerator()
answer_evaluator = AnswerEvaluator()
