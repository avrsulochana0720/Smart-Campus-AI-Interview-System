"""
resume_agent.py — PDF → text → Qwen analysis
Handles resume upload, PDF text extraction, and AI-powered resume analysis.
"""
import os
import re
import json
import PyPDF2
from typing import Dict, List
from dotenv import load_dotenv

try:
    from gemini_helper import request_gemini
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from gemini_helper import request_gemini

load_dotenv()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")


class ResumeAgent:
    def __init__(self):
        self.model = OLLAMA_MODEL

    # ── PDF → Text ────────────────────────────────────
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract raw text from a PDF file."""
        text = ""
        try:
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() or ""
        except Exception as e:
            print(f"[ResumeAgent] PDF extraction error: {e}")
        return text.strip()

    def extract_text_from_file(self, file_path: str, filename: str) -> str:
        """Extract text from any supported file (PDF or plain text)."""
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        if ext == 'pdf':
            return self.extract_text_from_pdf(file_path)
        else:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except Exception as e:
                print(f"[ResumeAgent] Text read error: {e}")
                return ""

    # ── Skill Extraction ──────────────────────────────
    def extract_skills(self, resume_text: str) -> List[str]:
        """Extract key technical skills from resume text."""
        tech_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'django', 'flask', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'machine learning',
            'ai', 'data science', 'tensorflow', 'pytorch', 'git', 'ci/cd',
            'agile', 'scrum', 'rest api', 'graphql', 'microservices',
            'html', 'css', 'typescript', 'c++', 'c#', '.net', 'spring boot',
            'hibernate', 'nextjs', 'express', 'fastapi', 'linux', 'devops',
            'pandas', 'numpy', 'scikit-learn', 'nlp', 'deep learning',
            'computer vision', 'selenium', 'jenkins', 'terraform'
        ]
        resume_lower = resume_text.lower()
        found = list(set(kw for kw in tech_keywords if kw in resume_lower))
        return found

    # ── Qwen Analysis ─────────────────────────────────
    def analyze_resume(self, resume_text: str, job_role: str, company: str) -> Dict:
        """
        Use Qwen to deeply analyze the resume:
        - Extract key strengths
        - Identify experience level
        - Flag gaps relative to job role
        """
        resume_context = resume_text[:2500] if resume_text else "No resume content."
        skills = self.extract_skills(resume_text)
        skills_str = ", ".join(skills) if skills else "not identified"

        prompt = f"""You are an expert resume analyst. Analyze this resume for the {job_role} position at {company}.

Resume Text:
{resume_context}

Identified Skills: {skills_str}

Provide a structured analysis with:
1. Experience level (fresher / mid / senior)
2. Key strengths relevant to {job_role}
3. Skill gaps for the {job_role} role at {company}
4. Overall readiness score (1-10)

Return ONLY a valid JSON object:
{{
    "experience_level": "mid",
    "strengths": ["strength1", "strength2", "strength3"],
    "gaps": ["gap1", "gap2"],
    "readiness_score": 7,
    "summary": "2-3 sentence professional summary"
}}"""

        try:
            content = request_gemini(prompt)
            content = content.strip()
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
            # Extract JSON
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            return json.loads(content)
        except Exception as e:
            print(f"[ResumeAgent] Gemini analysis error: {e}")
            return {
                "experience_level": "mid",
                "strengths": skills[:3] if skills else ["General knowledge"],
                "gaps": [],
                "readiness_score": 5,
                "summary": "Resume analysis could not be completed via AI. Skills extracted via keyword matching."
            }


# Singleton
resume_agent = ResumeAgent()
