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
    from ollama_helper import request_ollama
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from ollama_helper import request_ollama

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
            content = request_ollama(prompt)
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
            print(f"[ResumeAgent] Ollama analysis error: {e}")
            return {
                "experience_level": "mid",
                "strengths": skills[:3] if skills else ["General knowledge"],
                "gaps": [],
                "readiness_score": 5,
                "summary": "Resume analysis could not be completed via AI. Skills extracted via keyword matching."
            }

    def summarize_resume(self, resume_text: str) -> Dict[str, str]:
        """Generate short resume insights for impact, motive, and system fit."""
        resume_context = resume_text[:2500] if resume_text else "No resume content."
        skills = self.extract_skills(resume_text)
        skills_str = ", ".join(skills) if skills else "not identified"

        prompt = f"""You are an expert resume analyst. Read the resume text and return a JSON object with the following fields:
        {{
            "impact": "A short sentence describing the candidate's strongest achievement or impact.",
            "motive": "A short sentence describing what motivates the candidate and career focus.",
            "system": "A short sentence describing the systems, technical strengths, or operational domain the candidate excels in."
        }}

Resume Text:
{resume_context}

Identified Skills: {skills_str}

Return only valid JSON with keys 'impact', 'motive', and 'system'."""

        # Bypassing the slow LLM call to return immediate output as requested by the user.
        return {
            "impact": f"Key skills identified: {skills_str}.",
            "motive": "Driven by building strong, scalable solutions and advancing technical impact.",
            "system": f"Strong in {skills_str if skills_str != 'not identified' else 'core technical domains'}."
        }
    def extract_personal_info(self, resume_text: str) -> Dict:
        """Extract personal details and structural sections from the resume text using regex and heuristics."""
        if not resume_text:
            return {
                "name": "Not Found",
                "email": "Not Found",
                "phone_number": "Not Found",
                "skills": [],
                "education": [],
                "projects": [],
                "experience": [],
                "certifications": []
            }

        try:
            # 1. Email extraction
            email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
            emails = re.findall(email_pattern, resume_text)
            email = emails[0] if emails else "Not Found"

            # 2. Phone number extraction
            phone_pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12}'
            phones = re.findall(phone_pattern, resume_text)
            phone = phones[0] if phones else "Not Found"

            # Clean and prepare lines
            lines = [line.strip() for line in resume_text.split('\n') if line.strip()]

            # 3. Name extraction heuristic
            name = "Not Found"
            for line in lines[:8]:
                # Skip if matches email or phone pattern, or has website links
                if '@' in line or 'http' in line or 'www.' in line or '.com' in line:
                    continue
                # Skip if has digits (usually phone or address)
                if any(char.isdigit() for char in line):
                    continue
                lower_line = line.lower()
                # Skip section headers or metadata
                if any(h in lower_line for h in ["resume", "cv", "curriculum vitae", "contact", "email", "phone", "summary", "profile", "education", "experience", "skills", "page"]):
                    continue
                # Check words
                words = line.split()
                if 1 <= len(words) <= 4:
                    # Clean up line (e.g. strip special characters at start/end)
                    clean_name = re.sub(r'^[^a-zA-Z]+|[^a-zA-Z]+$', '', line).strip()
                    if clean_name:
                        name = clean_name
                        break

            # 4. Skills extraction (reuse existing technical keywords)
            skills = self.extract_skills(resume_text)

            # 5. Education extraction heuristic
            education = []
            edu_keywords = ["university", "college", "institute", "school", "bachelor", "master", "degree", "ph.d", "b.tech", "b.e.", "m.tech", "bca", "mca", "b.sc", "m.sc", "diploma", "high school", "academy"]
            for line in lines:
                if any(kw in line.lower() for kw in edu_keywords):
                    cleaned = line.strip()
                    cleaned = re.sub(r'^[•▪►\*\-+0-9.\s]+', '', cleaned).strip()
                    if 5 < len(cleaned) < 120 and cleaned not in education:
                        education.append(cleaned)
            education = education[:4]

            # 6. Projects extraction heuristic
            projects = []
            project_keywords = ["project", "github.com", "portfolio", "capstone", "built a", "developed a", "designed a", "application using"]
            for line in lines:
                if any(kw in line.lower() for kw in project_keywords):
                    lower_line = line.lower().strip()
                    if lower_line in ["projects", "personal projects", "academic projects", "key projects", "my projects"]:
                        continue
                    cleaned = line.strip()
                    cleaned = re.sub(r'^[•▪►\*\-+0-9.\s]+', '', cleaned).strip()
                    if 10 < len(cleaned) < 150 and cleaned not in projects:
                        projects.append(cleaned)
            projects = projects[:4]

            # 7. Experience extraction heuristic
            experience = []
            exp_keywords = ["developer", "engineer", "intern", "analyst", "manager", "lead", "consultant", "architect", "specialist", "years of experience", "work experience", "employment history", "professional experience"]
            for line in lines:
                if any(kw in line.lower() for kw in exp_keywords):
                    lower_line = line.lower().strip()
                    if lower_line in ["experience", "work experience", "professional experience", "employment history"]:
                        continue
                    cleaned = line.strip()
                    cleaned = re.sub(r'^[•▪►\*\-+0-9.\s]+', '', cleaned).strip()
                    if 10 < len(cleaned) < 150 and cleaned not in experience:
                        experience.append(cleaned)
            experience = experience[:4]

            # 8. Certifications extraction heuristic
            certifications = []
            cert_keywords = ["certified", "certification", "aws certified", "microsoft certified", "coursera", "udemy", "certificate", "license"]
            for line in lines:
                if any(kw in line.lower() for kw in cert_keywords):
                    lower_line = line.lower().strip()
                    if lower_line in ["certifications", "licenses", "certificates"]:
                        continue
                    cleaned = line.strip()
                    cleaned = re.sub(r'^[•▪►\*\-+0-9.\s]+', '', cleaned).strip()
                    if 8 < len(cleaned) < 150 and cleaned not in certifications:
                        certifications.append(cleaned)
            certifications = certifications[:4]

            return {
                "name": name,
                "email": email,
                "phone_number": phone,
                "skills": skills,
                "education": education,
                "projects": projects,
                "experience": experience,
                "certifications": certifications
            }
        except Exception as e:
            print(f"[ResumeAgent] Fast info extraction error: {e}")
            return {
                "name": "Not Found",
                "email": "Not Found",
                "phone_number": "Not Found",
                "skills": [],
                "education": [],
                "projects": [],
                "experience": [],
                "certifications": []
            }


# Singleton
resume_agent = ResumeAgent()
