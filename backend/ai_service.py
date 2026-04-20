from openai import OpenAI
import os
from typing import List, Dict
import re

# Set OpenAI API key (should be set as environment variable)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "your-openai-api-key-here"))

class QuestionGenerator:
    def __init__(self):
        self.client = client
    
    def extract_resume_skills(self, resume_text: str) -> List[str]:
        """
        Extract key skills, technologies, and keywords from resume text.
        This is a simple keyword extraction - can be enhanced with NLP.
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
        Generate interview questions using OpenAI API.
        """
        # Extract skills from resume
        skills = self.extract_resume_skills(resume_text)
        skills_str = ", ".join(skills) if skills else "various technologies"
        
        # Construct prompt
        prompt = f"""
Generate 5-10 interview questions for a {job_role} candidate applying to {company}.
Candidate's skills and experience: {skills_str}
Experience level: {experience_level}

Generate a mix of:
1. Technical questions
2. Scenario-based questions
3. Behavioral questions

Return the response in the following JSON format only (no markdown, no extra text):
{{
    "questions": [
        {{
            "question": "Question text here",
            "type": "technical/behavioral/scenario",
            "difficulty": "easy/medium/hard"
        }}
    ]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert technical interviewer. Generate interview questions in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            # Parse response
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            
            import json
            result = json.loads(content)
            
            return result.get("questions", [])
            
        except Exception as e:
            print(f"Error generating questions with OpenAI: {e}")
            # Fallback to template-based questions if AI fails
            return self.generate_template_questions(job_role, company, skills, experience_level)
    
    def generate_template_questions(
        self, 
        job_role: str, 
        company: str, 
        skills: List[str],
        experience_level: str = "mid"
    ) -> List[Dict]:
        """
        Fallback template-based question generation when AI is unavailable.
        """
        questions = []
        
        # Technical questions based on job role
        if "python" in " ".join(skills).lower() or "developer" in job_role.lower():
            questions.append({
                "question": "Explain the difference between list and tuple in Python",
                "type": "technical",
                "difficulty": "easy"
            })
            questions.append({
                "question": "How do you handle memory management in Python?",
                "type": "technical",
                "difficulty": "medium"
            })
        
        if "react" in " ".join(skills).lower() or "frontend" in job_role.lower():
            questions.append({
                "question": "Explain the difference between useEffect and useLayoutEffect in React",
                "type": "technical",
                "difficulty": "medium"
            })
            questions.append({
                "question": "How do you optimize React component performance?",
                "type": "technical",
                "difficulty": "hard"
            })
        
        # Scenario-based questions
        questions.append({
            "question": f"Describe a challenging technical problem you solved and your approach",
            "type": "scenario",
            "difficulty": "medium"
        })
        
        # Behavioral questions
        questions.append({
            "question": "How do you handle tight deadlines and pressure in a project?",
            "type": "behavioral",
            "difficulty": "easy"
        })
        questions.append({
            "question": f"Why do you want to work at {company}?",
            "type": "behavioral",
            "difficulty": "easy"
        })
        
        # Adjust difficulty based on experience level
        if experience_level == "senior":
            questions.append({
                "question": "How would you architect a scalable system for this role?",
                "type": "scenario",
                "difficulty": "hard"
            })
        
        return questions[:10]  # Return max 10 questions

class AnswerEvaluator:
    def __init__(self):
        self.client = client
    
    def evaluate_answer(
        self,
        question: str,
        user_answer: str,
        job_role: str,
        company: str,
        resume_summary: str = ""
    ) -> Dict:
        """
        Evaluate user answer using AI and generate next question.
        """
        # Construct prompt
        prompt = f"""
You are an AI Interview Evaluator for a technical interview system.

Context:
- The user is attending an AI-driven interview.
- Questions are generated based on the user's resume, selected job role, and company.
- The user has submitted an answer to the current question.

Your tasks:

1. Evaluate the user's answer strictly based on:
   - Technical accuracy
   - Completeness
   - Clarity
   - Relevance to the question

2. Give a score out of 10.

3. Provide short, constructive feedback:
   - What is good
   - What is missing
   - How to improve

4. If the answer is completely wrong or irrelevant, clearly mention it.

5. Based on the performance, generate the NEXT question:
   - If score >= 7 → slightly harder question
   - If score between 4–6 → same level question
   - If score < 4 → easier/basic question

6. Keep questions aligned with:
   - Candidate resume
   - Selected job role
   - Company standards (if provided)

7. Response MUST be in JSON format:

{{
  "score": <number>,
  "feedback": "<short feedback>",
  "next_question": "<next interview question>"
}}

Inputs:
Question: {question}
User Answer: {user_answer}
Job Role: {job_role}
Company: {company}
Resume Summary: {resume_summary}

Be strict like a real interviewer. Do not give high scores for average answers.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert technical interviewer. Evaluate answers strictly and provide feedback in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse response
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            
            import json
            result = json.loads(content)
            
            return {
                "score": result.get("score", 5),
                "feedback": result.get("feedback", "Average answer"),
                "next_question": result.get("next_question", "Tell me more about your experience")
            }
            
        except Exception as e:
            print(f"Error evaluating answer with OpenAI: {e}")
            # Fallback to template-based evaluation
            return self.evaluate_template_answer(question, user_answer, job_role, company)
    
    def evaluate_template_answer(
        self,
        question: str,
        user_answer: str,
        job_role: str,
        company: str
    ) -> Dict:
        """
        Fallback template-based answer evaluation when AI is unavailable.
        """
        # Simple heuristic evaluation
        answer_length = len(user_answer.split())
        
        if answer_length < 10:
            score = 3
            feedback = "Answer is too short. Provide more details and explanation."
        elif answer_length < 30:
            score = 5
            feedback = "Answer is brief. Try to provide more context and examples."
        else:
            score = 7
            feedback = "Good answer with reasonable detail."
        
        # Generate template next question
        next_questions = [
            f"What is your experience with {job_role}?",
            f"How would you handle a challenging project at {company}?",
            "Describe your approach to problem-solving.",
            f"What technical challenges have you faced in {job_role}?"
        ]
        
        # Select next question based on score
        if score >= 7:
            next_question = f"How would you optimize performance in a {job_role} project?"
        elif score >= 4:
            next_question = next_questions[len(question) % len(next_questions)]
        else:
            next_question = "Can you explain the basics of this topic in more detail?"
        
        return {
            "score": score,
            "feedback": feedback,
            "next_question": next_question
        }

# Singleton instances
question_generator = QuestionGenerator()
answer_evaluator = AnswerEvaluator()
