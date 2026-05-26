"""
vector_store.py — Lightweight TF-IDF based vector store for RAG.
Uses scikit-learn for vectorization and cosine similarity search.
No external vector DB required — all data stored in MySQL via SQLAlchemy.

Enhanced with:
- Better tokenization via n-grams
- Combined Q+A indexing for full-context retrieval
- Minimum score thresholds for quality results
"""
import json
import numpy as np
from typing import List, Dict, Tuple, Optional
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from metrics import record_metric


class VectorStore:
    """
    In-memory TF-IDF vector store that loads chunks from DB,
    builds a search index, and performs semantic similarity retrieval.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=2000,
            stop_words='english',
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            max_df=0.95
        )
        self.chunk_texts: List[str] = []
        self.chunk_metadata: List[Dict] = []
        self.tfidf_matrix = None
        self._is_fitted = False

        # Separate Q&A vectorizer for question-specific search
        self._qa_vectorizer = TfidfVectorizer(
            max_features=1500,
            stop_words='english',
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            max_df=0.95
        )
        self._qa_texts: List[str] = []
        self._qa_metadata: List[Dict] = []
        self._qa_matrix = None
        self._qa_fitted = False

    def build_index(self, chunks: List[Dict]):
        """
        Build TF-IDF index from a list of chunk dicts.
        Each chunk should have: { 'content': str, 'chunk_id': int, 'doc_id': int, ... }
        """
        if not chunks:
            self._is_fitted = False
            return

        self.chunk_texts = [c["content"] for c in chunks]
        self.chunk_metadata = chunks

        try:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.chunk_texts)
            self._is_fitted = True
            print(f"[VectorStore] Built index with {len(chunks)} chunks, vocab size={len(self.vectorizer.vocabulary_)}")
        except Exception as e:
            print(f"[VectorStore] Index build error: {e}")
            self._is_fitted = False

    def build_qa_index(self, qa_pairs: List[Dict]):
        """
        Build a dedicated Q&A index for faster question-specific retrieval.
        Each qa_pair should have: { 'question': str, 'answer': str, 'type': str, ... }
        """
        if not qa_pairs:
            self._qa_fitted = False
            return

        # Combine question + answer for richer matching
        self._qa_texts = [
            f"{qa['question']} {qa.get('answer', '')[:200]}"
            for qa in qa_pairs
        ]
        self._qa_metadata = qa_pairs

        try:
            self._qa_matrix = self._qa_vectorizer.fit_transform(self._qa_texts)
            self._qa_fitted = True
            print(f"[VectorStore] Built Q&A index with {len(qa_pairs)} pairs")
        except Exception as e:
            print(f"[VectorStore] Q&A index build error: {e}")
            self._qa_fitted = False

    def search(self, query: str, top_k: int = 5, min_score: float = 0.08) -> List[Dict]:
        """
        Search for chunks most similar to the query.
        Returns top_k results sorted by relevance score.
        """
        if not self._is_fitted or not self.chunk_texts:
            return []

        start_time = time.time()
        try:
            query_vec = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

            # Get top-k indices
            top_indices = similarities.argsort()[::-1][:top_k]
            results = []
            for idx in top_indices:
                score = float(similarities[idx])
                if score >= min_score:
                    result = {
                        "content": self.chunk_texts[idx],
                        "score": round(score, 4),
                        **{k: v for k, v in self.chunk_metadata[idx].items() if k != "content"}
                    }
                    results.append(result)
            record_metric("vector_search", time.time() - start_time)
            return results
        except Exception as e:
            print(f"[VectorStore] Search error: {e}")
            record_metric("vector_search", time.time() - start_time)
            return []

    def search_questions(
        self,
        query: str,
        qa_pairs: List[Dict] = None,
        top_k: int = 5,
        question_type: Optional[str] = None
    ) -> List[Dict]:
        """
        Search for the most relevant Q&A pairs given a query.
        Uses the dedicated Q&A index if available, otherwise builds a temporary one.
        Filters by question_type ('technical' or 'hr') if specified.
        """
        # Use dedicated Q&A index if available
        if self._qa_fitted and self._qa_metadata:
            return self._search_qa_index(query, top_k, question_type)

        # Fall back to ad-hoc search on provided qa_pairs
        if not qa_pairs:
            return []

        return self._search_qa_adhoc(query, qa_pairs, top_k, question_type)

    def _search_qa_index(
        self,
        query: str,
        top_k: int = 5,
        question_type: Optional[str] = None
    ) -> List[Dict]:
        """Search using the pre-built Q&A index."""
        start_time = time.time()
        try:
            query_vec = self._qa_vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self._qa_matrix).flatten()

            # Get all indices sorted by score
            sorted_indices = similarities.argsort()[::-1]

            results = []
            for idx in sorted_indices:
                if len(results) >= top_k:
                    break

                score = float(similarities[idx])
                if score < 0.05:
                    continue

                qa = self._qa_metadata[idx]

                # Filter by type if specified
                if question_type and qa.get("type", "").lower() != question_type.lower():
                    continue

                results.append({
                    "question": qa["question"],
                    "answer": qa.get("answer", ""),
                    "type": qa.get("type", "general"),
                    "relevance_score": round(score, 4)
                })

            record_metric("qa_index_search", time.time() - start_time)
            return results
        except Exception as e:
            print(f"[VectorStore] Q&A index search error: {e}")
            record_metric("qa_index_search", time.time() - start_time)
            return []

    def _search_qa_adhoc(
        self,
        query: str,
        qa_pairs: List[Dict],
        top_k: int = 5,
        question_type: Optional[str] = None
    ) -> List[Dict]:
        """Fallback: build a temporary vectorizer for Q&A search."""
        # Filter by type if specified
        filtered = qa_pairs
        if question_type:
            filtered = [qa for qa in qa_pairs if qa.get("type", "").lower() == question_type.lower()]
            if not filtered:
                filtered = qa_pairs  # Fall back to all if filter yields nothing

        try:
            questions = [f"{qa['question']} {qa.get('answer', '')[:100]}" for qa in filtered]
            temp_vectorizer = TfidfVectorizer(
                max_features=3000,
                stop_words='english',
                ngram_range=(1, 2),
                sublinear_tf=True
            )
            q_matrix = temp_vectorizer.fit_transform(questions)
            query_vec = temp_vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, q_matrix).flatten()

            top_indices = similarities.argsort()[::-1][:top_k]
            results = []
            for idx in top_indices:
                score = float(similarities[idx])
                if score > 0.03:
                    result = {
                        "question": filtered[idx]["question"],
                        "answer": filtered[idx].get("answer", ""),
                        "type": filtered[idx].get("type", "general"),
                        "relevance_score": round(score, 4)
                    }
                    results.append(result)
            return results
        except Exception as e:
            print(f"[VectorStore] Q&A ad-hoc search error: {e}")
            return []

    def find_best_match(self, query: str, candidates: List[str], min_score: float = 0.05) -> Optional[Dict]:
        """
        Find the single best matching candidate text for a query.
        Used for matching interview questions to PDF questions.
        """
        if not candidates:
            return None

        try:
            temp_vec = TfidfVectorizer(
                max_features=2000,
                stop_words='english',
                ngram_range=(1, 2),
                sublinear_tf=True
            )
            cand_matrix = temp_vec.fit_transform(candidates)
            query_vec = temp_vec.transform([query])
            similarities = cosine_similarity(query_vec, cand_matrix).flatten()

            best_idx = similarities.argmax()
            best_score = float(similarities[best_idx])

            if best_score >= min_score:
                return {
                    "index": best_idx,
                    "text": candidates[best_idx],
                    "score": round(best_score, 4)
                }
            return None
        except Exception as e:
            print(f"[VectorStore] Best match error: {e}")
            return None

    @property
    def is_ready(self) -> bool:
        return self._is_fitted

    @property
    def qa_ready(self) -> bool:
        return self._qa_fitted


# Singleton
vector_store = VectorStore()
