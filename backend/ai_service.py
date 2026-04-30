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
        experience_level: str = "mid"
    ) -> List[Dict]:
        """
        Generate interview questions using Ollama (Qwen3-0.6B).
        """
        skills = self.extract_resume_skills(resume_text)
        skills_str = ", ".join(skills) if skills else "various technologies"
        
        prompt = f"""
As an AI Interview Architect, generate 5 highly relevant interview questions for a {job_role} position at {company}.
Candidate Skills: {skills_str}
Seniority Level: {experience_level}

Requirements:
1. Question 1-2: Core technical fundamentals related to {skills_str}.
2. Question 3: A scenario-based problem solving question.
3. Question 4: A behavioral/culture-fit question specific to {company}.
4. Question 5: An advanced/edge-case technical challenge.

Return ONLY a valid JSON object with this exact structure:
{{
    "questions": [
        {{
            "question": "Clear and concise question text",
            "type": "technical/scenario/behavioral",
            "difficulty": "easy/medium/hard"
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
            return self.generate_template_questions(job_role, company, skills, experience_level)
    
    def generate_template_questions(self, job_role, company, skills, experience_level):
        # ... (same as before)
        questions = [
            {"question": f"Explain your experience with {job_role} and {', '.join(skills[:3])}.", "type": "technical", "difficulty": "medium"},
            {"question": f"How would you contribute to the team at {company}?", "type": "behavioral", "difficulty": "easy"},
            {"question": "Describe a difficult technical challenge you faced.", "type": "scenario", "difficulty": "hard"},
            {"question": f"What are the best practices for {skills[0] if skills else 'software development'}?", "type": "technical", "difficulty": "medium"},
            {"question": f"Why are you interested in this position at {company}?", "type": "behavioral", "difficulty": "easy"}
        ]
        return questions

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
