"""
rag_agent.py — Unified RAG Agent for JSON + PDF knowledge retrieval.
Manages both JSON and PDF knowledge bases: indexing, retrieval, and context injection.
Uses the same SLM/Qwen model for all AI operations.

Enhanced with:
- Multi-JSON file support (processed_hr_dataset.json, processed.json, merged_problems.json)
- Backward compatibility with PDF-based system
- Unified vector search across both JSON and PDF sources
- Dedicated Q&A index for fast retrieval
- Per-question expected answer matching
- Bulk expected answer retrieval for report generation
- Comprehensive knowledge base statistics
"""
import os
import json
import hashlib
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()


class RAGAgent:
    """
    Unified RAG Agent that:
    1. Loads and indexes 3 JSON knowledge files into DB
    2. Maintains backward compatibility with PDF indexing
    3. Retrieves relevant content from BOTH JSON and PDF knowledge bases
    4. Provides context for question generation and answer evaluation
    5. Matches interview questions to expected answers from both sources
    6. Prioritizes JSON-based retrieval while maintaining PDF fallback
    """

    def __init__(self):
        from pdf_processor import pdf_processor
        from vector_store import VectorStore
        from json_processor import json_processor
        
        self.pdf_processor = pdf_processor
        self.json_processor = json_processor
        self._vector_store = VectorStore()
        self._qa_cache: List[Dict] = []
        self._json_entries_cache: List[Dict] = []  # NEW: JSON entries cache
        self._is_initialized = False
        self._json_initialized = False  # NEW: Track JSON initialization
        self._context_query_cache: Dict[str, Dict] = {} # NEW: Context query cache
        self._expected_answers_cache: Dict[str, List[Dict]] = {} # NEW: Expected answers cache

    def index_pdf(self, file_path: str, db) -> Dict:
        """
        Process a PDF file: extract text, parse Q&A pairs, chunk content,
        and store everything in the database.
        
        Returns: { doc_id, total_chunks, total_qa_pairs, status }
        """
        from models import PDFDocument, PDFChunk

        # Step 1: Extract text
        text = self.pdf_processor.extract_text(file_path)
        if not text:
            return {"status": "error", "message": "Could not extract text from PDF"}

        filename = os.path.basename(file_path)

        # Step 2: Check if already indexed
        existing = db.query(PDFDocument).filter(PDFDocument.filename == filename).first()
        if existing:
            # Re-index: delete old chunks and re-process
            db.query(PDFChunk).filter(PDFChunk.document_id == existing.id).delete()
            doc = existing
            doc.raw_text = text
            doc.total_pages = self._count_pages(file_path)
        else:
            doc = PDFDocument(
                filename=filename,
                file_path=file_path,
                raw_text=text,
                total_pages=self._count_pages(file_path)
            )
            db.add(doc)

        db.flush()
        db.refresh(doc)

        # Step 3: Parse Q&A pairs
        qa_pairs = self.pdf_processor.parse_qa_pairs(text)
        print(f"[RAGAgent] Parsed {len(qa_pairs)} Q&A pairs from {filename}")

        # Step 4: Chunk the full text intelligently
        chunks = self.pdf_processor.chunk_text(text, chunk_size=300, overlap=50)

        # Step 5: Store Q&A pairs as chunks (with is_qa_pair=True)
        total_qa = 0
        for qa in qa_pairs:
            chunk = PDFChunk(
                document_id=doc.id,
                content=qa["question"],
                chunk_type="question",
                question_text=qa["question"],
                answer_text=qa["answer"],
                question_category=qa.get("type", "general"),
                chunk_index=total_qa,
                is_qa_pair=True
            )
            db.add(chunk)
            total_qa += 1

        # Step 6: Store text chunks (for general context retrieval)
        total_chunks = 0
        for ch in chunks:
            chunk = PDFChunk(
                document_id=doc.id,
                content=ch["content"],
                chunk_type="text",
                chunk_index=ch["chunk_index"],
                is_qa_pair=False
            )
            db.add(chunk)
            total_chunks += 1

        # Update doc stats
        doc.total_qa_pairs = total_qa
        doc.total_chunks = total_chunks + total_qa
        doc.status = "indexed"

        db.commit()
        db.refresh(doc)

        # Rebuild in-memory index
        self._rebuild_index(db)

        return {
            "doc_id": doc.id,
            "filename": doc.filename,
            "total_chunks": total_chunks,
            "total_qa_pairs": total_qa,
            "total_pages": doc.total_pages,
            "status": "indexed"
        }

    def retrieve_context(
        self,
        resume_text: str,
        job_role: str,
        company: str,
        phase: str = "technical",
        top_k: int = 5,
        db=None
    ) -> Dict:
        """
        Retrieve relevant PDF content based on resume, job role, and company.
        Returns both matching Q&A pairs and relevant text chunks.
        Optimized for semantic relevance using targeted query expansion.
        """
        if db and not self._is_initialized:
            self._rebuild_index(db)

        # Build a refined, weighted query
        query = self._build_refined_query(resume_text, job_role, company, phase)
        
        print(f"[RAG_DEBUG] Refined Query: {query}")

        # Search Q&A pairs using dedicated index
        # We search for more than top_k initially to allow for better filtering
        qa_results = self._vector_store.search_questions(
            query=query,
            qa_pairs=self._qa_cache,
            top_k=top_k * 2,
            question_type=phase
        )

        # If no type-specific results, try without type filter but prioritize similarity
        if not qa_results:
            qa_results = self._vector_store.search_questions(
                query=query,
                qa_pairs=self._qa_cache,
                top_k=top_k,
                question_type=None
            )

        # De-duplicate and limit results
        seen_questions = set()
        unique_qa = []
        for qa in qa_results:
            q_text = qa['question'].lower().strip()
            if q_text not in seen_questions:
                unique_qa.append(qa)
                seen_questions.add(q_text)
            if len(unique_qa) >= top_k:
                break

        # Search general text chunks for supplementary context
        chunk_results = self._vector_store.search(query=query, top_k=3, min_score=0.05)

        print(f"[RAG_DEBUG] Retrieved {len(unique_qa)} Q&A pairs and {len(chunk_results)} chunks for {phase} phase")
        
        # Log top match for verification
        if unique_qa:
            print(f"[RAG_DEBUG] Top QA Match: {unique_qa[0]['question']} (Score: {unique_qa[0].get('relevance_score')})")

        return {
            "qa_pairs": unique_qa,
            "context_chunks": chunk_results,
            "query_used": query,
            "total_results": len(unique_qa) + len(chunk_results),
            "phase": phase
        }

    def _build_refined_query(self, resume_text: str, job_role: str, company: str, phase: str) -> str:
        """Build a refined search query weighted by role, company, and resume skills."""
        # 1. Job Role & Company are high priority (triple-weight for TF-IDF)
        core_terms = f"{job_role} {company}"
        
        # 2. Extract technical skills/projects from resume (more skills = better matching)
        skills = self._extract_key_terms(resume_text)
        top_skills = skills[:8]  # Increased from 5 to 8 for richer matching
        
        # 3. Phase-specific keywords with more variety
        if phase == "hr":
            phase_keywords = "behavioral leadership teamwork culture fit values motivation conflict career goals"
        else:
            phase_keywords = "technical fundamentals problem solving architecture system design optimization debugging"

        # 4. Extract domain-specific terms from resume for better specificity
        domain_terms = []
        resume_lower = (resume_text or "").lower()
        domain_patterns = {
            'web': ['frontend', 'backend', 'fullstack', 'full stack', 'web'],
            'data': ['data science', 'machine learning', 'analytics', 'data engineering'],
            'mobile': ['android', 'ios', 'mobile', 'flutter', 'react native'],
            'devops': ['devops', 'ci/cd', 'deployment', 'infrastructure'],
            'cloud': ['aws', 'azure', 'gcp', 'cloud', 'serverless'],
        }
        for domain, keywords in domain_patterns.items():
            if any(kw in resume_lower for kw in keywords):
                domain_terms.append(domain)

        # Combine: core terms triple-weighted, skills, phase keywords, domain
        refined_query = f"{core_terms} {core_terms} {core_terms} {' '.join(top_skills)} {phase_keywords} {' '.join(domain_terms)}"
        return refined_query.strip()

    def get_expected_answers(
        self,
        questions: List[str],
        db=None
    ) -> List[Dict]:
        """
        For each interview question, find the most similar Q&A pair 
        from the PDF or JSON knowledge base and return the expected answer.
        Uses expected answer caching for instant subsequent retrievals.
        """
        if db:
            if not self._is_initialized:
                self._rebuild_index(db)
            if not self._json_initialized:
                self._rebuild_json_cache(db)

        # Unique key based on questions list
        cache_key = hashlib.md5("||".join(questions).encode()).hexdigest()
        if cache_key in self._expected_answers_cache:
            print(f"[RAGAgent] Cache hit for expected answers: {cache_key}")
            return self._expected_answers_cache[cache_key]

        results = []
        for question in questions:
            # 1. Search JSON entries cache
            json_matches = self._search_json_entries(question, top_k=1)
            
            # 2. Search PDF Q&A cache
            pdf_matches = self._vector_store.search_questions(
                query=question,
                qa_pairs=self._qa_cache,
                top_k=1
            ) if self._qa_cache else []
            
            best_json = json_matches[0] if json_matches else None
            best_pdf = pdf_matches[0] if pdf_matches else None
            
            best = None
            source = None
            relevance = 0.0
            
            # Compare relevance scores and pick the best
            if best_json and best_pdf:
                json_score = best_json.get("relevance_score", 0.0)
                pdf_score = best_pdf.get("relevance_score", 0.0)
                if json_score >= pdf_score:
                    best = best_json
                    source = "json"
                    relevance = json_score
                else:
                    best = best_pdf
                    source = "pdf"
                    relevance = pdf_score
            elif best_json:
                best = best_json
                source = "json"
                relevance = best_json.get("relevance_score", 0.0)
            elif best_pdf:
                best = best_pdf
                source = "pdf"
                relevance = best_pdf.get("relevance_score", 0.0)
                
            if best:
                results.append({
                    "question": question,
                    "matched_pdf_question": best["question"],
                    "expected_answer": best["answer"],
                    "relevance_score": relevance,
                    "source": source,
                    "reference_id": best.get("id") if source == "json" else str(best.get("chunk_id"))
                })
            else:
                results.append({
                    "question": question,
                    "matched_pdf_question": None,
                    "expected_answer": None,
                    "relevance_score": 0.0,
                    "source": None,
                    "reference_id": None
                })
        
        self._expected_answers_cache[cache_key] = results
        return results

    def get_bulk_expected_answers(
        self,
        qa_data: List[Dict],
        db=None
    ) -> List[Dict]:
        """
        Enhanced bulk matching: for each question in qa_data, find the expected answer
        if not already present. Returns the enriched qa_data list.
        """
        if db:
            if not self._is_initialized:
                self._rebuild_index(db)
            if not self._json_initialized:
                self._rebuild_json_cache(db)

        # Identify which questions need a lookup
        to_lookup = []
        for i, qa in enumerate(qa_data):
            if not qa.get("expected_answer"):
                to_lookup.append((i, qa["question"]))

        if not to_lookup:
            print("[RAG_DEBUG] Bulk: All questions already have reference answers.")
            return qa_data

        print(f"[RAG_DEBUG] Bulk: Performing RAG lookup for {len(to_lookup)} questions...")
        
        results = qa_data.copy()
        for i, q_text in to_lookup:
            # 1. Search JSON entries cache
            json_matches = self._search_json_entries(q_text, top_k=1)
            
            # 2. Search PDF Q&A cache
            pdf_matches = self._vector_store.search_questions(
                query=q_text,
                qa_pairs=self._qa_cache,
                top_k=1
            ) if self._qa_cache else []
            
            best_json = json_matches[0] if json_matches else None
            best_pdf = pdf_matches[0] if pdf_matches else None
            
            best = None
            source = None
            relevance = 0.0
            
            if best_json and best_pdf:
                json_score = best_json.get("relevance_score", 0.0)
                pdf_score = best_pdf.get("relevance_score", 0.0)
                if json_score >= pdf_score:
                    best = best_json
                    source = "json"
                    relevance = json_score
                else:
                    best = best_pdf
                    source = "pdf"
                    relevance = pdf_score
            elif best_json:
                best = best_json
                source = "json"
                relevance = best_json.get("relevance_score", 0.0)
            elif best_pdf:
                best = best_pdf
                source = "pdf"
                relevance = best_pdf.get("relevance_score", 0.0)
                
            if best:
                results[i]["expected_answer"] = best["answer"]
                results[i]["matched_pdf_question"] = best["question"]
                results[i]["pdf_match_score"] = relevance
                results[i]["source"] = source
                results[i]["reference_id"] = best.get("id") if source == "json" else str(best.get("chunk_id"))
            else:
                results[i]["expected_answer"] = None
                results[i]["matched_pdf_question"] = None
                results[i]["pdf_match_score"] = 0.0
                results[i]["source"] = None
                results[i]["reference_id"] = None

        print(f"[RAG_DEBUG] Bulk: Enrichment complete.")
        return results

    def get_pdf_stats(self, db) -> Dict:
        """Get statistics about the PDF knowledge base."""
        from models import PDFDocument, PDFChunk

        docs = db.query(PDFDocument).all()
        total_qa = db.query(PDFChunk).filter(PDFChunk.is_qa_pair == True).count()
        total_chunks = db.query(PDFChunk).filter(PDFChunk.is_qa_pair == False).count()

        # Breakdown by category
        hr_qa = db.query(PDFChunk).filter(
            PDFChunk.is_qa_pair == True,
            PDFChunk.question_category == "hr"
        ).count()
        tech_qa = db.query(PDFChunk).filter(
            PDFChunk.is_qa_pair == True,
            PDFChunk.question_category == "technical"
        ).count()

        return {
            "total_documents": len(docs),
            "total_qa_pairs": total_qa,
            "hr_questions": hr_qa,
            "technical_questions": tech_qa,
            "total_text_chunks": total_chunks,
            "documents": [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "status": d.status,
                    "total_qa_pairs": d.total_qa_pairs,
                    "total_chunks": d.total_chunks,
                    "total_pages": d.total_pages,
                    "indexed_at": str(d.indexed_at)
                }
                for d in docs
            ],
            "index_ready": self._is_initialized,
            "qa_index_ready": self._vector_store.qa_ready
        }

    def get_all_qa_pairs(self, db=None) -> List[Dict]:
        """Return all cached Q&A pairs (or rebuild from DB first)."""
        if db and not self._is_initialized:
            self._rebuild_index(db)
        return self._qa_cache

    def _rebuild_index(self, db):
        """Rebuild the in-memory vector index from DB chunks."""
        from models import PDFChunk

        # Load all Q&A pairs
        qa_chunks = db.query(PDFChunk).filter(PDFChunk.is_qa_pair == True).all()
        self._qa_cache = [
            {
                "question": c.question_text,
                "answer": c.answer_text or "",
                "type": c.question_category or "general",
                "chunk_id": c.id,
                "doc_id": c.document_id,
                "source": "pdf"  # NEW: Track source
            }
            for c in qa_chunks
        ]

        # Build dedicated Q&A index
        if self._qa_cache:
            self._vector_store.build_qa_index(self._qa_cache)

        # Load all text chunks for general search
        text_chunks = db.query(PDFChunk).all()
        all_chunks = [
            {
                "content": c.content,
                "chunk_id": c.id,
                "doc_id": c.document_id,
                "chunk_type": c.chunk_type,
                "source": "pdf"  # NEW: Track source
            }
            for c in text_chunks
        ]

        if all_chunks:
            self._vector_store.build_index(all_chunks)

        self._is_initialized = True
        print(f"[RAGAgent] Index rebuilt: {len(self._qa_cache)} PDF Q&A pairs, {len(all_chunks)} total PDF chunks")

    def _count_pages(self, file_path: str) -> int:
        """Count pages in a PDF."""
        try:
            import PyPDF2
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                return len(reader.pages)
        except:
            return 0

    # ──────────────────────────────────────────────────────
    # NEW: JSON Knowledge Base Methods
    # ──────────────────────────────────────────────────────

    def load_json_knowledge_base(self, base_path: str = ".", db=None) -> Dict:
        """
        Load all 3 JSON knowledge files into memory and store in DB.
        
        Returns:
        {
            "status": "success" or "error",
            "total_entries_loaded": int,
            "entries_by_source": {...},
            "errors": [...],
            "indexed_entries": int
        }
        """
        print("[RAGAgent] Initializing JSON knowledge base...")
        
        # Load JSON files using json_processor
        load_result = self.json_processor.load_all_json_files(base_path)
        
        if not db:
            return {
                "status": load_result["status"],
                "total_entries_loaded": load_result["total_entries"],
                "errors": load_result["errors"]
            }
        
        # Store entries in database
        from models import JSONDocument, JSONEntry
        import hashlib
        
        indexed_count = 0
        
        # Process each source type
        for source_type in ["hr", "math", "technical"]:
            entries = self.json_processor.get_entries_by_source(source_type)
            
            if not entries:
                continue
            
            # Create JSONDocument record
            filename = self.json_processor.json_files.get(source_type, f"{source_type}_dataset.json")
            
            existing_doc = db.query(JSONDocument).filter(JSONDocument.filename == filename).first()
            if existing_doc and existing_doc.status == "indexed" and existing_doc.total_entries > 0:
                # Check if entries actually exist in JSONEntry table
                actual_count = db.query(JSONEntry).filter(JSONEntry.document_id == existing_doc.id).count()
                if actual_count == len(entries):
                    print(f"[RAGAgent] {filename} is already fully indexed ({actual_count} entries). Skipping re-indexing.")
                    indexed_count += actual_count
                    continue
                else:
                    print(f"[RAGAgent] Re-indexing {filename}: count discrepancy (DB: {actual_count}, JSON: {len(entries)})")
            
            if existing_doc:
                # Delete old entries
                db.query(JSONEntry).filter(JSONEntry.document_id == existing_doc.id).delete()
                doc = existing_doc
            else:
                doc = JSONDocument(
                    filename=filename,
                    source_type=source_type,
                    file_path=os.path.join(base_path, self.json_processor.json_files[source_type])
                )
                db.add(doc)
            
            db.flush()
            db.refresh(doc)
            
            # Store individual entries
            for entry in entries:
                json_entry = JSONEntry(
                    entry_id=entry["id"],
                    document_id=doc.id,
                    question=entry["question"],
                    question_type=entry.get("question_type", "technical"),
                    source_type=source_type,
                    source_file=entry.get("source_file", filename),
                    category=entry.get("category", ""),
                    difficulty=entry.get("difficulty", "Medium"),
                    skills=json.dumps(entry.get("skills", [])),
                    role=entry.get("role", ""),
                    experience_level=entry.get("experience_level", ""),
                    full_text=entry.get("full_text", ""),
                    ideal_answer=entry.get("ideal_answer", ""),
                    hints=json.dumps(entry.get("hints", [])),
                    examples=json.dumps(entry.get("examples", [])),
                    is_indexed=True
                )
                db.add(json_entry)
                indexed_count += 1
            
            # Update document stats
            doc.total_entries = len(entries)
            doc.status = "indexed"
            
            print(f"[RAGAgent] Indexed {len(entries)} entries from {filename}")
        
        db.commit()
        
        # Cache JSON entries for fast retrieval
        self._rebuild_json_cache(db)
        
        return {
            "status": load_result["status"],
            "total_entries_loaded": load_result["total_entries"],
            "entries_by_source": {
                "hr": load_result["hr_entries"],
                "math": load_result["math_entries"],
                "technical": load_result["technical_entries"]
            },
            "indexed_entries": indexed_count,
            "errors": load_result["errors"]
        }

    def _rebuild_json_cache(self, db):
        """Rebuild in-memory cache of JSON entries with fast TF-IDF indexing."""
        from models import JSONEntry
        
        json_entries = db.query(JSONEntry).all()
        self._json_entries_cache = [
            {
                "id": entry.entry_id,
                "question": entry.question,
                "question_type": entry.question_type,
                "source_type": entry.source_type,
                "category": entry.category,
                "difficulty": entry.difficulty,
                "skills": json.loads(entry.skills) if entry.skills else [],
                "role": entry.role,
                "experience_level": entry.experience_level,
                "full_text": entry.full_text,
                "ideal_answer": entry.ideal_answer,
                "hints": json.loads(entry.hints) if entry.hints else [],
                "examples": json.loads(entry.examples) if entry.examples else [],
                "source": "json"
            }
            for entry in json_entries
        ]
        
        # Build fast TF-IDF index for JSON entries
        if self._json_entries_cache:
            try:
                self._json_vectorizer = TfidfVectorizer(
                    max_features=2500,
                    stop_words='english',
                    ngram_range=(1, 2),
                    sublinear_tf=True
                )
                self._json_texts = [
                    f"{entry['question']} {entry.get('category', '')} {entry.get('role', '')} {entry.get('full_text', '')[:300]}"
                    for entry in self._json_entries_cache
                ]
                self._json_matrix = self._json_vectorizer.fit_transform(self._json_texts)
                print(f"[RAGAgent] In-memory TF-IDF index built for JSON entries.")
            except Exception as e:
                print(f"[RAGAgent] JSON fast indexing warning: {e}")
        
        self._json_initialized = True
        print(f"[RAGAgent] JSON cache rebuilt: {len(self._json_entries_cache)} entries")

    def retrieve_context(
        self,
        resume_text: str,
        job_role: str,
        company: str,
        phase: str = "technical",
        top_k: int = 5,
        db=None
    ) -> Dict:
        """
        Retrieve relevant content from BOTH JSON and PDF knowledge bases.
        Prioritizes JSON results, then supplements with PDF results.
        Uses fast in-memory TF-IDF search and query caching.
        """
        # Ensure indexes are ready
        if db:
            if not self._is_initialized:
                self._rebuild_index(db)
            if not self._json_initialized:
                self._rebuild_json_cache(db)

        # Cache key lookup to return results almost instantly
        cache_key = f"{job_role.lower()}_{company.lower()}_{phase}_{top_k}_{hash(resume_text[:200])}"
        if cache_key in self._context_query_cache:
            print(f"[RAGAgent] Cache hit for retrieve_context: {cache_key}")
            return self._context_query_cache[cache_key]
        
        # Build refined query
        query = self._build_refined_query(resume_text, job_role, company, phase)
        
        print(f"[RAG_DEBUG] Refined Query: {query}")
        print(f"[RAG_DEBUG] Searching across {len(self._json_entries_cache)} JSON entries and {len(self._qa_cache)} PDF Q&A pairs")
        
        # Search JSON entries (fast TF-IDF with role/experience awareness)
        # Extract experience level from resume for better matching
        exp_level = ""
        resume_lower = (resume_text or "").lower()
        import re as _re
        year_match = _re.search(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)', resume_lower)
        if year_match:
            years = int(year_match.group(1))
            exp_level = "senior" if years >= 5 else ("mid" if years >= 2 else "fresher")
        elif any(w in resume_lower for w in ['senior', 'lead', 'architect']):
            exp_level = "senior"
        elif any(w in resume_lower for w in ['intern', 'fresher', 'student']):
            exp_level = "fresher"
        
        json_results = self._search_json_entries(query, phase, top_k, job_role=job_role, experience_level=exp_level)
        
        # Search PDF Q&A pairs (limit to remaining slots)
        remaining_k = max(2, top_k - len(json_results))
        pdf_qa_results = self._vector_store.search_questions(
            query=query,
            qa_pairs=self._qa_cache,
            top_k=remaining_k,
            question_type=phase
        ) if self._qa_cache else []
        
        # Combine results with JSON prioritized
        combined_qa = json_results + pdf_qa_results
        
        # Search general text chunks for supplementary context
        chunk_results = self._vector_store.search(query=query, top_k=3, min_score=0.05)
        
        print(f"[RAG_DEBUG] Retrieved {len(json_results)} JSON Q&A, {len(pdf_qa_results)} PDF Q&A, {len(chunk_results)} text chunks")
        
        result = {
            "qa_pairs": combined_qa[:top_k],
            "context_chunks": chunk_results,
            "json_qa_pairs": json_results,
            "query_used": query,
            "total_results": len(combined_qa) + len(chunk_results),
            "phase": phase,
            "source_breakdown": {
                "json": len(json_results),
                "pdf": len(pdf_qa_results)
            }
        }
        
        self._context_query_cache[cache_key] = result
        return result

    def _search_json_entries(self, query: str, question_type: Optional[str] = None, top_k: int = 5, 
                             job_role: str = "", experience_level: str = "") -> List[Dict]:
        """Search JSON knowledge base with role/experience filtering and category diversity."""
        if not self._json_initialized or not self._json_entries_cache or not hasattr(self, '_json_matrix'):
            return self._search_json_entries_fallback(query, question_type, top_k)
        
        try:
            query_vec = self._json_vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self._json_matrix).flatten()
            
            # Get sorted indices
            sorted_indices = similarities.argsort()[::-1]
            
            results = []
            seen_categories = {}  # Track category diversity
            max_per_category = max(2, top_k // 2)  # At most half from same category
            
            for idx in sorted_indices:
                if len(results) >= top_k:
                    break
                
                score = float(similarities[idx])
                if score < 0.02:  # Slightly lower threshold for more diversity
                    continue
                
                entry = self._json_entries_cache[idx]
                
                # Filter by question type if specified
                if question_type and entry.get("question_type") != question_type:
                    continue
                
                # Role-based boosting: boost entries matching the job role
                entry_role = entry.get("role", "").lower()
                role_lower = job_role.lower()
                if entry_role and role_lower:
                    if any(term in entry_role for term in role_lower.split()) or \
                       any(term in role_lower for term in entry_role.split()):
                        score *= 1.5  # 50% boost for role match
                
                # Experience-level boosting
                entry_exp = entry.get("experience", "").lower()
                if experience_level and entry_exp:
                    if experience_level in entry_exp:
                        score *= 1.3  # 30% boost for experience match
                
                # Category diversity enforcement
                category = entry.get("category", "general")
                if category in seen_categories and seen_categories[category] >= max_per_category:
                    continue  # Skip to ensure diversity
                seen_categories[category] = seen_categories.get(category, 0) + 1
                
                results.append({
                    "question": entry["question"],
                    "answer": entry["ideal_answer"],
                    "type": entry.get("source_type", "json"),
                    "source": "json",
                    "category": category,
                    "difficulty": entry.get("difficulty", ""),
                    "role": entry.get("role", ""),
                    "hints": entry.get("hints", []),
                    "relevance_score": round(score, 4)
                })
            return results
        except Exception as e:
            print(f"[RAGAgent] Fast search failed, using fallback: {e}")
            return self._search_json_entries_fallback(query, question_type, top_k)

    def _search_json_entries_fallback(self, query: str, question_type: Optional[str] = None, top_k: int = 5) -> List[Dict]:
        """Search JSON knowledge base entries using fallback keyword match."""
        if not self._json_entries_cache:
            return []
        
        # Filter by question type if specified
        entries = self._json_entries_cache
        if question_type:
            entries = [e for e in entries if e.get("question_type") == question_type]
        
        # Score entries based on query match
        query_words = set(query.lower().split())
        scored_entries = []
        
        for entry in entries:
            score = 0
            full_text = entry.get("full_text", "").lower()
            question = entry.get("question", "").lower()
            
            # Match against question (higher weight)
            for word in query_words:
                if word in question:
                    score += 3
                if word in full_text:
                    score += 1
            
            # Role matching
            if entry.get("role", "").lower() in query.lower():
                score += 5
            
            # Category matching
            if entry.get("category", "").lower() in query.lower():
                score += 3
            
            if score > 0:
                scored_entries.append((score, entry))
        
        # Sort by score and return top_k
        scored_entries.sort(key=lambda x: x[0], reverse=True)
        
        return [
            {
                "question": entry["question"],
                "answer": entry["ideal_answer"],
                "type": entry.get("source_type", "json"),
                "source": "json",
                "category": entry.get("category", ""),
                "difficulty": entry.get("difficulty", ""),
                "hints": entry.get("hints", []),
                "relevance_score": score / max(1, len(query_words)) if query_words else 0
            }
            for score, entry in scored_entries[:top_k]
        ]

    def _extract_key_terms(self, text: str) -> List[str]:
        """Extract key technical terms from text for better search queries."""
        if not text:
            return []
        tech_keywords = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'django', 'flask', 'sql', 'mongodb', 'postgresql', 'mysql', 'redis',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'machine learning',
            'ai', 'data science', 'tensorflow', 'pytorch', 'git', 'ci/cd',
            'html', 'css', 'typescript', 'c++', 'c#', '.net', 'spring boot',
            'rest api', 'graphql', 'microservices', 'linux', 'devops',
            'oop', 'inheritance', 'polymorphism', 'abstraction', 'encapsulation',
            'array', 'linked list', 'tree', 'graph', 'sorting', 'searching',
            'operating system', 'networking', 'database', 'normalization', 'acid',
            'agile', 'scrum', 'kanban', 'communication', 'leadership', 'teamwork',
            'strengths', 'weaknesses', 'motivation', 'goals', 'career'
        ]
        text_lower = text.lower()
        return [kw for kw in tech_keywords if kw in text_lower]


# Singleton
rag_agent = RAGAgent()
