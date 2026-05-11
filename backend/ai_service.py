import ollama
import os
from typing import List, Dict, Any
import re
import json
from dotenv import load_dotenv

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
        Generate interview questions using Ollama (Qwen3-0.6B).
        """
        skills = self.extract_resume_skills(resume_text)
        skills_str = ", ".join(skills) if skills else "various technologies"
        
        if phase == "hr":
            prompt = f"""
As an AI HR Interviewer, generate 5 professional behavioral and HR questions for a {job_role} position at {company}.
Focus on:
1. Introduction and motivation.
2. Soft skills (leadership, teamwork, or communication).
3. Culture fit for {company}.
4. Conflict resolution and problem-solving in teams.
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
Candidate Skills: {skills_str}

Focus on:
1. Core technical fundamentals of {skills_str}.
2. Problem-solving scenarios.
3. System design or edge cases.
4. Performance optimization.
5. Security or scalability.

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
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={'temperature': 0.7}
            )
            
            content = response['response'].strip()
            
            # Clean up JSON response
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            
            # Try to find the JSON object if there's extra text
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            
            result = json.loads(content)
            return result.get("questions", [])
            
        except Exception as e:
            print(f"Error generating questions with Ollama ({self.model}): {e}")
            return self.generate_template_questions(job_role, company, skills, experience_level, phase)
    
    def generate_template_questions(self, job_role, company, skills, experience_level, phase="hr"):
        if phase == "hr":
            return [
                {"question": f"Tell me about yourself and why you want to join {company} as a {job_role}.", "type": "hr", "difficulty": "easy"},
                {"question": "What is your biggest professional achievement so far?", "type": "hr", "difficulty": "medium"},
                {"question": f"How do you handle conflict in a team environment at {company}?", "type": "hr", "difficulty": "medium"},
                {"question": "Describe a time you showed leadership in a project.", "type": "hr", "difficulty": "medium"},
                {"question": f"Where do you see yourself in five years with {company}?", "type": "hr", "difficulty": "medium"}
            ]
        else:
            return [
                {"question": f"Explain the core architecture of a project you built using {skills[0] if skills else 'your main stack'}.", "type": "technical", "difficulty": "hard"},
                {"question": "How do you ensure code quality and performance in your applications?", "type": "technical", "difficulty": "hard"},
                {"question": f"Describe a complex technical problem you solved as a {job_role}.", "type": "technical", "difficulty": "hard"},
                {"question": f"What are the trade-offs of using {skills[1] if len(skills) > 1 else 'microservices'}?", "type": "technical", "difficulty": "hard"},
                {"question": "How would you optimize a database query that is running extremely slow in production?", "type": "technical", "difficulty": "hard"}
            ]

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
        Evaluate user answer using Ollama (Qwen3-0.6B).
        """
        prompt = f"""
As an expert technical interviewer for {company}, evaluate the candidate's response for the {job_role} position.
Question: {question}
Answer: {user_answer}
Job Context: {job_role} at {company}

Evaluate based on accuracy, completeness, and relevance.
If the answer is poor, provide constructive feedback and a slightly easier follow-up question.
If the answer is excellent, provide praise and a more challenging/deep-dive follow-up question.

Return ONLY a valid JSON object with this exact structure:
{{
  "score": (integer from 0 to 10),
  "feedback": "Concise technical feedback (max 2 sentences)",
  "next_question": "A follow-up or next logical interview question based on the candidate's performance"
}}
"""
        
        try:
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={'temperature': 0.3}
            )
            
            content = response['response'].strip()
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            
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
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={'temperature': 0.5}
            )
            
            return response['response'].strip()
        except Exception as e:
            print(f"Error generating summary with Ollama: {e}")
            return "Narrative summary unavailable."

# Singleton instances
question_generator = QuestionGenerator()
answer_evaluator = AnswerEvaluator()
