"""
main.py — Thin FastAPI app wiring all agents together.
Preserves every existing frontend API endpoint exactly.
"""
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi import Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime
import os
import json
import time

from database import engine, get_db, Base, SessionLocal
from metrics import record_metric, get_average_metrics, get_all_metrics
from models import User, Interview, Resume, InterviewQuestion, Answer, InterviewReport, ProctoringLog, PDFDocument, PDFChunk
from auth import router as auth_router, get_current_user

# Import agents
from agents.resume_agent import resume_agent
from agents.question_agent import question_agent
from agents.eval_agent import eval_agent
from agents.proctoring_agent import proctor_agent
from agents.report_agent import report_agent
from agents.rag_agent import rag_agent


# ── App Setup ─────────────────────────────────────────
app = FastAPI(title="Smart Campus AI Interview System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    # Record specific route metric
    route_name = f"{request.method} {request.url.path}"
    record_metric(route_name, process_time)
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Mount uploads for profile images & resumes
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include auth routes (register, login)
app.include_router(auth_router)

@app.get("/metrics")
def get_metrics():
    return {
        "average_times": get_average_metrics(),
        "all_metrics_count": {k: len(v) for k, v in get_all_metrics().items()}
    }


# ── Pydantic Schemas ──────────────────────────────────
class CreateInterviewRequest(BaseModel):
    job_role: str
    company: str
    resume_id: int = None

class GenerateQuestionsRequest(BaseModel):
    interview_id: int
    phase: str = "hr"

class AnswerRequest(BaseModel):
    interview_id: int
    question_id: int
    answer: str
    job_role: str = Field(default="", description="Job role for context")
    company: str = Field(default="", description="Company for context")
    resume_summary: str = Field(default="", description="Resume summary for context")

class ProctoringEventRequest(BaseModel):
    interview_id: int
    event_type: str
    details: dict = {}


# ── Global Error Handler ─────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


# ── Startup ───────────────────────────────────────────
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine, checkfirst=True)
    # Auto-migrate missing columns from schema upgrades
    try:
        from migrate_db import migrate
        migrate()
    except Exception as e:
        print(f"[WARN] Migration check: {e}")
    # Auto-create robust database indexes
    try:
        from add_indexes import add_indexes
        add_indexes()
    except Exception as e:
        print(f"[WARN] Index creation failed: {e}")
    print("[OK] Database tables created / verified.")

    # Auto-index the default PDF if not already indexed
    try:
        db = next(get_db())
        pdf_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "freshers-interview-questions-answers.pdf")
        if not os.path.exists(pdf_path):
            pdf_path = os.path.join(os.path.dirname(__file__), "..", "public", "freshers-interview-questions-answers.pdf")
        if os.path.exists(pdf_path):
            existing_doc = db.query(PDFDocument).filter(PDFDocument.filename == "freshers-interview-questions-answers.pdf").first()
            if not existing_doc:
                print(f"[RAG] Auto-indexing default PDF: {pdf_path}")
                result = rag_agent.index_pdf(pdf_path, db)
                print(f"[RAG] Indexed: {result}")
            else:
                rag_agent._rebuild_index(db)
                print(f"[RAG] Default PDF already indexed, rebuilt in-memory index.")
        else:
            print(f"[RAG] Default PDF not found at {pdf_path}")
        
        # NEW: Auto-load JSON knowledge base
        print("[RAG] Loading JSON knowledge base...")
        try:
            base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)))
            json_result = rag_agent.load_json_knowledge_base(base_path=base_path, db=db)
            if json_result["status"] in ["success", "partial"]:
                print(f"[RAG] JSON KB loaded: {json_result['total_entries_loaded']} total entries")
                print(f"[RAG] Breakdown - HR: {json_result['entries_by_source'].get('hr', 0)}, " \
                      f"Math: {json_result['entries_by_source'].get('math', 0)}, " \
                      f"Technical: {json_result['entries_by_source'].get('technical', 0)}")
                if json_result["errors"]:
                    print(f"[RAG] Warnings: {json_result['errors']}")
            else:
                print(f"[RAG] JSON KB loading failed: {json_result.get('errors', 'Unknown error')}")
        except Exception as e:
            print(f"[WARN] JSON KB auto-load: {e}")
        
        db.close()
    except Exception as e:
        print(f"[WARN] RAG auto-index: {e}")


# ── Root ──────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "Smart Campus AI Interview System — Backend Running"}


# ── Users ─────────────────────────────────────────────
@app.get("/users")
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "profile_image": u.profile_image} for u in users]


# ══════════════════════════════════════════════════════
#  RESUME — Uses resume_agent
# ══════════════════════════════════════════════════════
@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload resume → extract text → Qwen analysis → store."""
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_location = f"{upload_dir}/{file.filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    # Step 1: PDF → text (resume_agent)
    extracted_text = resume_agent.extract_text_from_file(file_location, file.filename)
    if not extracted_text:
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    # Step 2: Extract skills
    skills = resume_agent.extract_skills(extracted_text)

    # Step 3: Store in DB
    new_resume = Resume(
        user_id=current_user.id,
        resume_text=extracted_text,
        skills_extracted=json.dumps(skills)
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    # Step 4: Qwen analysis (async-safe — runs in background but we wait)
    # We don't block the upload on AI analysis; just store text + skills
    return {
        "id": new_resume.id,
        "resume_id": new_resume.id,
        "text_preview": extracted_text[:500],
        "skills": skills,
        "user_id": new_resume.user_id,
        "uploaded_at": new_resume.uploaded_at
    }


# ══════════════════════════════════════════════════════
#  INTERVIEW — Create, Questions, Answers
# ══════════════════════════════════════════════════════
def _is_placeholder(q_text: str) -> bool:
    if not q_text:
        return False
    return "AI is personalizing" in q_text or "Loading question" in q_text

_generation_locks = {}

def _safe_queue_generation(background_tasks: BackgroundTasks, interview_id: int, order_index: int, phase: str):
    """Queue a background task only if it hasn't been queued in the last 60 seconds."""
    import time
    now = time.time()
    lock_key = (interview_id, order_index)
    last_queued = _generation_locks.get(lock_key, 0)
    
    # Only queue if we haven't queued this exact question in the last 60 seconds
    if now - last_queued > 60:
        _generation_locks[lock_key] = now
        background_tasks.add_task(_generate_single_question_task, interview_id, order_index, phase)
        print(f"[BG-GEN] Safely queued Question {order_index + 1} generation (auto-heal)")


def _generate_single_question_task(interview_id: int, order_index: int, phase: str):
    """
    Background task to generate a single customized AI question at order_index and replace the placeholder in the DB.
    """
    db = SessionLocal()
    try:
        print(f"[BG-GEN] Generating customized {phase} question for index {order_index} in interview {interview_id}")
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview or not interview.resume_id:
            return
        
        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        if not resume:
            return

        # Check if the placeholder actually exists
        iq = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id,
            InterviewQuestion.order_index == order_index
        ).first()
        if not iq:
            return

        # Retrieve RAG context from JSON dataset / PDF
        rag_context = None
        try:
            rag_context = rag_agent.retrieve_context(
                resume_text=resume.resume_text,
                job_role=interview.job_role,
                company=interview.company,
                phase=phase,
                top_k=5,
                db=db
            )
        except Exception as rag_err:
            print(f"[BG-GEN RAG] Context retrieval failed (non-fatal): {rag_err}")

        # Get all already customized questions in this interview to avoid duplicates
        all_prev = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id
        ).all()
        # Exclude the current placeholder itself to avoid checking against its own generic text
        existing_texts = [q.question for q in all_prev if q.order_index != order_index and not _is_placeholder(q.question)]

        # Generate exactly 1 question!
        questions = question_agent.generate_questions(
            resume_text=resume.resume_text,
            job_role=interview.job_role,
            company=interview.company,
            phase=phase,
            existing_questions=existing_texts,
            rag_context=rag_context,
            count=1
        )

        if questions:
            q = questions[0]
            q_text = q["question"] if isinstance(q, dict) else q
            q_type = q.get("type", phase) if isinstance(q, dict) else phase
            expected_ans = q.get("expected_answer", "") if isinstance(q, dict) else ""

            # Update the existing placeholder record
            iq.question = q_text
            iq.question_type = q_type
            iq.expected_answer = expected_ans
            db.commit()
            print(f"[BG-GEN] Successfully updated question at index {order_index} with customized AI question.")
        else:
            print(f"[BG-GEN WARN] No question returned by agent for index {order_index}.")

    except Exception as e:
        print(f"[BG-GEN ERROR] Failed to generate background question for index {order_index}: {e}")
        try:
            # Fallback to mark the question as errored so frontend can retry
            db_err = SessionLocal()
            iq_err = db_err.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == interview_id,
                InterviewQuestion.order_index == order_index
            ).first()
            if iq_err and _is_placeholder(iq_err.question):
                iq_err.question = f"ERROR: Generation failed for {phase} question. Please click Retry."
                db_err.commit()
            db_err.close()
        except Exception as inner_e:
            print(f"[BG-GEN ERROR] Could not mark question as error: {inner_e}")
    finally:
        db.close()


def _pre_generate_interview_content(interview_id: int):
    """
    On interview start:
    1. Analyze resume
    2. Create placeholder records for all 10 questions (for UI compatibility)
    3. Generate ONLY Question 1 (technical) - user sees this immediately
    4. While user answers Q1, Q2 will be generated in background
    5. While user answers Q2, Q3 will be generated, etc.
    """
    db = SessionLocal()
    try:
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview or not interview.resume_id:
            return
        
        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        if not resume:
            return

        # 1. Resume Analysis
        try:
            if not resume.ai_analysis:
                print("[PRE-GEN] Starting resume analysis in background...")
                analysis = resume_agent.analyze_resume(
                    resume_text=resume.resume_text,
                    job_role=interview.job_role,
                    company=interview.company
                )
                resume.ai_analysis = json.dumps(analysis)
                db.commit()
                print("[PRE-GEN] Resume analysis completed.")
        except Exception as e:
            print(f"[PRE-GEN WARN] Background resume analysis failed: {e}")

        # 2. Create placeholder records for ALL 10 questions (for UI compatibility)
        skills = question_agent._extract_skills(resume.resume_text)
        
        # Create 5 technical question placeholders (index 0-4)
        existing_tech = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id,
            InterviewQuestion.question_type == "technical"
        ).count()
        
        if existing_tech == 0:
            for idx in range(5):
                iq = InterviewQuestion(
                    interview_id=interview_id,
                    question=f"AI is personalizing your question. Please wait... [Technical Q{idx+1}]",
                    question_type="technical",
                    expected_answer="",
                    order_index=idx
                )
                db.add(iq)
            db.commit()
            print("[PRE-GEN] Created 5 technical question placeholders (to be generated one-by-one).")

        # Create 5 HR question placeholders (index 5-9)
        existing_hr = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id,
            InterviewQuestion.question_type == "hr"
        ).count()
        
        if existing_hr == 0:
            for idx in range(5):
                iq = InterviewQuestion(
                    interview_id=interview_id,
                    question=f"AI is personalizing your question. Please wait... [HR Q{idx+1}]",
                    question_type="hr",
                    expected_answer="",
                    order_index=5 + idx
                )
                db.add(iq)
            db.commit()
            print("[PRE-GEN] Created 5 HR question placeholders (to be generated one-by-one).")

        # 3. Generate Question 1 and Question 2 in background sequentially
        print("[PRE-GEN] Generating FIRST technical question...")
        _generate_single_question_task(interview_id, 0, "technical")
        
        print("[PRE-GEN] Queuing SECOND technical question...")
        _generate_single_question_task(interview_id, 1, "technical")

    except Exception as e:
        print(f"[PRE-GEN ERROR] Background generation failed: {e}")
    finally:
        db.close()


@app.post("/create-interview")
def create_interview(
    request: CreateInterviewRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new interview session and kick off parallel background pre-generation."""
    if not request.job_role or not request.job_role.strip():
        raise HTTPException(status_code=400, detail="Job role is required")
    if not request.company or not request.company.strip():
        raise HTTPException(status_code=400, detail="Company is required")

    # Get resume
    resume_id = request.resume_id
    if not resume_id:
        latest_resume = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(Resume.uploaded_at.desc()).first()
        if not latest_resume:
            raise HTTPException(status_code=400, detail="No resume found. Please upload a resume first.")
        resume_id = latest_resume.id

    new_interview = Interview(
        user_id=current_user.id,
        resume_id=resume_id,
        job_role=request.job_role,
        company=request.company
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    # Spawn concurrent background pre-generation of resume analysis, technical questions, and HR questions
    background_tasks.add_task(_pre_generate_interview_content, new_interview.id)

    return {
        "interview_id": new_interview.id,
        "job_role": new_interview.job_role,
        "company": new_interview.company,
        "resume_id": new_interview.resume_id,
        "created_at": new_interview.created_at,
        "message": "Interview created successfully. Generating questions..."
    }


# ── Generate Questions (question_agent) ───────────────
@app.post("/generate-questions")
def generate_questions(
    request: GenerateQuestionsRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate 5 HR or 5 Technical questions using question_agent with performance logging."""
    total_start = time.time()
    
    # 1. DB query time (getting interview)
    db_start = time.time()
    interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    # Check for existing questions of this phase
    existing = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == request.interview_id,
        InterviewQuestion.question_type == request.phase
    ).order_by(InterviewQuestion.order_index.asc()).all()
    db_time = time.time() - db_start

    # Safety net: If placeholders are not in DB, populate them synchronously!
    if not existing:
        db_start = time.time()
        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not linked to interview")
        
        start_idx = 0 if request.phase == "technical" else 5
        
        for idx in range(5):
            iq = InterviewQuestion(
                interview_id=request.interview_id,
                question=f"AI is personalizing your question. Please wait... [{request.phase.capitalize()} Q{idx+1}]",
                question_type=request.phase,
                expected_answer="",
                order_index=start_idx + idx
            )
            db.add(iq)
        db.commit()
        
        # Re-fetch
        existing = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == request.interview_id,
            InterviewQuestion.question_type == request.phase
        ).order_by(InterviewQuestion.order_index.asc()).all()
        db_time += (time.time() - db_start)

    # Synchronous safety: If the first question of this phase is still a placeholder, generate it synchronously!
    if existing and request.phase == "technical" and _is_placeholder(existing[0].question):
        try:
            print(f"[SYNC-GEN] Synchronously generating customized Question 1 for phase {request.phase}")
            resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
            rag_context = None
            try:
                rag_context = rag_agent.retrieve_context(
                    resume_text=resume.resume_text,
                    job_role=interview.job_role,
                    company=interview.company,
                    phase=request.phase,
                    top_k=5,
                    db=db
                )
            except Exception as rag_err:
                print(f"[SYNC-GEN RAG] Context retrieval failed: {rag_err}")

            questions = question_agent.generate_questions(
                resume_text=resume.resume_text,
                job_role=interview.job_role,
                company=interview.company,
                phase=request.phase,
                existing_questions=[],
                rag_context=rag_context,
                count=1
            )
            if questions:
                q = questions[0]
                existing[0].question = q["question"] if isinstance(q, dict) else q
                existing[0].expected_answer = q.get("expected_answer", "") if isinstance(q, dict) else ""
                db.commit()
                print("[SYNC-GEN] Question 1 generated successfully.")
        except Exception as e:
            print(f"[SYNC-GEN ERROR] Failed to synchronously generate Question 1: {e}")

    # Auto-heal: If any question is still a placeholder, safely queue it with a 60-second debounce
    # This guarantees stuck tasks (like the 3rd question) resume automatically.
    for q in existing:
        if _is_placeholder(q.question):
            _safe_queue_generation(background_tasks, request.interview_id, q.order_index, q.question_type)
            break

    total_time = time.time() - total_start
    print(f"[PERF_LOG] /generate-questions ({request.phase}) completed in {total_time:.4f}s (Placeholders/Cache Hit)")
    print(f"  - DB Query Time: {db_time:.4f}s")
    
    return {
        "message": f"{request.phase.capitalize()} questions ready",
        "questions": [{"id": q.id, "question": q.question, "type": q.question_type} for q in existing]
    }


class RetryQuestionRequest(BaseModel):
    interview_id: int
    question_id: int

@app.post("/retry-question")
def retry_question(
    request: RetryQuestionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    iq = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == request.question_id,
        InterviewQuestion.interview_id == request.interview_id
    ).first()
    if not iq:
        raise HTTPException(status_code=404, detail="Question not found")
    if iq.interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    iq.question = "AI is personalizing your question. Please wait... [Retrying]"
    db.commit()
    
    background_tasks.add_task(_generate_single_question_task, request.interview_id, iq.order_index, iq.question_type)
    return {"message": "Retry initiated"}



# ── Get Question ──────────────────────────────────────
@app.get("/get-question/{interview_id}")
def get_question(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the first unanswered question for an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    # Find first question without an answer in the answers table
    answered_ids = db.query(Answer.question_id).filter(
        Answer.interview_id == interview_id
    ).subquery()

    question_record = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id,
        ~InterviewQuestion.id.in_(answered_ids)
    ).order_by(InterviewQuestion.order_index.asc()).first()

    if question_record:
        return {
            "question_id": question_record.id,
            "question": question_record.question,
            "order_index": question_record.order_index
        }

    return {"message": "All questions answered", "is_complete": True}


# ── Submit Answer (eval_agent) ────────────────────────
@app.post("/submit-answer")
def submit_answer(
    answer_req: AnswerRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer → eval_agent scores it 0-10 → return feedback + next question with profiling."""
    total_start = time.time()
    
    # 1. DB Retrieve time
    db_retrieve_start = time.time()
    interview = db.query(Interview).filter(Interview.id == answer_req.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    question_record = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == answer_req.question_id,
        InterviewQuestion.interview_id == answer_req.interview_id
    ).first()
    if not question_record:
        raise HTTPException(status_code=404, detail="Question not found")

    # Check for duplicate answer — return existing evaluation if already answered
    existing_answer = db.query(Answer).filter(
        Answer.question_id == answer_req.question_id,
        Answer.interview_id == answer_req.interview_id
    ).first()
    db_retrieve_time = time.time() - db_retrieve_start
    record_metric("DB Retrieval (submit-answer)", db_retrieve_time)

    if existing_answer:
        # Already answered — return cached evaluation
        db_cache_start = time.time()
        answered_ids = db.query(Answer.question_id).filter(
            Answer.interview_id == answer_req.interview_id
        ).subquery()
        next_q = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == answer_req.interview_id,
            ~InterviewQuestion.id.in_(answered_ids)
        ).order_by(InterviewQuestion.order_index.asc()).first()
        db_cache_time = time.time() - db_cache_start
        record_metric("DB Next Question (Cached-Path)", db_cache_time)
        
        # Generate next questions on-demand in cached path too!
        if next_q:
            # Check if next question is placeholder - generate it
            if _is_placeholder(next_q.question):
                background_tasks.add_task(_generate_single_question_task, answer_req.interview_id, next_q.order_index, next_q.question_type)
                print(f"[BG-GEN CACHED] Queued generation for Question {next_q.order_index + 1}")
            
            # Also queue next-next question
            next_next_q = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == answer_req.interview_id,
                InterviewQuestion.order_index == next_q.order_index + 1
            ).first()
            if next_next_q and _is_placeholder(next_next_q.question):
                background_tasks.add_task(_generate_single_question_task, answer_req.interview_id, next_next_q.order_index, next_next_q.question_type)
        
        total_time = time.time() - total_start
        record_metric("Total submit-answer (Cached)", total_time)
        print(f"[PERF_LOG] /submit-answer completed in {total_time:.4f}s (Cache/Duplicate Hit)")
        return {
            "message": "Answer already recorded",
            "score": existing_answer.score or 0,
            "feedback": existing_answer.feedback or "",
            "next_question": next_q.question if next_q else None,
            "question_id": next_q.id if next_q else None,
            "is_complete": next_q is None
        }

    # Step 1: Store the candidate answer in the database
    db_store_start = time.time()
    new_answer = Answer(
        question_id=answer_req.question_id,
        interview_id=answer_req.interview_id,
        answer_text=answer_req.answer,
        question_type=question_record.question_type
    )
    db.add(new_answer)
    db.commit()
    db.refresh(new_answer)
    db_store_time = time.time() - db_store_start
    record_metric("DB Answer Storage", db_store_time)

    # Step 2: Get resume text for context
    db_resume_start = time.time()
    resume_text = answer_req.resume_summary
    if not resume_text and interview.resume_id:
        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        if resume:
            resume_text = resume.resume_text[:1000]
    db_resume_time = time.time() - db_resume_start
    record_metric("DB Resume Context Lookup", db_resume_time)

    # Step 2b: Expected Answer RAG Lookup
    rag_start = time.time()
    expected_answer = question_record.expected_answer
    rag_ref_id = None
    rag_sim_score = 0.0
    
    # Try retrieving unified expected answer RAG reference metadata
    try:
        rag_matches = rag_agent.get_expected_answers([question_record.question], db=db)
        if rag_matches and rag_matches[0].get("expected_answer"):
            rag_sim_score = rag_matches[0].get("relevance_score", 0.0)
            rag_ref_id = rag_matches[0].get("reference_id")
            if not expected_answer:
                expected_answer = rag_matches[0]["expected_answer"]
                print(f"[EVAL_DEBUG] RAG lookup found answer for Q{question_record.id}")
    except Exception as rag_err:
        print(f"[EVAL_DEBUG] Unified RAG reference lookup failed: {rag_err}")
    rag_time = time.time() - rag_start
    record_metric("RAG Expected Answer Lookup", rag_time)

    # Step 3: eval_agent scores the answer (with Qwen Model Inference)
    eval_start = time.time()
    try:
        print(f"[EVAL_DEBUG] Evaluating answer for Q: {question_record.question[:50]}...")
        evaluation = eval_agent.evaluate_answer(
            question=question_record.question,
            user_answer=answer_req.answer,
            job_role=answer_req.job_role or interview.job_role,
            company=answer_req.company or interview.company,
            resume_summary=resume_text,
            expected_answer=expected_answer,
            question_type=question_record.question_type
        )
        print(f"[EVAL_DEBUG] Score: {evaluation['score']} | Matching: {evaluation.get('matching_score', 0)}")
    except Exception as e:
        print(f"[submit-answer] Eval error: {e}")
        evaluation = eval_agent._fallback_evaluation(
            question_record.question, answer_req.answer,
            interview.job_role, interview.company,
            question_record.question_type
        )
    eval_time = time.time() - eval_start
    record_metric("Model Answer Evaluation Inference", eval_time)

    # Step 4: Update database answer record with score and feedback (DB Save Evaluation)
    db_save_start = time.time()
    new_answer.score = evaluation["score"]
    new_answer.feedback = evaluation["feedback"]
    new_answer.evaluated_at = datetime.utcnow()
    
    # Save unified RAG reference metadata
    new_answer.rag_reference_id = rag_ref_id
    new_answer.rag_similarity_score = max(rag_sim_score, evaluation.get("matching_score", 0) / 100.0)
    
    # Save individual factor scores based on question type
    if question_record.question_type == "technical":
        new_answer.accuracy_score = evaluation.get("accuracy", 5)
        new_answer.concept_understanding_score = evaluation.get("concept_understanding", 5)
        new_answer.problem_solving_score = evaluation.get("problem_solving", 5)
        new_answer.communication_clarity_score = evaluation.get("communication_clarity", 5)
        new_answer.code_quality_score = evaluation.get("code_quality", 5)
    else:
        new_answer.communication_skills_score = evaluation.get("communication_skills", 5)
        new_answer.confidence_score = evaluation.get("confidence", 5)
        new_answer.professionalism_score = evaluation.get("professionalism", 5)
        new_answer.adaptability_score = evaluation.get("adaptability", 5)
        new_answer.team_collaboration_score = evaluation.get("team_collaboration", 5)
        
    db.commit()
    db_save_time = time.time() - db_save_start
    record_metric("DB Save Evaluation", db_save_time)

    # Step 5: Get next question
    db_next_start = time.time()
    answered_ids = db.query(Answer.question_id).filter(
        Answer.interview_id == answer_req.interview_id
    ).subquery()

    next_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == answer_req.interview_id,
        ~InterviewQuestion.id.in_(answered_ids)
    ).order_by(InterviewQuestion.order_index.asc()).first()
    db_next_time = time.time() - db_next_start
    record_metric("DB Next Question Lookup", db_next_time)

    # Strictly queue ONLY next-next question (index N+2) generation in background!
    # While user is answering Question N+1, Question N+2 is generated in background.
    if next_q:
        next_next_q = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == answer_req.interview_id,
            InterviewQuestion.order_index == next_q.order_index + 1
        ).first()
        if next_next_q and _is_placeholder(next_next_q.question):
            background_tasks.add_task(_generate_single_question_task, answer_req.interview_id, next_next_q.order_index, next_next_q.question_type)
            print(f"[BG-GEN] Strictly queued Question {next_next_q.order_index + 1} generation in background.")
    
    # If user just finished all technical questions, generate first HR question synchronously to avoid flashing placeholders
    if next_q and next_q.question_type == "hr" and question_record.question_type == "technical":
        if _is_placeholder(next_q.question):
            try:
                print("[SYNC-GEN] Synchronously generating first HR question as user transitions from technical phase")
                resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
                rag_context = None
                try:
                    rag_context = rag_agent.retrieve_context(
                        resume_text=resume.resume_text,
                        job_role=interview.job_role,
                        company=interview.company,
                        phase="hr",
                        top_k=5,
                        db=db
                    )
                except Exception as rag_err:
                    print(f"[SYNC-GEN RAG] Context retrieval failed: {rag_err}")

                questions = question_agent.generate_questions(
                    resume_text=resume.resume_text,
                    job_role=interview.job_role,
                    company=interview.company,
                    phase="hr",
                    existing_questions=[],
                    rag_context=rag_context,
                    count=1
                )
                if questions:
                    q = questions[0]
                    next_q.question = q["question"] if isinstance(q, dict) else q
                    next_q.expected_answer = q.get("expected_answer", "") if isinstance(q, dict) else ""
                    db.commit()
                    print("[SYNC-GEN] First HR question generated synchronously.")
            except Exception as e:
                print(f"[SYNC-GEN ERROR] Failed to synchronously generate first HR question: {e}")

    total_time = time.time() - total_start
    record_metric("Total submit-answer Endpoint Time", total_time)
    
    print(f"[PERF_LOG] /submit-answer completed in {total_time:.4f}s")
    print(f"  - DB Retrieval: {db_retrieve_time:.4f}s")
    print(f"  - DB Storage (Raw): {db_store_time:.4f}s")
    print(f"  - DB Context Lookups: {db_resume_time:.4f}s")
    print(f"  - RAG Expected Answer Lookup: {rag_time:.4f}s")
    print(f"  - Model Inference (Qwen): {eval_time:.4f}s")
    print(f"  - DB Save Evaluation: {db_save_time:.4f}s")
    print(f"  - DB Next Question: {db_next_time:.4f}s")

    return {
        "message": "Answer received",
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "next_question": next_q.question if next_q else None,
        "question_id": next_q.id if next_q else None,
        "is_complete": next_q is None
    }


# ══════════════════════════════════════════════════════
#  REPORTS — Uses report_agent (Qwen)
# ══════════════════════════════════════════════════════
@app.get("/interview-report/{interview_id}")
def get_interview_report(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interview report with Q&A details."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).order_by(InterviewQuestion.order_index.asc()).all()

    if not questions:
        return {
            "interview_id": interview_id,
            "job_role": interview.job_role,
            "company": interview.company,
            "created_at": str(interview.created_at),
            "questions": [],
            "average_score": 0,
            "narrative_summary": ""
        }

    # Build Q&A list from answers table
    qa_list = []
    for q in questions:
        ans = db.query(Answer).filter(Answer.question_id == q.id).first()
        qa_list.append({
            "question": q.question,
            "answer": ans.answer_text if ans else "Not answered",
            "score": ans.score if ans and ans.score is not None else 0,
            "feedback": ans.feedback if ans and ans.feedback else ""
        })

    answered = [qa for qa in qa_list if qa["answer"] != "Not answered"]
    avg_score = sum(qa["score"] for qa in answered) / len(answered) if answered else 0

    # Generate narrative
    try:
        narrative = eval_agent.generate_narrative_summary(
            job_role=interview.job_role,
            company=interview.company,
            qa_data=answered
        )
    except Exception:
        narrative = "Narrative summary could not be generated."

    return {
        "interview_id": interview_id,
        "job_role": interview.job_role,
        "company": interview.company,
        "created_at": interview.created_at,
        "questions": qa_list,
        "average_score": avg_score,
        "narrative_summary": narrative
    }


@app.post("/generate-report/{interview_id}")
def generate_report(
    interview_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate & save comprehensive report using report_agent (Qwen).
    Now uses BackgroundTasks for faster response.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    # Check existing report
    existing = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if existing:
        if existing.status == "completed":
            return {
                "message": "Report already generated",
                "report_id": existing.id,
                "status": "completed",
                "narrative_summary": existing.narrative_summary
            }
        elif existing.status == "pending":
            return {
                "message": "Report generation already in progress",
                "report_id": existing.id,
                "status": "pending"
            }

    # Create pending report immediately
    new_report = InterviewReport(
        interview_id=interview_id,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Spawn background task
    background_tasks.add_task(_generate_report_bg, interview_id, new_report.id)

    return {
        "message": "Report generation started in background",
        "report_id": new_report.id,
        "status": "pending",
        "interview_id": interview_id
    }

def _generate_report_bg(interview_id: int, report_id: int):
    """Background task to generate report and save to DB."""
    db = SessionLocal()
    try:
        start_time = time.time()
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            return

        # Step 1: Gather Q&A data from DB
        questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id
        ).order_by(InterviewQuestion.order_index.asc()).all()

        if not questions:
            db.close()
            return

        qa_data = []
        for q in questions:
            ans = db.query(Answer).filter(Answer.question_id == q.id).first()
            qa_data.append({
                "question": q.question,
                "question_type": q.question_type,
                "answer": ans.answer_text if ans else "Not answered",
                "score": ans.score if ans and ans.score is not None else 0,
                "feedback": ans.feedback if ans and ans.feedback else "",
                "expected_answer": q.expected_answer  # USE PRE-STORED REFERENCE
            })

        # Step 2: Get resume text
        resume_text = ""
        if interview.resume_id:
            resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
            if resume:
                resume_text = resume.resume_text

        # Step 3: RAG — Enrich missing expected answers (for legacy data)
        rag_evaluation = None
        try:
            # Check if we need to fill any missing expected answers via RAG
            missing_expected = any(not item.get("expected_answer") for item in qa_data)
            if missing_expected:
                print("[REPORT_DEBUG] Some questions missing expected_answer, running bulk RAG lookup...")
                qa_data = rag_agent.get_bulk_expected_answers(qa_data, db=db)
            else:
                print("[REPORT_DEBUG] All questions have pre-stored expected answers. skipping RAG lookup.")

            # Step 4: Run bulk RAG evaluation using the SAME SLM model
            print(f"[REPORT_DEBUG] Running comprehensive RAG evaluation for {len(qa_data)} answers...")
            rag_evaluation = eval_agent.evaluate_with_rag(
                questions_answers=qa_data,
                job_role=interview.job_role,
                company=interview.company,
                resume_text=resume_text
            )
            print(f"[RAG] Report evaluation: tech={rag_evaluation.get('technical_score')}, "
                  f"hr={rag_evaluation.get('hr_score')}, match={rag_evaluation.get('matching_score')}, "
                  f"confidence={rag_evaluation.get('confidence_score')}")
        except Exception as rag_err:
            print(f"[RAG] Report evaluation failed (non-fatal): {rag_err}")
            import traceback
            traceback.print_exc()

        # Step 5: Get proctoring summary
        proctor_summary = proctor_agent.get_proctoring_summary(interview_id, db)

        # Step 6: Generate comprehensive report (Qwen)
        report_data = report_agent.generate_report(
            job_role=interview.job_role,
            company=interview.company,
            qa_data=qa_data,
            resume_text=resume_text,
            proctoring_summary=proctor_summary,
            rag_evaluation=rag_evaluation
        )

        # Calculate factor averages from individual Answer records in DB
        answers = db.query(Answer).filter(Answer.interview_id == interview_id).all()
        
        tech_answers = [a for a in answers if a.question_type == "technical" and a.answer_text != "Not answered"]
        hr_answers = [a for a in answers if a.question_type == "hr" and a.answer_text != "Not answered"]
        
        # Calculate averages for tech factors (scale from 0-10 to 0-100 by multiplying by 10)
        tech_accuracy = sum(a.accuracy_score or 0 for a in tech_answers) * 10 / len(tech_answers) if tech_answers else 0.0
        tech_concept = sum(a.concept_understanding_score or 0 for a in tech_answers) * 10 / len(tech_answers) if tech_answers else 0.0
        tech_solving = sum(a.problem_solving_score or 0 for a in tech_answers) * 10 / len(tech_answers) if tech_answers else 0.0
        tech_comm = sum(a.communication_clarity_score or 0 for a in tech_answers) * 10 / len(tech_answers) if tech_answers else 0.0
        tech_code = sum(a.code_quality_score or 0 for a in tech_answers) * 10 / len(tech_answers) if tech_answers else 0.0
        
        # Calculate tech overall (weighted, 0-100 scale)
        overall_tech = (tech_accuracy * 0.30 + tech_concept * 0.25 + tech_solving * 0.20 + tech_comm * 0.15 + tech_code * 0.10)
        
        # Calculate averages for hr factors
        hr_comm = sum(a.communication_skills_score or 0 for a in hr_answers) * 10 / len(hr_answers) if hr_answers else 0.0
        hr_conf = sum(a.confidence_score or 0 for a in hr_answers) * 10 / len(hr_answers) if hr_answers else 0.0
        hr_prof = sum(a.professionalism_score or 0 for a in hr_answers) * 10 / len(hr_answers) if hr_answers else 0.0
        hr_adapt = sum(a.adaptability_score or 0 for a in hr_answers) * 10 / len(hr_answers) if hr_answers else 0.0
        hr_team = sum(a.team_collaboration_score or 0 for a in hr_answers) * 10 / len(hr_answers) if hr_answers else 0.0
        
        # Calculate hr overall (weighted, 0-100 scale)
        overall_hr = (hr_comm * 0.30 + hr_conf * 0.20 + hr_prof * 0.20 + hr_adapt * 0.15 + hr_team * 0.15)
        
        # Calculate final score (70% tech, 30% hr)
        if tech_answers and hr_answers:
            final_score = overall_tech * 0.70 + overall_hr * 0.30
        elif tech_answers:
            final_score = overall_tech
        elif hr_answers:
            final_score = overall_hr
        else:
            final_score = 0.0

        # Step 7: Save report to DB with all enhanced fields
        report = db.query(InterviewReport).filter(InterviewReport.id == report_id).first()
        if report:
            report.narrative_summary = report_data.get("narrative_summary", "")
            report.average_score = report_data.get("average_score", 0)
            report.total_questions = report_data.get("total_questions", 0)
            report.answered_questions = report_data.get("answered_questions", 0)
            report.strengths = report_data.get("strengths", "")
            report.weaknesses = report_data.get("weaknesses", "")
            report.recommendation = report_data.get("recommendation", "")
            report.proctoring_analysis = json.dumps(proctor_summary)
            report.technical_score = report_data.get("technical_score", 0)
            report.hr_score = report_data.get("hr_score", 0)
            report.confidence_score = report_data.get("confidence_score", 0)
            report.missing_concepts = report_data.get("missing_concepts", "")
            report.improvement_suggestions = report_data.get("improvement_suggestions", "")
            report.rag_matching_data = report_data.get("rag_matching_data", "")
            
            # Save factor averages and overall scores
            report.tech_accuracy_avg = round(tech_accuracy, 2)
            report.tech_concept_understanding_avg = round(tech_concept, 2)
            report.tech_problem_solving_avg = round(tech_solving, 2)
            report.tech_communication_avg = round(tech_comm, 2)
            report.tech_code_quality_avg = round(tech_code, 2)
            report.overall_technical_score = round(overall_tech, 2)
            
            report.hr_communication_skills_avg = round(hr_comm, 2)
            report.hr_confidence_avg = round(hr_conf, 2)
            report.hr_professionalism_avg = round(hr_prof, 2)
            report.hr_adaptability_avg = round(hr_adapt, 2)
            report.hr_team_collaboration_avg = round(hr_team, 2)
            report.overall_hr_score = round(overall_hr, 2)
            
            report.final_interview_score = round(final_score, 2)
            
            report.status = report_data.get("status", "completed")
            report.generated_at = datetime.utcnow()
            db.commit()

        # Mark interview completed
        interview.status = "completed"
        db.commit()
        
        record_metric("generate_report_bg_task", time.time() - start_time)

    except Exception as e:
        print(f"Error in bg report generation: {e}")
        db.rollback()
        # Mark as failed
        report = db.query(InterviewReport).filter(InterviewReport.id == report_id).first()
        if report:
            report.status = "failed"
            db.commit()
    finally:
        db.close()


@app.get("/get-report/{interview_id}")
def get_report(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch a saved report."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found. Generate a report first.")

    return {
        "report_id": report.id,
        "interview_id": interview_id,
        "job_role": interview.job_role,
        "company": interview.company,
        "narrative_summary": report.narrative_summary,
        "average_score": report.average_score,
        "total_questions": report.total_questions,
        "answered_questions": report.answered_questions,
        "strengths": report.strengths,
        "weaknesses": report.weaknesses,
        "recommendation": report.recommendation,
        "technical_score": report.technical_score,
        "hr_score": report.hr_score,
        "confidence_score": report.confidence_score,
        "missing_concepts": report.missing_concepts,
        "improvement_suggestions": report.improvement_suggestions,
        "rag_matching_data": report.rag_matching_data,
        "status": report.status,
        "generated_at": report.generated_at,
        "interview_created_at": interview.created_at,
        
        # Factor averages & overall scores
        "tech_accuracy_avg": report.tech_accuracy_avg,
        "tech_concept_understanding_avg": report.tech_concept_understanding_avg,
        "tech_problem_solving_avg": report.tech_problem_solving_avg,
        "tech_communication_avg": report.tech_communication_avg,
        "tech_code_quality_avg": report.tech_code_quality_avg,
        "overall_technical_score": report.overall_technical_score,
        
        "hr_communication_skills_avg": report.hr_communication_skills_avg,
        "hr_confidence_avg": report.hr_confidence_avg,
        "hr_professionalism_avg": report.hr_professionalism_avg,
        "hr_adaptability_avg": report.hr_adaptability_avg,
        "hr_team_collaboration_avg": report.hr_team_collaboration_avg,
        "overall_hr_score": report.overall_hr_score,
        
        "final_interview_score": report.final_interview_score
    }


# ══════════════════════════════════════════════════════
#  HISTORY
# ══════════════════════════════════════════════════════
@app.get("/interview-history")
def get_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all interview history for the logged-in user."""
    interviews = db.query(Interview).filter(Interview.user_id == current_user.id).all()
    if not interviews:
        return []

    history = []
    for interview in interviews:
        questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview.id
        ).order_by(InterviewQuestion.order_index.asc()).all()

        if not questions:
            continue

        qa_list = []
        for q in questions:
            ans = db.query(Answer).filter(Answer.question_id == q.id).first()
            qa_list.append({
                "question": q.question,
                "answer": ans.answer_text if ans else "Not answered",
                "score": ans.score if ans and ans.score is not None else 0,
                "feedback": ans.feedback if ans and ans.feedback else ""
            })

        answered = [qa for qa in qa_list if qa["answer"] != "Not answered"]
        total_score = sum(qa["score"] for qa in answered)

        # Get saved report details if available
        saved_report = db.query(InterviewReport).filter(
            InterviewReport.interview_id == interview.id
        ).first()
        
        history.append({
            "interview_id": interview.id,
            "job_role": interview.job_role,
            "company": interview.company,
            "date": str(interview.created_at),
            "qa_list": qa_list,
            "total_score": total_score,
            "average_score": total_score / len(answered) if answered else 0,
            "report": {
                "narrative_summary": saved_report.narrative_summary if saved_report else "",
                "strengths": saved_report.strengths if saved_report else "",
                "weaknesses": saved_report.weaknesses if saved_report else "",
                "recommendation": saved_report.recommendation if saved_report else "",
                "technical_score": saved_report.technical_score if saved_report else 0,
                "hr_score": saved_report.hr_score if saved_report else 0,
                "confidence_score": saved_report.confidence_score if saved_report else 0,
                "missing_concepts": saved_report.missing_concepts if saved_report else "",
                "improvement_suggestions": saved_report.improvement_suggestions if saved_report else "",
                "proctoring_analysis": json.loads(saved_report.proctoring_analysis) if saved_report and saved_report.proctoring_analysis else None
            }
        })

    history.sort(key=lambda x: x["interview_id"], reverse=True)
    return history


# ══════════════════════════════════════════════════════
#  PROCTORING — Uses proctor_agent
# ══════════════════════════════════════════════════════
@app.post("/proctor/log-event")
def log_proctoring_event(
    request: ProctoringEventRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a proctoring violation event."""
    interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
    if not interview or interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = proctor_agent.log_violation(
        interview_id=request.interview_id,
        event_type=request.event_type,
        details=request.details,
        db=db
    )
    return result


@app.get("/proctor/risk-score/{interview_id}")
def get_risk_score(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get cumulative risk score for an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview or interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return proctor_agent.get_risk_score(interview_id, db)


# ══════════════════════════════════════════════════════
#  RAG / PDF KNOWLEDGE BASE
# ══════════════════════════════════════════════════════
@app.post("/rag/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and index a PDF into the RAG knowledge base."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    upload_dir = "uploads/pdfs"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    result = rag_agent.index_pdf(file_path, db)
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))

    return result


@app.post("/rag/index-default-pdf")
def index_default_pdf(db: Session = Depends(get_db)):
    """Index the default freshers interview PDF from the public folder."""
    pdf_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "freshers-interview-questions-answers.pdf")
    if not os.path.exists(pdf_path):
        pdf_path = os.path.join(os.path.dirname(__file__), "..", "public", "freshers-interview-questions-answers.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Default PDF not found in public folder")

    result = rag_agent.index_pdf(pdf_path, db)
    return result


@app.get("/rag/stats")
def get_rag_stats(db: Session = Depends(get_db)):
    """Get statistics about the PDF knowledge base."""
    return rag_agent.get_pdf_stats(db)


@app.post("/rag/search")
def rag_search(
    query: str = Form(...),
    question_type: str = Form(default=None),
    top_k: int = Form(default=5),
    db: Session = Depends(get_db)
):
    """Search the RAG knowledge base for relevant Q&A pairs."""
    context = rag_agent.retrieve_context(
        resume_text=query,
        job_role=query,
        company="",
        phase=question_type or "technical",
        top_k=top_k,
        db=db
    )
    return context


@app.get("/rag/expected-answers")
def get_expected_answers(
    questions: str = "",
    db: Session = Depends(get_db)
):
    """Get expected answers from the PDF knowledge base for given questions."""
    if not questions:
        return {"results": []}
    question_list = [q.strip() for q in questions.split("|") if q.strip()]
    results = rag_agent.get_expected_answers(question_list, db=db)
    return {"results": results}
