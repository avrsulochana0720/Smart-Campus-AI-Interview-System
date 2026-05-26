"""
pdf_processor.py — Extract text from PDFs, parse Q&A pairs, chunk content.
Handles the freshers-interview-questions-answers.pdf and any future uploads.
Enhanced with robust multi-strategy parsing for various PDF formats.
"""
import re
import PyPDF2
from typing import List, Dict, Tuple


class PDFProcessor:
    """Handles PDF text extraction, Q&A parsing, and content chunking."""

    def extract_text(self, file_path: str) -> str:
        """Extract all text from a PDF file and normalize whitespace."""
        text = ""
        try:
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"[PDFProcessor] PDF extraction error: {e}")
        return self._normalize_extracted_text(text)

    def _normalize_extracted_text(self, text: str) -> str:
        """
        Normalize extracted PDF text.
        Many PDFs produce word-per-line output; collapse them into sentences.
        """
        if not text:
            return ""

        # Replace \r\n and \r with \n
        text = text.replace('\r\n', '\n').replace('\r', '\n')

        # Split into lines
        lines = text.split('\n')

        # Detect word-per-line format: if >70% of non-empty lines are single words
        non_empty = [l.strip() for l in lines if l.strip()]
        if non_empty:
            single_word_lines = sum(1 for l in non_empty if len(l.split()) <= 2)
            ratio = single_word_lines / len(non_empty)
            if ratio > 0.5:
                # Word-per-line format — collapse into space-separated text
                text = ' '.join(l.strip() for l in lines if l.strip())

        # Normalize multiple spaces
        text = re.sub(r' {2,}', ' ', text)
        return text.strip()

    def parse_qa_pairs(self, text: str) -> List[Dict]:
        """
        Parse question-answer pairs from extracted PDF text.
        Handles multiple common Q&A formats found in interview PDFs.
        Returns a list of {"question": str, "answer": str, "type": str} dicts.
        """
        qa_pairs = []

        # Strategy 1: Numbered questions with "Sample Answer:" pattern
        # e.g. "1. Tell Me About Yourself Sample Answer: ..."
        qa_pairs = self._parse_numbered_sample_answer(text)
        if len(qa_pairs) >= 3:
            print(f"[PDFProcessor] Strategy 1 (numbered + Sample Answer): {len(qa_pairs)} pairs")
            return qa_pairs

        # Strategy 2: "Q: ... A: ..." or "Question: ... Answer: ..." format
        qa_pairs = self._parse_qa_prefix_format(text)
        if len(qa_pairs) >= 3:
            print(f"[PDFProcessor] Strategy 2 (Q:/A: prefix): {len(qa_pairs)} pairs")
            return qa_pairs

        # Strategy 3: Numbered questions "1. Question\nAnswer text"
        qa_pairs = self._parse_numbered_questions(text)
        if len(qa_pairs) >= 3:
            print(f"[PDFProcessor] Strategy 3 (numbered questions): {len(qa_pairs)} pairs")
            return qa_pairs

        # Strategy 4: Question mark detection
        qa_pairs = self._parse_question_mark_format(text)
        if qa_pairs:
            print(f"[PDFProcessor] Strategy 4 (question marks): {len(qa_pairs)} pairs")
            return qa_pairs

        print(f"[PDFProcessor] No Q&A pairs found with any strategy")
        return []

    def _parse_numbered_sample_answer(self, text: str) -> List[Dict]:
        """
        Parse format: "N. Question Text Sample Answer: Answer text"
        This matches the freshers-interview-questions-answers.pdf format.
        """
        qa_pairs = []

        # Pattern: number followed by question, then "Sample Answer" (with optional colon)
        # Split by numbered questions first
        pattern = re.compile(
            r'(\d+)\s*\.\s*(.*?)\s*(?:Sample\s+Answer\s*:?\s*)(.*?)(?=\d+\s*\.\s*[A-Z]|$)',
            re.DOTALL | re.IGNORECASE
        )
        matches = pattern.findall(text)

        for num, question, answer in matches:
            q_clean = self._clean_text(question.strip())
            a_clean = self._clean_text(answer.strip())
            if len(q_clean) > 5 and len(a_clean) > 5:
                qa_pairs.append({
                    "question": q_clean,
                    "answer": a_clean,
                    "type": self._classify_question(q_clean)
                })

        return qa_pairs

    def _parse_qa_prefix_format(self, text: str) -> List[Dict]:
        """Parse Q:/A: or Question:/Answer: format."""
        qa_pairs = []
        pattern = re.compile(
            r'(?:Q(?:uestion)?[\s.:]+\d*[\s.:]*)(.*?)(?:A(?:nswer)?[\s.:]+)(.*?)(?=(?:Q(?:uestion)?[\s.:]+\d*[\s.:])|$)',
            re.DOTALL | re.IGNORECASE
        )
        matches = pattern.findall(text)

        for q, a in matches:
            q_clean = self._clean_text(q.strip())
            a_clean = self._clean_text(a.strip())
            if len(q_clean) > 10 and len(a_clean) > 5:
                qa_pairs.append({
                    "question": q_clean,
                    "answer": a_clean,
                    "type": self._classify_question(q_clean)
                })

        return qa_pairs

    def _parse_numbered_questions(self, text: str) -> List[Dict]:
        """Parse numbered questions with answer on next lines."""
        qa_pairs = []
        pattern = re.compile(
            r'(\d+)\s*[\.)\]]\s*(.*?)(?:\n)(.*?)(?=\d+\s*[\.)\]]\s*|$)',
            re.DOTALL
        )
        matches = pattern.findall(text)

        for num, q, a in matches:
            q_clean = self._clean_text(q.strip())
            a_clean = self._clean_text(a.strip())
            if len(q_clean) > 10 and len(a_clean) > 5:
                qa_pairs.append({
                    "question": q_clean,
                    "answer": a_clean,
                    "type": self._classify_question(q_clean)
                })

        return qa_pairs

    def _parse_question_mark_format(self, text: str) -> List[Dict]:
        """Parse based on question marks followed by answer text."""
        qa_pairs = []
        lines = text.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if self._is_question_line(line):
                question = self._clean_text(line)
                answer_lines = []
                j = i + 1
                while j < len(lines) and not self._is_question_line(lines[j].strip()):
                    cleaned = lines[j].strip()
                    if cleaned:
                        answer_lines.append(cleaned)
                    j += 1
                answer = " ".join(answer_lines)
                if len(question) > 10 and len(answer) > 5:
                    qa_pairs.append({
                        "question": question,
                        "answer": self._clean_text(answer),
                        "type": self._classify_question(question)
                    })
                i = j
            else:
                i += 1

        return qa_pairs

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[Dict]:
        """
        Split text into overlapping chunks for embedding.
        Each chunk includes metadata about its position.
        """
        chunks = []
        words = text.split()
        total_words = len(words)

        if total_words == 0:
            return chunks

        start = 0
        chunk_index = 0
        while start < total_words:
            end = min(start + chunk_size, total_words)
            chunk_text = " ".join(words[start:end])
            chunks.append({
                "chunk_index": chunk_index,
                "content": chunk_text,
                "start_pos": start,
                "end_pos": end,
                "total_words": total_words
            })
            if end >= total_words:
                break
            start += chunk_size - overlap
            chunk_index += 1

        return chunks

    def _is_question_line(self, line: str) -> bool:
        """Check if a line looks like a question."""
        if not line:
            return False
        if '?' in line:
            return True
        if re.match(r'^(?:Q(?:uestion)?[\s.:]+\d*)', line, re.IGNORECASE):
            return True
        if re.match(r'^\d+[\.)\]]\s*(?:What|How|Why|When|Where|Which|Explain|Describe|Define|List|Name|Tell|Can|Do|Is|Are|Will|Would|Should|Could|Discuss|Compare|Differentiate|Elaborate)', line, re.IGNORECASE):
            return True
        if re.match(r'^(?:What|How|Why|When|Where|Which|Explain|Describe|Define|List|Name|Tell me)\s', line, re.IGNORECASE):
            return True
        return False

    def _classify_question(self, question: str) -> str:
        """Classify a question as 'technical' or 'hr'."""
        hr_keywords = [
            'tell me about yourself', 'strengths', 'weaknesses', 'why should we hire',
            'where do you see yourself', 'career goals', 'salary', 'team', 'leadership',
            'conflict', 'motivation', 'why this company', 'describe a situation',
            'challenge', 'failure', 'success', 'work environment', 'culture',
            'communication', 'stress', 'pressure', 'hobbies', 'interests',
            'greatest achievement', 'management style', 'feedback', 'relocate',
            'work-life balance', 'ethical', 'integrity', 'personality',
            'hire you', 'long-term goals', 'short-term goals', 'handle stress',
            'want to work here', 'know about this company', 'accomplishment',
            'disagreement', 'complaint', 'mistake', 'motivates you', 'describe you',
            'salary expectations', 'work environment', 'questions from me',
            'why do you want', 'tell me one', 'how did your', 'what kind of',
            'do you have any questions'
        ]
        q_lower = question.lower()
        for keyword in hr_keywords:
            if keyword in q_lower:
                return "hr"
        return "technical"

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Collapse whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove leading numbers/bullets
        text = re.sub(r'^\d+[\.\)]\s*', '', text)
        # Remove Q: or Question: prefix
        text = re.sub(r'^(?:Q(?:uestion)?[\s.:]+\d*[\s.:]*)', '', text, flags=re.IGNORECASE)
        # Remove A: or Answer: prefix
        text = re.sub(r'^(?:A(?:nswer)?[\s.:]+)', '', text, flags=re.IGNORECASE)
        # Remove "Sample Answer:" prefix
        text = re.sub(r'^(?:Sample\s+Answer[\s.:]+)', '', text, flags=re.IGNORECASE)
        return text.strip()


# Singleton
pdf_processor = PDFProcessor()
