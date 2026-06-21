"""
question_agent.py — Dynamic, Personalized Interview Question Generator
Generates truly unique questions based on:
  - Candidate resume (skills, projects, experience level, domain)
  - Job role requirements
  - Company-specific expectations
  - RAG-retrieved JSON/PDF knowledge context
"""
import os
import re
import json
import time
from typing import List, Dict
from dotenv import load_dotenv
from metrics import record_metric

try:
    from ollama_helper import request_ollama
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from ollama_helper import request_ollama

load_dotenv()

# ── Company-specific interview focus areas ──────────────────────────
COMPANY_PROFILES = {
    "google": "System design, scalability, algorithms, data structures, innovation, Googleyness (collaboration, intellectual humility)",
    "amazon": "Leadership Principles (Customer Obsession, Ownership, Bias for Action), system design, operational excellence, scalability",
    "microsoft": "Problem-solving, coding fundamentals, system design, growth mindset, collaboration, cloud (Azure)",
    "meta": "Move fast, social impact at scale, distributed systems, mobile-first thinking, data-driven decisions",
    "facebook": "Move fast, social impact at scale, distributed systems, mobile-first thinking, data-driven decisions",
    "apple": "Attention to detail, user experience, hardware-software integration, privacy-first design, craftsmanship",
    "netflix": "Freedom and responsibility, innovation, streaming architecture, microservices, A/B testing culture",
    "uber": "Real-time systems, geospatial data, marketplace dynamics, reliability engineering, mobile platforms",
    "twitter": "Real-time data processing, distributed systems, content moderation, API design at scale",
    "linkedin": "Professional networking, data engineering, search/recommendation systems, growth engineering",
    "salesforce": "CRM domain, multi-tenant architecture, Apex/Lightning, enterprise SaaS, customer success",
    "tcs": "Enterprise solutions, agile delivery, client management, cross-functional collaboration, quality processes",
    "infosys": "Digital transformation, consulting mindset, agile methodology, client-facing communication, continuous learning",
    "wipro": "IT services, quality assurance, project delivery, domain expertise, global team collaboration",
    "accenture": "Consulting, digital transformation, cloud migration, client management, industry-specific solutions",
    "cognizant": "Digital engineering, SDLC, quality-first development, client delivery, cross-team collaboration",
    "deloitte": "Consulting, analytics, risk management, strategic thinking, cross-functional communication",
}

# ── Role-specific technical focus areas ─────────────────────────────
ROLE_PROFILES = {
    "frontend": "DOM manipulation, CSS layouts, responsive design, React/Angular/Vue lifecycle, state management, browser APIs, performance optimization, accessibility",
    "backend": "API design, database optimization, authentication, caching strategies, message queues, microservices, server-side architecture, error handling",
    "full stack": "End-to-end architecture, frontend-backend integration, database design, deployment pipelines, API design, state management, performance across the stack",
    "data scientist": "Statistical modeling, feature engineering, model evaluation, Python data stack (pandas/numpy/sklearn), experiment design, ML pipelines, data visualization",
    "data engineer": "ETL pipelines, data warehousing, Apache Spark/Kafka, SQL optimization, data modeling, cloud data services, batch vs streaming",
    "devops": "CI/CD pipelines, infrastructure as code, Docker/Kubernetes, monitoring, cloud platforms, automation, security practices",
    "machine learning": "Model training, hyperparameter tuning, neural networks, deployment (MLOps), feature engineering, evaluation metrics, production ML systems",
    "mobile": "iOS/Android development, cross-platform frameworks, mobile UI patterns, offline-first design, push notifications, app lifecycle",
    "qa": "Test automation, test design, CI integration, performance testing, security testing, regression strategies, bug lifecycle",
    "cloud": "Cloud architecture, serverless, containers, networking, IAM, cost optimization, multi-region deployment",
    "software": "Data structures, algorithms, OOP principles, design patterns, clean code, testing, version control, system design",
    "web": "HTTP/REST, HTML/CSS/JS fundamentals, web security, browser rendering, responsive design, progressive web apps",
}


class QuestionAgent:
    def __init__(self):
        self.model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    def generate_questions(
        self,
        resume_text: str,
        job_role: str,
        company: str,
        phase: str = "hr",
        existing_questions: List[str] = None,
        rag_context: Dict = None,
        count: int = 5
    ) -> List[Dict]:
        """
        Generate exactly `count` personalized questions for a given phase.
        Uses structured resume analysis + company/role profiles + RAG context.
        """
        # 1. Deep resume analysis
        profile = self._analyze_resume(resume_text, job_role)
        
        # 2. Company & role intelligence
        company_focus = self._get_company_focus(company)
        role_focus = self._get_role_focus(job_role)
        
        # 3. Build RAG context string
        rag_section = self._build_rag_context(rag_context, phase)
        
        # 4. Format existing questions for anti-repetition
        existing_str = json.dumps(existing_questions[:10]) if existing_questions else "None"
        
        print(f"[QUESTION_DEBUG] Generating {count} {phase} questions for {job_role} at {company}")
        print(f"[QUESTION_DEBUG] Resume Profile: {profile['experience_level']} | Domain: {profile['domain']} | Skills: {', '.join(profile['top_skills'][:5])}")
        if rag_context and rag_context.get("qa_pairs"):
            print(f"[QUESTION_DEBUG] RAG Context: {len(rag_context['qa_pairs'])} reference Q&As")

        # 5. Build the prompt
        if phase == "hr":
            prompt = self._build_hr_prompt(profile, company, company_focus, job_role, rag_section, existing_str, count)
        else:
            prompt = self._build_technical_prompt(profile, company, company_focus, role_focus, job_role, rag_section, existing_str, count)

        # 6. Generate
        try:
            start_time = time.time()
            raw_content = request_ollama(prompt, model=self.model)
            duration = time.time() - start_time
            record_metric("generate_questions", duration)
            print(f"[QUESTION_DEBUG] Raw AI Response received ({len(raw_content) if raw_content else 0} chars)")
            
            # Parse response
            content = re.sub(r'<think>.*?</think>', '', raw_content, flags=re.DOTALL).strip()
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0)
            result = json.loads(content)
            questions = result.get("questions", [])
            
            print("\n" + "="*80)
            print(f"[AI GENERATED QUESTIONS - {phase.upper()} PHASE]")
            for i, q in enumerate(questions):
                print(f"  Q{i+1}: {q.get('question')}")
            print("="*80 + "\n")
            return questions
        except Exception as e:
            print(f"[QuestionAgent] Generation error: {e}")
            raise e

    # ── Resume Intelligence ─────────────────────────────────────────
    def _analyze_resume(self, resume_text: str, job_role: str) -> Dict:
        """Extract structured intelligence from resume text."""
        if not resume_text:
            return {
                "skills": [], "top_skills": [], "projects": [],
                "experience_level": "fresher", "domain": "general",
                "summary": "No resume provided."
            }
        
        resume_lower = resume_text.lower()
        
        # Extract skills
        skills = self._extract_skills(resume_text)
        
        # Extract projects (look for project-like sections)
        projects = []
        project_patterns = [
            r'(?:project|built|developed|created|designed|implemented|deployed)\s*[:\-]?\s*(.{20,120})',
            r'(?:•|▪|►|\*)\s*(.{20,100}(?:using|with|in)\s+.{10,60})',
        ]
        for pattern in project_patterns:
            matches = re.findall(pattern, resume_text, re.IGNORECASE)
            projects.extend([m.strip() for m in matches[:5]])
        projects = projects[:4]  # Max 4 projects
        
        # Determine experience level
        exp_level = "fresher"
        year_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)', resume_lower)
        if year_match:
            years = int(year_match.group(1))
            if years >= 5:
                exp_level = "senior"
            elif years >= 2:
                exp_level = "mid"
            else:
                exp_level = "junior"
        elif any(w in resume_lower for w in ['senior', 'lead', 'architect', 'principal', 'manager']):
            exp_level = "senior"
        elif any(w in resume_lower for w in ['intern', 'fresher', 'graduate', 'student', 'entry level']):
            exp_level = "fresher"
        elif any(w in resume_lower for w in ['junior', 'associate']):
            exp_level = "junior"
        
        # Determine domain
        domain = "general"
        domain_keywords = {
            "web development": ['html', 'css', 'javascript', 'react', 'angular', 'vue', 'frontend', 'web'],
            "backend development": ['api', 'microservices', 'server', 'database', 'backend', 'django', 'flask', 'express'],
            "data science": ['machine learning', 'data science', 'pandas', 'numpy', 'sklearn', 'jupyter', 'statistical'],
            "mobile development": ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin', 'mobile'],
            "devops": ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'aws', 'azure', 'devops'],
            "cloud computing": ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda'],
        }
        domain_scores = {}
        for d, keywords in domain_keywords.items():
            domain_scores[d] = sum(1 for kw in keywords if kw in resume_lower)
        if domain_scores:
            domain = max(domain_scores, key=domain_scores.get)
            if domain_scores[domain] == 0:
                domain = "general"
        
        # Top skills (prioritize skills that match the role)
        role_lower = job_role.lower()
        top_skills = sorted(skills, key=lambda s: (s in role_lower, len(s)), reverse=True)[:7]
        
        return {
            "skills": skills,
            "top_skills": top_skills,
            "projects": projects,
            "experience_level": exp_level,
            "domain": domain,
            "summary": resume_text[:800]
        }

    # ── Company & Role Profiles ─────────────────────────────────────
    def _get_company_focus(self, company: str) -> str:
        """Get company-specific interview focus areas."""
        company_lower = company.lower().strip()
        for key, profile in COMPANY_PROFILES.items():
            if key in company_lower or company_lower in key:
                return profile
        return f"Industry best practices, problem-solving ability, teamwork, technical depth relevant to {company}"

    def _get_role_focus(self, job_role: str) -> str:
        """Get role-specific technical focus areas."""
        role_lower = job_role.lower().strip()
        for key, profile in ROLE_PROFILES.items():
            if key in role_lower or role_lower in key:
                return profile
        return f"Core competencies for {job_role}, problem-solving, system design, coding fundamentals"

    def generate_fallback_questions(self, resume_text: str, job_role: str, company: str, phase: str, count: int = 5) -> List[str]:
        """Create resume-aware fallback questions when AI generation is unavailable."""
        profile = self._analyze_resume(resume_text, job_role)
        top_skills = profile.get("top_skills") or ["software engineering", "problem solving"]
        projects = profile.get("projects") or []
        project_hint = projects[0] if projects else ""
        exp_level = profile.get("experience_level", "professional")
        domain = profile.get("domain", "general")
        company_focus = self._get_company_focus(company)
        role_focus = self._get_role_focus(job_role)

        if phase == "technical":
            base_questions = [
                f"Given your experience with {top_skills[0]}, how would you design a scalable solution for a {job_role} role at {company}?",
                f"Describe a challenging production issue you solved using {top_skills[1] if len(top_skills) > 1 else 'your core engineering skills'} and how you optimized the outcome.",
                f"How would you apply {role_focus.split(',')[0]} and {domain} best practices to improve reliability in a real-world {job_role} system?",
                f"If you had to explain the trade-offs in {project_hint or 'one of your recent projects'}, what would you prioritize and why?",
                f"What steps would you take to debug and improve performance in a {company} environment that values {company_focus.split(',')[0].lower()}?",
            ]
        else:
            base_questions = [
                f"Tell me about a time you used {top_skills[0]} to collaborate effectively with a team at {company}.",
                f"Why does this {job_role} opportunity at {company} align with your career goals and current experience level ({exp_level})?",
                f"Describe a situation where you had to adapt quickly to a new process, technology, or stakeholder expectation in a project.",
                f"How do you handle ambiguity or competing priorities when working on a cross-functional {job_role} initiative?",
                f"What would you do to build trust and ownership with a team while delivering results for {company}?",
            ]

        distinct = []
        seen = set()
        for q in base_questions:
            key = q.lower().strip()
            if key not in seen:
                seen.add(key)
                distinct.append(q)
            if len(distinct) == count:
                break

        while len(distinct) < count:
            distinct.append(f"How would you apply your {job_role.lower()} experience and resume strengths to deliver value at {company}?")

        return distinct[:count]

    # ── Prompt Builders ─────────────────────────────────────────────
    def _build_hr_prompt(self, profile, company, company_focus, job_role, rag_section, existing_str, count):
        return f"""/no_think
You are an AI Interviewer for a Smart Campus AI Interview System.
use Qwen2.5-3B-Instruct-Q4_K_M

Generate unique, non-repetitive, role-specific interview questions using the provided RAG context from retrieved JSON knowledge data.

Instructions:
Generate concise and realistic interview questions.
Avoid repeating previously asked questions in the current session.
Use only the retrieved RAG context for generating questions.
Generate different questions for different interviews and candidates.
Support: technical questions, HR questions, scenario-based questions, contextual follow-up questions.
Adapt difficulty based on candidate responses and interview role.
Keep questions professional and interview-oriented.
Do not generate duplicate or generic questions repeatedly.
If previous questions exist, generate a new question from a different concept or variation.

Input:
Candidate role: {job_role} (Level: {profile['experience_level']}, Key Skills: {', '.join(profile['top_skills'])})
Interview type: hr
Previous questions: {existing_str}
Retrieved RAG context (top_k=3 optimized chunks):
{rag_section}

Output:
Return only one high-quality interview question at a time.

Return ONLY valid JSON in this exact format:
{{
    "questions": [
        {{
            "question": "Your generated interview question here...",
            "type": "hr",
            "difficulty": "medium",
            "expected_answer": "Brief expected answer..."
        }}
    ]
}}"""

    def _build_technical_prompt(self, profile, company, company_focus, role_focus, job_role, rag_section, existing_str, count):
        return f"""/no_think
You are an AI Interviewer for a Smart Campus AI Interview System.
use Qwen2.5-3B-Instruct-Q4_K_M

Generate unique, non-repetitive, role-specific interview questions using the provided RAG context from retrieved JSON knowledge data.

Instructions:
Generate concise and realistic interview questions.
Avoid repeating previously asked questions in the current session.
Use only the retrieved RAG context for generating questions.
Generate different questions for different interviews and candidates.
Support: technical questions, HR questions, scenario-based questions, contextual follow-up questions.
Adapt difficulty based on candidate responses and interview role.
Keep questions professional and interview-oriented.
Do not generate duplicate or generic questions repeatedly.
If previous questions exist, generate a new question from a different concept or variation.

Input:
Candidate role: {job_role} (Level: {profile['experience_level']}, Key Skills: {', '.join(profile['top_skills'])})
Interview type: technical
Previous questions: {existing_str}
Retrieved RAG context (top_k=3 optimized chunks):
{rag_section}

Output:
Return only one high-quality interview question at a time.

Return ONLY valid JSON in this exact format:
{{
    "questions": [
        {{
            "question": "Your generated interview question here...",
            "type": "technical",
            "difficulty": "medium",
            "expected_answer": "Brief expected answer..."
        }}
    ]
}}"""

    # ── RAG Context Builder ─────────────────────────────────────────
    def _build_rag_context(self, rag_context: Dict, phase: str) -> str:
        """Build a formatted RAG context section for the prompt."""
        if not rag_context:
            return ""

        sections = []
        
        # Add relevant Q&A pairs (increased from 3 to 5)
        qa_pairs = rag_context.get("qa_pairs", [])
        if qa_pairs:
            sections.append("REFERENCE QUESTIONS FROM KNOWLEDGE BASE (use as topical inspiration ONLY):")
            for i, qa in enumerate(qa_pairs[:5]):
                sections.append(f"  Ref Q{i+1}: {qa['question']}")
                if qa.get('answer'):
                    answer_preview = qa['answer'][:200] + "..." if len(qa.get('answer', '')) > 200 else qa['answer']
                    sections.append(f"  Expected Answer: {answer_preview}")
                if qa.get('category'):
                    sections.append(f"  Category: {qa['category']}")
                sections.append("")

        # Add relevant context chunks
        context_chunks = rag_context.get("context_chunks", [])
        if context_chunks:
            sections.append("ADDITIONAL CONTEXT FROM KNOWLEDGE BASE:")
            for chunk in context_chunks[:2]:
                content_preview = chunk['content'][:250] if len(chunk.get('content', '')) > 250 else chunk['content']
                sections.append(f"  {content_preview}")
            sections.append("")

        return "\n".join(sections) if sections else ""

    # ── Skills Extraction ───────────────────────────────────────────
    def _extract_skills(self, resume_text: str) -> List[str]:
        tech_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'django', 'flask', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'machine learning',
            'ai', 'data science', 'tensorflow', 'pytorch', 'git', 'ci/cd',
            'agile', 'scrum', 'rest api', 'graphql', 'microservices',
            'html', 'css', 'typescript', 'c++', 'c#', '.net', 'spring boot',
            'express', 'next.js', 'fastapi', 'flask', 'pandas', 'numpy',
            'scikit-learn', 'nlp', 'deep learning', 'computer vision',
            'linux', 'nginx', 'apache', 'rabbitmq', 'kafka', 'elasticsearch',
            'jenkins', 'terraform', 'ansible', 'prometheus', 'grafana',
            'swift', 'kotlin', 'flutter', 'react native', 'firebase',
            'blockchain', 'solidity', 'ethereum', 'rust', 'go', 'golang',
            'svelte', 'tailwind', 'bootstrap', 'sass', 'webpack', 'vite',
        ]
        resume_lower = resume_text.lower() if resume_text else ""
        return list(set(kw for kw in tech_keywords if kw in resume_lower))


# Singleton
question_agent = QuestionAgent()
