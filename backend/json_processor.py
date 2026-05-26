"""
json_processor.py — JSON Knowledge Base Processor
Handles loading, parsing, and normalizing 3 JSON knowledge files:
1. processed_hr_dataset.json - HR interview questions
2. processed.json - Math/aptitude questions
3. merged_problems.json - Technical coding problems
"""
import json
import os
from typing import List, Dict, Optional, Any
import hashlib
from datetime import datetime

class JSONProcessor:
    """
    Processes and normalizes 3 JSON knowledge files into a unified format
    suitable for RAG indexing and retrieval.
    """
    
    def __init__(self):
        self.json_files = {
            "hr": "public/processed_hr_dataset.json",
            "math": "public/processed.json",
            "technical": "public/merged_problems.json"
        }
        self.normalized_entries: List[Dict] = []
        self._loaded_files: Dict[str, bool] = {"hr": False, "math": False, "technical": False}
    
    def load_all_json_files(self, base_path: str = ".") -> Dict[str, Any]:
        """
        Load all 3 JSON files and normalize them into a unified format.
        
        Returns:
        {
            "status": "success" or "error",
            "total_entries": int,
            "hr_entries": int,
            "math_entries": int,
            "technical_entries": int,
            "errors": [list of errors if any]
        }
        """
        results = {
            "status": "success",
            "total_entries": 0,
            "hr_entries": 0,
            "math_entries": 0,
            "technical_entries": 0,
            "errors": []
        }
        
        # Load HR dataset
        try:
            hr_path = os.path.join(base_path, self.json_files["hr"])
            if os.path.exists(hr_path):
                with open(hr_path, 'r', encoding='utf-8') as f:
                    hr_data = json.load(f)
                hr_entries = self._process_hr_dataset(hr_data)
                results["hr_entries"] = len(hr_entries)
                self.normalized_entries.extend(hr_entries)
                self._loaded_files["hr"] = True
                print(f"[JSONProcessor] Loaded {len(hr_entries)} HR entries")
            else:
                results["errors"].append(f"HR dataset not found at {hr_path}")
        except Exception as e:
            results["errors"].append(f"Error loading HR dataset: {str(e)}")
            results["status"] = "partial"
        
        # Load Math dataset
        try:
            math_path = os.path.join(base_path, self.json_files["math"])
            if os.path.exists(math_path):
                with open(math_path, 'r', encoding='utf-8') as f:
                    math_data = json.load(f)
                math_entries = self._process_math_dataset(math_data)
                results["math_entries"] = len(math_entries)
                self.normalized_entries.extend(math_entries)
                self._loaded_files["math"] = True
                print(f"[JSONProcessor] Loaded {len(math_entries)} Math entries")
            else:
                results["errors"].append(f"Math dataset not found at {math_path}")
        except Exception as e:
            results["errors"].append(f"Error loading Math dataset: {str(e)}")
            results["status"] = "partial"
        
        # Load Technical dataset (with encoding fallback)
        try:
            tech_path = os.path.join(base_path, self.json_files["technical"])
            if os.path.exists(tech_path):
                # Try different encodings for the technical file
                tech_data = None
                encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
                for encoding in encodings:
                    try:
                        with open(tech_path, 'r', encoding=encoding) as f:
                            tech_data = json.load(f)
                        print(f"[JSONProcessor] Successfully loaded technical file with {encoding} encoding")
                        break
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        continue
                
                if tech_data is None:
                    raise Exception("Could not load technical file with any supported encoding")
                
                tech_entries = self._process_technical_dataset(tech_data)
                results["technical_entries"] = len(tech_entries)
                self.normalized_entries.extend(tech_entries)
                self._loaded_files["technical"] = True
                print(f"[JSONProcessor] Loaded {len(tech_entries)} Technical entries")
            else:
                results["errors"].append(f"Technical dataset not found at {tech_path}")
        except Exception as e:
            results["errors"].append(f"Error loading Technical dataset: {str(e)}")
            results["status"] = "partial"
        
        results["total_entries"] = len(self.normalized_entries)
        
        if results["total_entries"] == 0:
            results["status"] = "error"
            results["errors"].append("No JSON files could be loaded")
        
        return results
    
    def _process_hr_dataset(self, data: Any) -> List[Dict]:
        """
        Normalize HR dataset entries into unified format.
        
        Input format (can be dict with 'questions' key or list):
        {
            "question": "...",
            "category": "Adaptability|Conflict Resolution|Career Goals|Team Collaboration",
            "role": "DevOps Engineer|...",
            "experience": "fresher|1 year|2 years|...",
            "difficulty": "Easy|Medium|Hard",
            "ideal_answer": "...",
            "keywords": ["word1", "word2"]
        }
        """
        normalized = []
        
        # Handle both dict with 'questions' key and direct list
        if isinstance(data, dict) and "questions" in data:
            data_list = data["questions"]
        elif isinstance(data, list):
            data_list = data
        else:
            return normalized
        
        for idx, item in enumerate(data_list):
            if not isinstance(item, dict):
                continue
            
            question = item.get("question", "").strip()
            if not question:
                continue
            
            entry = {
                "id": self._generate_id(f"hr-{idx}-{question}"),
                "source_file": "processed_hr_dataset.json",
                "source_type": "hr",
                "question": question,
                "category": item.get("category", "General"),
                "role": item.get("role", ""),
                "experience_level": item.get("experience", ""),
                "difficulty": item.get("difficulty", "Medium"),
                "question_type": "hr",
                "ideal_answer": item.get("ideal_answer", ""),
                "keywords": item.get("keywords", []),
                "skills": item.get("keywords", []),
                "index": idx,
                "loaded_at": datetime.utcnow().isoformat()
            }
            
            # Combine fields for text indexing
            entry["full_text"] = f"{question} {entry.get('ideal_answer', '')} {' '.join(entry.get('keywords', []))}"
            
            normalized.append(entry)
        
        return normalized
    
    def _process_math_dataset(self, data: List[Dict]) -> List[Dict]:
        """
        Normalize Math dataset entries into unified format.
        
        Input format:
        {
            "question": "...",
            "options": "a) ..., b) ..., c) ..., ...",
            "answer": "a|b|c|d|e",
            "level": "easy|medium|hard"
        }
        """
        normalized = []
        for idx, item in enumerate(data):
            if not isinstance(item, dict):
                continue
            
            question = item.get("question", "").strip()
            if not question:
                continue
            
            entry = {
                "id": self._generate_id(f"math-{idx}-{question}"),
                "source_file": "processed.json",
                "source_type": "math",
                "question": question,
                "options": item.get("options", ""),
                "correct_answer": item.get("answer", ""),
                "difficulty": item.get("level", "medium").capitalize(),
                "question_type": "technical",  # Math questions are technical
                "category": "Quantitative Aptitude",
                "skills": ["Problem Solving", "Math", "Quantitative Reasoning"],
                "index": idx,
                "loaded_at": datetime.utcnow().isoformat()
            }
            
            entry["full_text"] = f"{question} {item.get('options', '')}"
            normalized.append(entry)
        
        return normalized
    
    def _process_technical_dataset(self, data: Any) -> List[Dict]:
        """
        Normalize Technical dataset entries into unified format.
        
        Input format (can be dict with 'questions' key or list):
        {
            "title": "Two Sum",
            "problem_id": "1",
            "difficulty": "Easy|Medium|Hard",
            "topics": ["Array", "Hash Table"],
            "description": "...",
            "examples": [...],
            "constraints": [...],
            "hints": [...],
            "code_snippets": {...},
            "solution": "..."
        }
        """
        normalized = []
        
        # Handle both dict with 'questions' key and direct list
        if isinstance(data, dict) and "questions" in data:
            data_list = data["questions"]
        elif isinstance(data, list):
            data_list = data
        else:
            return normalized
        
        for idx, item in enumerate(data_list):
            if not isinstance(item, dict):
                continue
            
            title = item.get("title", "").strip()
            description = item.get("description", "").strip()
            
            if not title and not description:
                continue
            
            # Extract key information
            topics = item.get("topics", [])
            hints = item.get("hints", [])
            examples = item.get("examples", [])
            solution = item.get("solution", "")
            
            # Build ideal answer from solution and hints
            ideal_answer = f"Solution:\n{solution[:500] if solution else ''}"
            if hints:
                ideal_answer += f"\nKey Hints:\n" + "\n".join(f"- {h[:100]}" for h in hints[:3])
            
            entry = {
                "id": self._generate_id(f"tech-{idx}-{title}"),
                "source_file": "merged_problems.json",
                "source_type": "technical",
                "title": title,
                "problem_id": item.get("problem_id", ""),
                "frontend_id": item.get("frontend_id", ""),
                "question": description,
                "difficulty": item.get("difficulty", "Medium"),
                "topics": topics,
                "skills": topics,
                "category": topics[0] if topics else "Coding",
                "question_type": "technical",
                "examples": examples,
                "hints": hints,
                "ideal_answer": ideal_answer,
                "solution": solution[:1000] if solution else "",  # First 1000 chars
                "constraints": item.get("constraints", []),
                "index": idx,
                "loaded_at": datetime.utcnow().isoformat()
            }
            
            # Combine all text for indexing
            examples_text = " ".join([e.get("example_text", "")[:100] for e in examples[:2]])
            hints_text = " ".join(hints[:3])
            entry["full_text"] = f"{title} {description[:300]} {' '.join(topics)} {examples_text} {hints_text}"
            
            normalized.append(entry)
        
        return normalized
    
    def _generate_id(self, text: str) -> str:
        """Generate a unique ID using hash."""
        return hashlib.md5(text.encode()).hexdigest()[:12]
    
    def get_entries_by_type(self, question_type: str) -> List[Dict]:
        """Get all entries of a specific type (hr, technical, etc.)"""
        return [e for e in self.normalized_entries if e.get("question_type") == question_type]
    
    def get_entries_by_source(self, source_type: str) -> List[Dict]:
        """Get all entries from a specific source file (hr, math, technical)"""
        return [e for e in self.normalized_entries if e.get("source_type") == source_type]
    
    def search_entries(self, query: str, top_k: int = 5, question_type: Optional[str] = None) -> List[Dict]:
        """
        Simple keyword search in normalized entries.
        This will be complemented by semantic search via vector store.
        """
        query_lower = query.lower()
        
        # Filter by type if specified
        entries = self.normalized_entries
        if question_type:
            entries = [e for e in entries if e.get("question_type") == question_type]
        
        # Score entries based on keyword match
        scored_entries = []
        for entry in entries:
            score = 0
            full_text = entry.get("full_text", "").lower()
            question = entry.get("question", "").lower()
            
            # Match against question (higher weight)
            if query_lower in question:
                score += 10
            
            # Match against full text
            for word in query_lower.split():
                if word in full_text:
                    score += 1
            
            if score > 0:
                scored_entries.append((score, entry))
        
        # Sort by score and return top_k
        scored_entries.sort(key=lambda x: x[0], reverse=True)
        return [entry for score, entry in scored_entries[:top_k]]
    
    def validate_entries(self) -> Dict[str, Any]:
        """Validate loaded entries for completeness and consistency."""
        validation = {
            "total_entries": len(self.normalized_entries),
            "valid_entries": 0,
            "invalid_entries": 0,
            "missing_fields": [],
            "duplicates": 0
        }
        
        required_fields = ["id", "source_file", "question", "difficulty", "question_type"]
        seen_ids = set()
        
        for entry in self.normalized_entries:
            is_valid = True
            
            # Check required fields
            for field in required_fields:
                if field not in entry or not entry[field]:
                    is_valid = False
                    validation["missing_fields"].append(f"Entry {entry.get('id', 'unknown')}: missing {field}")
            
            # Check for duplicates
            entry_id = entry.get("id")
            if entry_id in seen_ids:
                validation["duplicates"] += 1
                is_valid = False
            seen_ids.add(entry_id)
            
            if is_valid:
                validation["valid_entries"] += 1
            else:
                validation["invalid_entries"] += 1
        
        return validation


# Singleton instance
json_processor = JSONProcessor()
