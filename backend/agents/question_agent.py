"""
question_agent.py — Qwen generates 5 Tech + 5 HR questions
Generates resume-aware, role-specific interview questions using Ollama (Qwen).
Now enhanced with RAG context from PDF knowledge base.
"""
import os
import re
import json
import time
from typing import List, Dict
from dotenv import load_dotenv
from metrics import record_metric

try:
    from gemini_helper import request_gemini
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from gemini_helper import request_gemini

load_dotenv()


class QuestionAgent:
    def __init__(self):
        self.model = os.getenv("OLLAMA_MODEL", "qwen3:0.6b")

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
        Generate exactly count questions for a given phase (hr or technical).
        Uses resume context + RAG PDF knowledge to tailor questions.
        """
        skills = self._extract_skills(resume_text)
        skills_str = ", ".join(skills) if skills else "various technologies"
        resume_context = resume_text[:1000] if resume_text else "No resume provided."
        existing_str = json.dumps(existing_questions) if existing_questions else "None"

        # Build RAG context string from PDF knowledge base
        rag_section = self._build_rag_context(rag_context, phase)
        
        print(f"[QUESTION_DEBUG] Generating {count} {phase} questions for {job_role} at {company}")
        if rag_context and rag_context.get("qa_pairs"):
            print(f"[QUESTION_DEBUG] RAG Context provided: {len(rag_context['qa_pairs'])} reference questions")

        if phase == "hr":
            prompt = f"""/no_think
As an AI HR Interviewer, generate exactly {count} unique, professional behavioral and HR {"questions" if count > 1 else "question"} for a candidate applying for the {job_role} position at {company}.

CANDIDATE PROFILE:
- Resume Context: {resume_context}
- Identified Skills: {skills_str}

{rag_section}

GUIDELINES:
1. NEVER copy questions directly from the Knowledge Base. Use them only for topical inspiration.
2. PERSONALIZATION: Reference specific projects, experiences, or skills from the candidate's resume in the {"questions" if count > 1 else "question"}.
3. DIVERSITY: Ensure the {"questions cover" if count > 1 else "question covers"} different aspects: Introduction/Motivation, Behavioral/Conflict, Leadership/Teamwork, Culture Fit, and Career Goals.
4. EXPERIENCE LEVEL: Tailor the difficulty to the candidate's apparent experience level in their resume.
5. NO REPETITION: Do NOT repeat these questions: {existing_str}
6. CONCISENESS: Keep the question text extremely concise, maximum 1 to 2 sentences. Do not add conversational filler.

Return ONLY a valid JSON object containing exactly {count} {"questions" if count > 1 else "question"} in the array:
{{
    "questions": [
        {{
            "question": "Personalized question text...",
            "type": "hr",
            "difficulty": "medium",
            "expected_answer": "The expected answer derived/adapted from the Knowledge Base reference, or a high-quality model-generated answer if no direct reference exists."
        }}
    ]
}}"""
        else:
            prompt = f"""/no_think
As an AI Technical Interviewer, generate exactly {count} unique, deep technical and scenario-based {"questions" if count > 1 else "question"} for a {job_role} position at {company}.

CANDIDATE PROFILE:
- Resume Context: {resume_context}
- Identified Skills: {skills_str}

{rag_section}

GUIDELINES:
1. NEVER copy questions directly from the Knowledge Base. Use them as reference for technical standards and expected depth.
2. PERSONALIZATION: Anchor {"technical questions" if count > 1 else "technical question"} in the candidate's projects or mentioned stack ({skills_str}).
3. DYNAMIC SCENARIOS: Create "What if" or "How would you optimize" scenarios based on the candidate's specific background.
4. VARIATION: Include a mix of: Technical Fundamentals, Project Deep-dive, System Design/Architecture, and Edge-case handling.
5. NO REPETITION: Do NOT repeat these questions: {existing_str}
6. CONCISENESS: Keep the question text extremely concise, maximum 1 to 2 sentences. Do not add conversational filler.

Return ONLY a valid JSON object containing exactly {count} {"questions" if count > 1 else "question"} in the array:
{{
    "questions": [
        {{
            "question": "Personalized technical question text...",
            "type": "technical",
            "difficulty": "hard",
            "expected_answer": "The technical reference answer from the Knowledge Base, adapted to the specific scenario asked."
        }}
    ]
}}"""

        try:
            start_time = time.time()
            raw_content = request_gemini(prompt)
            duration = time.time() - start_time
            record_metric("generate_questions", duration)
            print(f"[QUESTION_DEBUG] Raw AI Response received ({len(raw_content) if raw_content else 0} chars)")
            
            # Remove thinking tags if present (Qwen3)
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
            print(f"[QuestionAgent] Gemini generation error: {e}")
            raise e

    def _build_rag_context(self, rag_context: Dict, phase: str) -> str:
        """Build a formatted RAG context section for the prompt."""
        if not rag_context:
            return ""

        sections = []
        
        # Add relevant Q&A pairs from PDF
        qa_pairs = rag_context.get("qa_pairs", [])
        if qa_pairs:
            sections.append("REFERENCE QUESTIONS FROM KNOWLEDGE BASE (use as inspiration):")
            for i, qa in enumerate(qa_pairs[:3]):
                sections.append(f"  Ref Q{i+1}: {qa['question']}")
                if qa.get('answer'):
                    # Include just a preview of the answer
                    answer_preview = qa['answer'][:150] + "..." if len(qa.get('answer', '')) > 150 else qa['answer']
                    sections.append(f"  Expected Answer: {answer_preview}")
                sections.append("")

        # Add relevant context chunks
        context_chunks = rag_context.get("context_chunks", [])
        if context_chunks:
            sections.append("ADDITIONAL CONTEXT FROM KNOWLEDGE BASE:")
            for chunk in context_chunks[:1]:
                content_preview = chunk['content'][:200] if len(chunk.get('content', '')) > 200 else chunk['content']
                sections.append(f"  {content_preview}")
            sections.append("")

        return "\n".join(sections) if sections else ""

    def _extract_skills(self, resume_text: str) -> List[str]:
        tech_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'django', 'flask', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'machine learning',
            'ai', 'data science', 'tensorflow', 'pytorch', 'git', 'ci/cd',
            'agile', 'scrum', 'rest api', 'graphql', 'microservices',
            'html', 'css', 'typescript', 'c++', 'c#', '.net', 'spring boot'
        ]
        resume_lower = resume_text.lower() if resume_text else ""
        return list(set(kw for kw in tech_keywords if kw in resume_lower))


# Singleton
question_agent = QuestionAgent()
