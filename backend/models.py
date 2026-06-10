from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Float, JSON, Boolean
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    profile_image = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_otp = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    role = Column(String(50), default='student')
    department = Column(String(200), nullable=True)


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    settings = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_text = Column(Text, nullable=True)
    skills_extracted = Column(Text, nullable=True)        # JSON string of extracted skills
    ai_analysis = Column(Text, nullable=True)             # Qwen analysis of the resume
    uploaded_at = Column(DateTime, default=datetime.utcnow)


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    job_role = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    mode = Column(String(50), default="Practice")
    status = Column(String(50), default="in_progress")    # in_progress, completed, failed
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    question = Column(Text, nullable=False)
    question_type = Column(String(50), default="technical")  # technical or hr
    expected_answer = Column(Text, nullable=True)            # Derived from RAG PDF
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=False)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    score = Column(Integer, nullable=True)                # 0-10 from eval_agent
    feedback = Column(Text, nullable=True)                # detailed feedback from eval_agent
    question_type = Column(String(50), nullable=True)     # technical or hr
    evaluated_at = Column(DateTime, nullable=True)
    
    # Factor-based scoring (Technical questions)
    accuracy_score = Column(Integer, nullable=True)       # 0-10 (30% weight)
    concept_understanding_score = Column(Integer, nullable=True)  # 0-10 (25%)
    problem_solving_score = Column(Integer, nullable=True)        # 0-10 (20%)
    communication_clarity_score = Column(Integer, nullable=True)  # 0-10 (15%)
    code_quality_score = Column(Integer, nullable=True)           # 0-10 (10%)
    
    # Factor-based scoring (HR questions)
    communication_skills_score = Column(Integer, nullable=True)   # 0-10 (30%)
    confidence_score = Column(Integer, nullable=True)      # 0-10 (20%)
    professionalism_score = Column(Integer, nullable=True) # 0-10 (20%)
    adaptability_score = Column(Integer, nullable=True)    # 0-10 (15%)
    team_collaboration_score = Column(Integer, nullable=True)     # 0-10 (15%)
    
    # RAG metadata
    rag_reference_id = Column(String(50), nullable=True)   # ID of reference answer from JSON
    rag_similarity_score = Column(Float, nullable=True)    # 0-1 semantic similarity
    
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False, unique=True)
    narrative_summary = Column(Text, nullable=True)
    average_score = Column(Integer, nullable=True)
    total_questions = Column(Integer, nullable=True)
    answered_questions = Column(Integer, nullable=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    proctoring_analysis = Column(Text, nullable=True)     # Summary of proctoring violations
    
    # RAG-enhanced report fields
    technical_score = Column(Float, nullable=True)
    hr_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    missing_concepts = Column(Text, nullable=True)
    skill_gap_analysis = Column(Text, nullable=True)      # Detailed skill gap
    improvement_suggestions = Column(Text, nullable=True)
    rag_matching_data = Column(Text, nullable=True)       # JSON: match scores per question
    
    # Factor-based Technical Scores (0-100)
    tech_accuracy_avg = Column(Float, nullable=True)           # Accuracy (30%)
    tech_concept_understanding_avg = Column(Float, nullable=True)  # Concept (25%)
    tech_problem_solving_avg = Column(Float, nullable=True)        # Problem Solving (20%)
    tech_communication_avg = Column(Float, nullable=True)          # Communication (15%)
    tech_code_quality_avg = Column(Float, nullable=True)           # Code Quality (10%)
    overall_technical_score = Column(Float, nullable=True)         # Weighted average 0-100
    
    # Factor-based HR Scores (0-100)
    hr_communication_skills_avg = Column(Float, nullable=True)     # Communication (30%)
    hr_confidence_avg = Column(Float, nullable=True)               # Confidence (20%)
    hr_professionalism_avg = Column(Float, nullable=True)          # Professionalism (20%)
    hr_adaptability_avg = Column(Float, nullable=True)             # Adaptability (15%)
    hr_team_collaboration_avg = Column(Float, nullable=True)       # Teamwork (15%)
    overall_hr_score = Column(Float, nullable=True)                # Weighted average 0-100
    
    # Final Score: (Technical 70% + HR 30%)
    final_interview_score = Column(Float, nullable=True)
    hiring_readiness_score = Column(Integer, nullable=True) # 0-100 score
    
    # Evaluation metadata
    evaluation_method = Column(String(50), default="json_rag")  # json_rag, pdf_rag, hybrid
    evaluation_model = Column(String(100), default="qwen")      # Model used for evaluation
    retrieved_references_count = Column(Integer, default=0)     # Number of RAG references used
    
    status = Column(String(50), default="pending")        # pending, completed, failed
    generated_at = Column(DateTime, default=datetime.utcnow)


class ProctoringLog(Base):
    __tablename__ = "proctoring_logs"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False)
    event_type = Column(String(100), nullable=False)      # tab_switch, camera_off, etc
    event_data = Column(Text, nullable=True)              # JSON string of event details
    risk_score = Column(Float, default=0.0)               # 0.0 - 1.0
    status = Column(String(50), default="info")           # info, warning, critical
    timestamp = Column(DateTime, default=datetime.utcnow)


# ══════════════════════════════════════════════════════
#  RAG / PDF Knowledge Base Models
# ══════════════════════════════════════════════════════

class PDFDocument(Base):
    """Uploaded PDF documents for the interview knowledge base."""
    __tablename__ = "pdf_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=True)
    raw_text = Column(Text, nullable=True)                # Full extracted text
    total_pages = Column(Integer, default=0)
    total_qa_pairs = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    status = Column(String(50), default="pending")        # pending, indexed, failed
    indexed_at = Column(DateTime, default=datetime.utcnow)


class PDFChunk(Base):
    """Chunks extracted from PDF documents for RAG retrieval."""
    __tablename__ = "pdf_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("pdf_documents.id"), nullable=False)
    content = Column(Text, nullable=False)                # Chunk text content
    chunk_type = Column(String(50), default="text")       # text, question
    chunk_index = Column(Integer, default=0)
    # Q&A pair fields (when is_qa_pair=True)
    question_text = Column(Text, nullable=True)
    answer_text = Column(Text, nullable=True)
    question_category = Column(String(50), nullable=True) # technical, hr, general
    is_qa_pair = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ══════════════════════════════════════════════════════
#  JSON Knowledge Base Models
# ══════════════════════════════════════════════════════

class JSONDocument(Base):
    """Metadata about loaded JSON knowledge base files."""
    __tablename__ = "json_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False, unique=True)   # processed_hr_dataset.json, etc.
    file_path = Column(String(1000), nullable=True)
    source_type = Column(String(50), nullable=False)  # hr, math, technical
    total_entries = Column(Integer, default=0)
    status = Column(String(50), default="indexed")   # pending, indexed, failed
    last_indexed_at = Column(DateTime, default=datetime.utcnow)
    indexed_version = Column(String(50), nullable=True)  # Track version/hash for updates


class JSONEntry(Base):
    """Normalized entries from JSON knowledge base files."""
    __tablename__ = "json_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(String(50), nullable=False, unique=True)  # Hash-based ID from processor
    document_id = Column(Integer, ForeignKey("json_documents.id"), nullable=False)
    
    # Core fields
    question = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)   # technical, hr
    source_type = Column(String(50), nullable=False)     # hr, math, technical
    source_file = Column(String(200), nullable=False)    # processed_hr_dataset.json, etc.
    
    # Metadata
    category = Column(String(100), nullable=True)        # Adaptability, Array, etc.
    difficulty = Column(String(50), nullable=True)       # Easy, Medium, Hard
    skills = Column(Text, nullable=True)                 # JSON string of skill array
    role = Column(String(200), nullable=True)            # Target job role
    experience_level = Column(String(50), nullable=True) # fresher, 1 year, etc.
    
    # Content
    full_text = Column(Text, nullable=False)             # Combined text for indexing
    ideal_answer = Column(Text, nullable=True)           # Expected/reference answer
    hints = Column(Text, nullable=True)                  # JSON string of hints
    examples = Column(Text, nullable=True)               # JSON string of examples
    
    # Vector store metadata
    embedding_vector = Column(Text, nullable=True)       # JSON string of embedding (if stored)
    is_indexed = Column(Boolean, default=True)
    
    # Usage tracking
    retrieval_count = Column(Integer, default=0)         # How many times retrieved
    usage_score = Column(Float, default=0.0)             # Relevance score
    
    indexed_at = Column(DateTime, default=datetime.utcnow)


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    department = Column(String(200), nullable=True)
    job_role = Column(String(200), nullable=True)
    difficulty = Column(String(50), nullable=True)
    questions_count = Column(Integer, default=5)
    avg_duration = Column(String(50), nullable=True)
    completion_rate = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    weights = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)
    ai_insights = Column(JSON, nullable=True)
    questions = Column(JSON, nullable=True)
    score_distribution = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    target = Column(String(200), nullable=False)
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    tag = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Company(Base):
    __tablename__ = 'companies'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    industry = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=True)  # JSON string
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class JobRoleTemplate(Base):
    __tablename__ = 'job_role_templates'
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=True)  # JSON string
    interview_template = Column(Text, nullable=True)  # JSON string
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuestionBank(Base):
    __tablename__ = 'question_bank'
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    question_type = Column(String(50), default='technical')  # technical, hr
    category = Column(String(100), nullable=True)
    difficulty = Column(String(50), default='medium')  # easy, medium, hard
    expected_answer = Column(Text, nullable=True)
    source = Column(String(200), nullable=True)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Batch(Base):
    __tablename__ = 'batches'
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(50), nullable=False, unique=True)
    name = Column(String(200), nullable=False)
    students_count = Column(Integer, default=0)
    interviews_done = Column(Integer, default=0)
    avg_score = Column(Float, default=0.0)
    status = Column(String(50), default='Active')  # Active, Completed
    created_at = Column(DateTime, default=datetime.utcnow)

class Integration(Base):
    __tablename__ = 'integrations'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    desc = Column(Text, nullable=True)
    icon = Column(String(500), nullable=True)
    status = Column(String(50), default='Not Connected')  # Connected, Not Connected
    color = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSettings(Base):
    __tablename__ = 'system_settings'
    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), nullable=False, unique=True)
    setting_value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
