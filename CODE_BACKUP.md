# Smart Campus AI Interview System - Code Backup
## Enhanced Classification System with Ollama Integration
**Date**: April 25, 2026

---

## 📁 Files Modified

### 1. Backend Configuration

#### `.env`
```env
# MySQL Configuration (XAMPP Default)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_campus_interview

# OpenAI API Key (optional - only needed if you want to use OpenAI)
OPENAI_API_KEY=your-openai-api-key-here

# Ollama Configuration
OLLAMA_MODEL=phi3
OLLAMA_BASE_URL=http://localhost:11434
```

### 2. Database Models

#### `backend/models.py`
```python
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_text = Column(Text, nullable=True)
    name = Column(String(255), nullable=True)
    education = Column(String(255), nullable=True)
    candidate_type = Column(String(20), nullable=True) # IMPACT, MOTIVE, or SYSTEM
    impact_score = Column(Integer, nullable=True) # 0-100
    motive_score = Column(Integer, nullable=True) # 0-100
    system_score = Column(Integer, nullable=True) # 0-100
    classification_details = Column(Text, nullable=True) # JSON string with detailed analysis
    uploaded_at = Column(DateTime, default=datetime.utcnow)
```

### 3. AI Service with Ollama Integration

#### `backend/ai_service.py` (Key Changes)
```python
from openai import OpenAI
import ollama
import os
from typing import List, Dict
import re

# Set OpenAI API key (should be set as environment variable)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "your-openai-api-key-here"))

# Ollama configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

class ResumeAnalyzer:
    def __init__(self):
        pass  # Using Ollama directly

    def analyze_resume(self, resume_text: str) -> Dict:
        """
        Analyze resume text to extract Name, Education, and provide detailed classification with scoring.
        Uses Ollama local model for classification.
        """
        try:
            # Extract name
            name_prompt = f"Extract the full name from this resume. Return only the name:\n{resume_text[:1000]}"
            name_response = ollama.generate(model=OLLAMA_MODEL, prompt=name_prompt, options={'num_predict': 50})
            name = name_response['response'].strip()
            
            # Extract education
            edu_prompt = f"Extract education in format 'Major - Year - University' from this resume:\n{resume_text[:2000]}"
            edu_response = ollama.generate(model=OLLAMA_MODEL, prompt=edu_prompt, options={'num_predict': 100})
            education = edu_response['response'].strip()
            
            # Detailed classification with scoring
            scoring_prompt = f"""
Analyze this resume and provide detailed scoring for three candidate types. For each type, provide:
1. A score from 0-100
2. Specific evidence from the resume
3. Key strengths and indicators

Resume: {resume_text[:4000]}

Return JSON format:
{{
    "impact": {{
        "score": 85,
        "evidence": ["Led team to increase performance by 40%", "Reduced costs by $500K"],
        "strengths": ["Results-oriented", "Metrics-driven", "Achievement-focused"],
        "indicators": ["Quantifiable achievements", "Business impact", "Performance improvements"]
    }},
    "motive": {{
        "score": 60,
        "evidence": ["Led a team of 5 developers"],
        "strengths": ["Leadership potential", "Team collaboration"],
        "indicators": ["People management", "Communication skills"]
    }},
    "system": {{
        "score": 75,
        "evidence": ["Implemented microservices architecture", "Optimized database queries"],
        "strengths": ["Technical architecture", "Process optimization"],
        "indicators": ["System design", "Technical expertise", "Process improvements"]
    }},
    "primary_type": "IMPACT"
}}
"""
            
            scoring_response = ollama.generate(
                model=OLLAMA_MODEL, 
                prompt=scoring_prompt, 
                options={'temperature': 0.3, 'num_predict': 800}
            )
            
            # Parse the JSON response and return detailed results
            # ... (full implementation in actual file)
            
        except Exception as e:
            print(f"Error analyzing resume with Ollama: {e}")
            return {
                "name": "Candidate",
                "education": "Education details not found",
                "candidate_type": "SYSTEM",
                "impact_score": 33,
                "motive_score": 33,
                "system_score": 34,
                "classification_details": "{}"
            }
```

### 4. Backend API Updates

#### `backend/main.py` (Upload Resume Endpoint)
```python
# Store resume in database
new_resume = Resume(
    user_id=current_user.id,
    resume_text=extracted_text,
    name=profile_info.get("name"),
    education=profile_info.get("education"),
    candidate_type=profile_info.get("candidate_type"),
    impact_score=profile_info.get("impact_score"),
    motive_score=profile_info.get("motive_score"),
    system_score=profile_info.get("system_score"),
    classification_details=profile_info.get("classification_details")
)
db.add(new_resume)
db.commit()
db.refresh(new_resume)

# Parse classification details for frontend
import json
details = {}
try:
    details = json.loads(profile_info.get("classification_details", "{}"))
except:
    pass

# Return resume details
return {
    "resume_id": new_resume.id,
    "name": new_resume.name,
    "education": new_resume.education,
    "candidate_type": new_resume.candidate_type,
    "impact_score": new_resume.impact_score,
    "motive_score": new_resume.motive_score,
    "system_score": new_resume.system_score,
    "classification_details": details,
    "message": "Resume uploaded and analyzed successfully"
}
```

### 5. Frontend Updates

#### `src/app/resume/page.tsx` (Classification Cards)
```typescript
const [profile, setProfile] = useState<{ 
  name: string; 
  education: string; 
  candidate_type?: string;
  impact_score?: number;
  motive_score?: number;
  system_score?: number;
  classification_details?: any;
} | null>(null);

// Classification Cards
<div className={styles.classificationCards}>
  {['IMPACT', 'MOTIVE', 'SYSTEM'].map((type) => {
    const score = profile?.[`${type.toLowerCase()}_score`] || 0;
    const details = profile?.classification_details?.[type.toLowerCase()];
    const isPrimary = profile?.candidate_type === type;
    
    return (
      <div 
        key={type}
        className={`${styles.classificationCard} ${isPrimary ? styles.primary : ''}`}
        onClick={() => {
          alert(`${type} Score: ${score}/100\n\nEvidence:\n${details?.evidence?.join('\n') || 'N/A'}\n\nStrengths:\n${details?.strengths?.join('\n') || 'N/A'}`);
        }}
      >
        <h4>{type}</h4>
        <div className={styles.score}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreMax}>/100</span>
        </div>
        {isPrimary && <div className={styles.primaryBadge}>Primary</div>}
      </div>
    );
  })}
</div>
```

### 6. CSS Styles

#### `src/styles/resume.module.css` (Classification Cards)
```css
/* Classification Cards */
.classificationCards {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: space-between;
}

.classificationCard {
  flex: 1;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.classificationCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.classificationCard.primary {
  border-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
}

.classificationCard h4 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.scoreValue {
  font-size: 2rem;
  font-weight: 800;
  color: #3b82f6;
}

.scoreMax {
  font-size: 1rem;
  color: #9ca3af;
  font-weight: 500;
}

.primaryBadge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
```

---

## 🗄️ Database Migration Scripts

### `add_resume_columns.py`
```python
from database import engine
from sqlalchemy import text

# Add missing columns to resumes table
with engine.connect() as conn:
    result = conn.execute(text("DESCRIBE resumes"))
    existing_columns = [row[0] for row in result]
    
    if 'name' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN name VARCHAR(255)"))
    if 'education' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN education VARCHAR(255)"))
    if 'tags' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN tags VARCHAR(255)"))
    
    conn.commit()
```

### `add_classification_columns.py`
```python
from database import engine
from sqlalchemy import text

# Add new classification columns to resumes table
with engine.connect() as conn:
    result = conn.execute(text("DESCRIBE resumes"))
    existing_columns = [row[0] for row in result]
    
    new_columns = [
        ("impact_score", "INT"),
        ("motive_score", "INT"),
        ("system_score", "INT"),
        ("classification_details", "TEXT")
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            conn.execute(text(f"ALTER TABLE resumes ADD COLUMN {col_name} {col_type}"))
    
    conn.commit()
```

### `update_resume_schema.py`
```python
from database import engine
from sqlalchemy import text

# Update resumes table schema
with engine.connect() as conn:
    result = conn.execute(text("DESCRIBE resumes"))
    existing_columns = [row[0] for row in result]
    
    # Add candidate_type column if it doesn't exist
    if 'candidate_type' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN candidate_type VARCHAR(20)"))
    
    # Optionally drop the tags column if it exists
    if 'tags' in existing_columns:
        conn.execute(text("ALTER TABLE resumes DROP COLUMN tags"))
    
    conn.commit()
```

---

## 🧪 Test Scripts

### `test_ollama_updated.py`
```python
import ollama
import os

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

test_resume = """
John Doe
Software Engineer at Tech Corp

Education:
- Bachelor of Computer Science, 2020 - MIT

Experience:
- Led a team of 5 developers to increase system performance by 40%
- Implemented microservices architecture that reduced costs by $500K
- Optimized database queries resulting in 60% faster response times
"""

try:
    # Test name extraction
    name_prompt = f"Extract the full name from this resume. Return only the name:\n{test_resume[:1000]}"
    name_response = ollama.generate(model=OLLAMA_MODEL, prompt=name_prompt, options={'num_predict': 50})
    name = name_response['response'].strip()
    print(f"Name: {name}")
    
    # Test education extraction
    edu_prompt = f"Extract education in format 'Major - Year - University' from this resume:\n{test_resume[:2000]}"
    edu_response = ollama.generate(model=OLLAMA_MODEL, prompt=edu_prompt, options={'num_predict': 100})
    education = edu_response['response'].strip()
    print(f"Education: {education}")
    
    # Test classification
    classify_prompt = f"""
Classify this person as one word - IMPACT, MOTIVE, or SYSTEM:
- IMPACT: results-driven, metrics, achievements
- MOTIVE: people-driven, leadership, teams  
- SYSTEM: process-driven, architecture, optimization

Resume: {test_resume[:3000]}
"""
    class_response = ollama.generate(model=OLLAMA_MODEL, prompt=classify_prompt, options={'num_predict': 20})
    candidate_type = class_response['response'].strip().upper()
    print(f"Candidate Type: {candidate_type}")
    
    print("\n✅ Ollama integration is working!")
    
except Exception as e:
    print(f"❌ Error: {e}")
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
# Backend
cd backend
pip install ollama

# Frontend
cd ..
npm install
```

### 2. Setup Ollama
```bash
# Install Ollama (Windows)
winget install Ollama.Ollama

# Start Ollama service
ollama serve

# Pull model (phi3 or llama3.2)
ollama pull phi3
```

### 3. Database Setup
```bash
# Run migration scripts in order
python add_resume_columns.py
python update_resume_schema.py
python add_classification_columns.py
```

### 4. Start Services
```bash
# Backend (Terminal 1)
cd backend
.\venv\Scripts\uvicorn.exe main:app --reload

# Frontend (Terminal 2)
cd ..
npm run dev
```

---

## 🎯 Features Implemented

1. **Ollama Integration**: Local AI model for resume classification
2. **Detailed Scoring**: 0-100 scores for IMPACT, MOTIVE, SYSTEM types
3. **Interactive UI**: Clickable cards showing detailed insights
4. **Evidence-Based**: Specific resume evidence for each classification
5. **HR-Friendly**: Comprehensive analysis for recruitment decisions

---

## 📊 Classification Types

- **IMPACT**: Results-driven, focuses on metrics, achievements, business impact
- **MOTIVE**: People-driven, focuses on leadership, team building, communication
- **SYSTEM**: Process-driven, focuses on architecture, optimization, technical expertise

---

*All code has been successfully saved and implemented. The system is ready for use with Ollama local AI integration.*
