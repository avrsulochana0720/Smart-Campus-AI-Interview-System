"""
main.py — Thin FastAPI app wiring all agents together.
Preserves every existing frontend API endpoint exactly.
"""
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi import Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from jose import jwt
import os
import sys
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# Ensure backend package modules can be imported whether running from backend/ or workspace root
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import engine, get_db, Base, SessionLocal
from metrics import record_metric, get_average_metrics, get_all_metrics
from models import User, UserSettings, Interview, Resume, InterviewQuestion, Answer, InterviewReport, ProctoringLog, PDFDocument, PDFChunk, Assessment, Feedback, ScheduledInterview
from auth import router as auth_router, get_current_user, SECRET_KEY, ALGORITHM
from admin_routes import router as admin_router
from email_service import send_interview_schedule_email, validate_smtp_config
from websocket_manager import manager

# Validate SMTP configuration at startup
validate_smtp_config()

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

    # Print outgoing API responses for debugging
    try:
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            body = getattr(response, "body", None)
            if body is not None:
                if isinstance(body, bytes):
                    body_text = body.decode("utf-8", errors="replace")
                else:
                    body_text = str(body)
                if body_text:
                    try:
                        parsed = json.loads(body_text)
                        print(f"[API RESPONSE] {request.method} {request.url.path} -> {json.dumps(parsed, ensure_ascii=False)}")
                    except Exception:
                        print(f"[API RESPONSE] {request.method} {request.url.path} -> {body_text}")
        else:
            body = getattr(response, "body", None)
            if isinstance(body, (bytes, str)):
                body_text = body.decode("utf-8", errors="replace") if isinstance(body, bytes) else body
                if body_text:
                    print(f"[API RESPONSE] {request.method} {request.url.path} -> {body_text}")
    except Exception as e:
        print(f"[API RESPONSE] failed to log response for {request.method} {request.url.path}: {e}")

    return response

# Mount uploads for profile images & resumes
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount reports for backend generated PDFs
os.makedirs("reports", exist_ok=True)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

# Include auth routes (register, login)
app.include_router(auth_router)
app.include_router(admin_router)

@app.get("/metrics")
def get_metrics():
    return {
        "average_times": get_average_metrics(),
        "all_metrics_count": {k: len(v) for k, v in get_all_metrics().items()}
    }

@app.websocket("/ws/{user_id}/{role}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, role: str):
    await manager.connect(websocket, user_id, role)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# ── Pydantic Schemas ──────────────────────────────────
class CreateInterviewRequest(BaseModel):
    resume_id: Optional[int] = None
    job_role: str
    company: str
    mode: Optional[str] = "Practice"

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

class ScheduleInterviewRequest(BaseModel):
    job_role: str
    company: str
    scheduled_time: str


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
    
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            # Existing migrations
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'student'"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(200)"))
            except Exception:
                pass
            
            # New migrations for Resume Sync System
            new_json_columns = ['skills', 'education', 'projects', 'experience', 'certifications']
            for col in new_json_columns:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} JSON"))
                except Exception:
                    pass
            
            # Answer table migrations
            try:
                conn.execute(text("ALTER TABLE answers ADD COLUMN user_id INTEGER DEFAULT 1"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE answers ADD COLUMN is_draft BOOLEAN DEFAULT 0"))
            except Exception:
                pass
    except Exception as e:
        print(f"[WARN] Failed to auto-migrate tables: {e}")
        
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


@app.get("/me")
def get_current_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    settings_record = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "profile_image": current_user.profile_image,
        "phone": current_user.phone_number,
        "role": current_user.role,
        "department": current_user.department,
        "location": current_user.location,
        "settings": settings_record.settings if settings_record else {}
    }


@app.post("/user-settings")
def save_user_settings(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from auth import verify_password_native, hash_password_native
    settings_payload = payload.get("settings") if isinstance(payload, dict) else None
    if settings_payload is None:
        raise HTTPException(status_code=400, detail="Missing settings payload")

    profile_data = settings_payload.get("profile") or {}
    if profile_data.get("email") and profile_data["email"] != current_user.email:
        existing = db.query(User).filter(User.email == profile_data["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use")
        current_user.email = profile_data["email"]
    if profile_data.get("name"):
        current_user.name = profile_data["name"]
    if profile_data.get("phone_number"):
        current_user.phone_number = profile_data["phone_number"]
    if profile_data.get("location"):
        current_user.location = profile_data["location"]
        
    db.add(current_user)

    settings_record = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings_record:
        settings_record = UserSettings(user_id=current_user.id, settings=settings_payload)
        db.add(settings_record)
    else:
        settings_record.settings = settings_payload
    password_data = settings_payload.get("password")
    if password_data and password_data.get("current_password") and password_data.get("new_password"):
        if not verify_password_native(password_data["current_password"], current_user.password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        current_user.password = hash_password_native(password_data["new_password"])

    db.commit()
    db.refresh(current_user)
    return {"message": "Settings updated successfully", "settings": settings_record.settings}


# ── Assessments ─────────────────────────────────────────
@app.get("/assessments")
def get_assessments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessments = db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    return assessments

@app.post("/assessments")
def create_assessment(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_assessment = Assessment(
        user_id=current_user.id,
        name=payload.get("name", "New Assessment"),
        department=payload.get("department", ""),
        job_role=payload.get("job_role", ""),
        difficulty=payload.get("difficulty", "Medium"),
        questions_count=payload.get("questions_count", 5),
        avg_duration=payload.get("avg_duration", "20m"),
        completion_rate=payload.get("completion_rate", 0),
        is_active=payload.get("is_active", True),
        is_archived=payload.get("is_archived", False),
        weights=payload.get("weights", {}),
        skills=payload.get("skills", {}),
        ai_insights=payload.get("ai_insights", []),
        questions=payload.get("questions", []),
        score_distribution=payload.get("score_distribution", [])
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return new_assessment


# ── Feedbacks ─────────────────────────────────────────
@app.get("/feedbacks")
def get_feedbacks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).filter(Feedback.user_id == current_user.id).order_by(Feedback.created_at.desc()).all()
    return feedbacks

@app.post("/feedbacks")
def create_feedback(payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_feedback = Feedback(
        user_id=current_user.id,
        type=payload.get("type", "Evaluator"),
        target=payload.get("target", ""),
        rating=float(payload.get("rating", 0)),
        comment=payload.get("comment", ""),
        tag=payload.get("tag", "")
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    return new_feedback



# ══════════════════════════════════════════════════════
#  RESUME — Uses resume_agent
# ══════════════════════════════════════════════
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

    # Step 4: Resume insight analysis
    analysis = resume_agent.summarize_resume(extracted_text)

    # Step 3: Extract personal info and update user profile
    personal_info = resume_agent.extract_personal_info(extracted_text)
    if personal_info:
        if personal_info.get("name") and personal_info.get("name") != "Not Found":
            current_user.name = personal_info["name"]
        if personal_info.get("phone_number") and personal_info.get("phone_number") != "Not Found":
            current_user.phone_number = personal_info["phone_number"]
            
        # We also attempt to update the email cautiously
        if personal_info.get("email") and personal_info.get("email") != "Not Found":
            existing_user = db.query(User).filter(User.email == personal_info["email"], User.id != current_user.id).first()
            if not existing_user:
                current_user.email = personal_info["email"]

        # Store JSON arrays
        current_user.skills = personal_info.get("skills", [])
        current_user.education = personal_info.get("education", [])
        current_user.projects = personal_info.get("projects", [])
        current_user.experience = personal_info.get("experience", [])
        current_user.certifications = personal_info.get("certifications", [])

    # Step 4: Store in DB
    new_resume = Resume(
        user_id=current_user.id,
        resume_text=extracted_text,
        skills_extracted=json.dumps(skills),
        ai_analysis=json.dumps(analysis) if isinstance(analysis, dict) else analysis
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    db.refresh(current_user)

    return {
        "id": new_resume.id,
        "resume_id": new_resume.id,
        "text_preview": extracted_text[:500],
        "skills": skills,
        "analysis": analysis,
        "user_id": new_resume.user_id,
        "uploaded_at": new_resume.uploaded_at,
        "updated_user": {
            "name": current_user.name,
            "email": current_user.email,
            "phone_number": current_user.phone_number
        }
    }


@app.get("/users/me")
def get_detailed_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone_number,
        "role": current_user.role,
        "department": current_user.department,
        "location": current_user.location,
        "skills": current_user.skills or [],
        "education": current_user.education or [],
        "projects": current_user.projects or [],
        "experience": current_user.experience or [],
        "certifications": current_user.certifications or []
    }


@app.get("/my-resume")
def get_my_resume(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).first()
    if not resume:
        return None
    
    # Parse JSON if it's stored as strings
    try:
        skills = json.loads(resume.skills_extracted) if resume.skills_extracted else []
    except:
        skills = []
        
    try:
        analysis = json.loads(resume.ai_analysis) if resume.ai_analysis else {}
    except:
        analysis = resume.ai_analysis if isinstance(resume.ai_analysis, dict) else {}

    return {
        "id": resume.id,
        "resume_id": resume.id,
        "text_preview": resume.resume_text[:500] if resume.resume_text else "",
        "skills": skills,
        "analysis": analysis,
        "user_id": resume.user_id,
        "uploaded_at": resume.uploaded_at
    }

# ══════════════════════════════════════════════════════
#  INTERVIEW — Create, Questions, Answers
# ══════════════════════════════════════════════════════
def _is_placeholder(text: str) -> bool:
    if not text: return True
    placeholders = [
        "AI is personalizing",
        "[Retrying]",
        "Could you elaborate on your experience",
        "Could you describe a challenging technical project",
        "How do you approach debugging a complex issue",
        "Can you explain a time when you had to learn a new technology",
        "What strategies do you use to ensure your code",
        "Describe a situation where you had to make a technical trade-off",
        "Can you tell me about a time you had a disagreement",
        "Where do you see your career heading",
        "Describe a situation where you had to meet a tight deadline",
        "What is your preferred work environment",
        "Can you share an example of a time you took the initiative"
    ]
    return any(p in text for p in placeholders)

_generation_locks = {}
_BACKGROUND_EXECUTOR = ThreadPoolExecutor(max_workers=8)
_evaluating_answers = set()


def _schedule_background_task(func, *args):
    """Queue a heavy task on the background executor without blocking the HTTP response."""
    try:
        _BACKGROUND_EXECUTOR.submit(func, *args)
        return True
    except Exception as exc:
        print(f"[BG-SCHED] Failed to queue task: {exc}")
        return False


def _preload_question_context(interview_id: int, order_index: int, phase: str):
    """Warm RAG retrieval for the next question in parallel to reduce latency."""
    db = SessionLocal()
    try:
        question_record = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id,
            InterviewQuestion.order_index == order_index
        ).first()
        if not question_record:
            return

        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first() if interview and interview.resume_id else None
        if not interview or not resume:
            return

        rag_context = rag_agent.retrieve_context(
            resume_text=resume.resume_text,
            job_role=interview.job_role,
            company=interview.company,
            phase=phase,
            top_k=5,
            db=db,
        )
        if rag_context and rag_context.get("qa_pairs"):
            print(f"[BG-PRELOAD] Warmed RAG context for Q{order_index + 1} ({phase}) in interview {interview_id}")

        if not question_record.expected_answer:
            expected_matches = rag_agent.get_expected_answers([question_record.question], db=db)
            if expected_matches and expected_matches[0].get("expected_answer"):
                question_record.expected_answer = expected_matches[0]["expected_answer"]
                db.commit()
    except Exception as exc:
        print(f"[BG-PRELOAD] RAG preload failed for Q{order_index + 1}: {exc}")
    finally:
        db.close()


def _safe_queue_generation(background_tasks: BackgroundTasks, interview_id: int, order_index: int, phase: str):
    """Queue a background task only if it hasn't been queued in the last 60 seconds."""
    import time
    now = time.time()
    lock_key = (interview_id, order_index)
    last_queued = _generation_locks.get(lock_key, 0)
    
    # Only queue if we haven't queued this exact question in the last 30 seconds
    if now - last_queued > 30:
        _generation_locks[lock_key] = now
        _schedule_background_task(_generate_single_question_task, interview_id, order_index, phase)
        _schedule_background_task(_preload_question_context, interview_id, order_index, phase)
        print(f"[BG-GEN] Safely queued Question {order_index + 1} generation (auto-heal)")
    else:
        print(f"[BG-GEN] Skipped Question {order_index + 1} — already queued {now - last_queued:.0f}s ago")


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
            
            # Check completion status of all 10 questions
            all_qs = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == interview_id
            ).all()
            generated_count = sum(1 for q in all_qs if not _is_placeholder(q.question) and not q.question.startswith("ERROR:"))
            print(f"[BG-GEN] Progress for Interview {interview_id}: {generated_count}/10 questions generated successfully.")
            if generated_count == 10:
                print(f"[BG-GEN SUCCESS] All 10 questions (5 Technical + 5 HR) have been successfully generated for Interview {interview_id}!")
            
            # ── PARALLEL CHAIN: queue next question and its RAG warm-up in parallel ──
            next_index = order_index + 1
            if phase == "technical" and next_index <= 4:
                print(f"[BG-GEN] Chaining: auto-queuing Technical Q{next_index + 1} in parallel")
                _schedule_background_task(_generate_single_question_task, interview_id, next_index, "technical")
                _schedule_background_task(_preload_question_context, interview_id, next_index, "technical")
            elif phase == "hr" and next_index <= 9:
                print(f"[BG-GEN] Chaining: auto-queuing HR Q{next_index + 1} in parallel")
                _schedule_background_task(_generate_single_question_task, interview_id, next_index, "hr")
                _schedule_background_task(_preload_question_context, interview_id, next_index, "hr")
        else:
            raise Exception(f"No question returned by agent for index {order_index}.")

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


def _ensure_placeholder_questions(db: Session, interview_id: int, resume_text: str, job_role: str, company: str):
    """Create immediate placeholder question slots for the interview UI without blocking the response."""
    existing_tech = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id,
        InterviewQuestion.question_type == "technical"
    ).count()

    if existing_tech == 0:
        tech_fallbacks = question_agent.generate_fallback_questions(
            resume_text,
            job_role,
            company,
            phase="technical",
            count=5,
        )
        for idx, q_text in enumerate(tech_fallbacks):
            db.add(InterviewQuestion(
                interview_id=interview_id,
                question=q_text,
                question_type="technical",
                expected_answer="",
                order_index=idx,
            ))

    existing_hr = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id,
        InterviewQuestion.question_type == "hr"
    ).count()

    if existing_hr == 0:
        hr_fallbacks = question_agent.generate_fallback_questions(
            resume_text,
            job_role,
            company,
            phase="hr",
            count=5,
        )
        for idx, q_text in enumerate(hr_fallbacks):
            db.add(InterviewQuestion(
                interview_id=interview_id,
                question=q_text,
                question_type="hr",
                expected_answer="",
                order_index=5 + idx,
            ))

    db.commit()


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
        _ensure_placeholder_questions(db, interview_id, resume.resume_text, interview.job_role, interview.company)
        print("[PRE-GEN] Seeded 10 personalized question placeholders for the interview.")

        # 3. Generate Tech Q1 + HR Q6 in parallel using the background executor
        print("[PRE-GEN] Generating FIRST technical question (chain will auto-queue Q2→Q5)...")
        _schedule_background_task(_generate_single_question_task, interview_id, 0, "technical")
        _schedule_background_task(_preload_question_context, interview_id, 0, "technical")

        print("[PRE-GEN] Generating FIRST HR question (chain will auto-queue Q7→Q10)...")
        _schedule_background_task(_generate_single_question_task, interview_id, 5, "hr")
        _schedule_background_task(_preload_question_context, interview_id, 5, "hr")

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
        company=request.company,
        mode=request.mode
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if resume:
        _ensure_placeholder_questions(db, new_interview.id, resume.resume_text, new_interview.job_role, new_interview.company)

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
        
        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not linked to interview")

        fallback_questions = question_agent.generate_fallback_questions(
            resume.resume_text,
            interview.job_role,
            interview.company,
            phase=request.phase,
            count=5,
        )

        for idx, q_text in enumerate(fallback_questions):
            iq = InterviewQuestion(
                interview_id=request.interview_id,
                question=q_text,
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

    # Synchronous safety disabled: We now rely entirely on background generation 
    # to prevent infinite loading screens on local hardware (Ollama).
    pass

    # Auto-heal: If any question is still a placeholder, safely queue it with a 60-second debounce
    # This guarantees stuck tasks (like the 3rd question) resume automatically.
    for q in existing:
        if _is_placeholder(q.question):
            _safe_queue_generation(background_tasks, request.interview_id, q.order_index, q.question_type)
            break

    total_time = time.time() - total_start
    print(f"[PERF_LOG] /generate-questions ({request.phase}) completed in {total_time:.4f}s (Placeholders/Cache Hit)")
    print(f"  - DB Query Time: {db_time:.4f}s")
    
    # Session Recovery: Fetch answers for this interview
    answers = db.query(Answer).filter(Answer.interview_id == request.interview_id).all()
    answer_map = {a.question_id: a for a in answers}

    return {
        "message": f"{request.phase.capitalize()} questions ready",
        "questions": [
            {
                "id": q.id, 
                "question": q.question, 
                "type": q.question_type,
                "answer_text": answer_map[q.id].answer_text if q.id in answer_map else None,
                "score": answer_map[q.id].score if q.id in answer_map else None,
            } for q in existing
        ]
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
        
    interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
    resume = db.query(Resume).filter(Resume.id == interview.resume_id).first() if interview and interview.resume_id else None

    fallback_questions = question_agent.generate_fallback_questions(
        resume.resume_text if resume else "",
        interview.job_role if interview else "Applicant",
        interview.company if interview else "Company",
        phase=iq.question_type,
        count=1,
    )
    iq.question = fallback_questions[0] + " [Retrying]"
    db.commit()

    _schedule_background_task(_generate_single_question_task, request.interview_id, iq.order_index, iq.question_type)
    _schedule_background_task(_preload_question_context, request.interview_id, iq.order_index, iq.question_type)
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


def _evaluate_answer_bg(answer_id: int):
    """Background task to evaluate an answer in parallel."""
    _evaluating_answers.add(answer_id)
    db = SessionLocal()
    try:
        # Load answer
        answer = db.query(Answer).filter(Answer.id == answer_id).first()
        if not answer or answer.score is not None:
            return
            
        interview = db.query(Interview).filter(Interview.id == answer.interview_id).first()
        question_record = db.query(InterviewQuestion).filter(InterviewQuestion.id == answer.question_id).first()
        
        # 1. Resume text
        resume_text = ""
        if interview.resume_id:
            resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
            if resume:
                resume_text = resume.resume_text[:1000]
                
        # 2. RAG lookup
        expected_answer = question_record.expected_answer
        rag_ref_id = None
        rag_sim_score = 0.0
        try:
            rag_matches = rag_agent.get_expected_answers([question_record.question], db=db)
            if rag_matches and rag_matches[0].get("expected_answer"):
                rag_sim_score = rag_matches[0].get("relevance_score", 0.0)
                rag_ref_id = rag_matches[0].get("reference_id")
                if not expected_answer:
                    expected_answer = rag_matches[0]["expected_answer"]
        except Exception as rag_err:
            pass

        # 3. Model Inference
        print(f"[BG-EVAL] Evaluating answer for Q: {question_record.question[:50]}...")
        try:
            evaluation = eval_agent.evaluate_answer(
                question=question_record.question,
                user_answer=answer.answer_text,
                job_role=interview.job_role,
                company=interview.company,
                resume_summary=resume_text,
                expected_answer=expected_answer,
                question_type=question_record.question_type
            )
        except Exception as e:
            print(f"[BG-EVAL] Eval error: {e}")
            evaluation = eval_agent._fallback_evaluation(
                question_record.question, answer.answer_text,
                interview.job_role, interview.company,
                question_record.question_type
            )
            
        # 4. Save Score
        answer.score = evaluation["score"]
        answer.feedback = evaluation["feedback"]
        answer.evaluated_at = datetime.utcnow()
        answer.rag_reference_id = rag_ref_id
        answer.rag_similarity_score = max(rag_sim_score, evaluation.get("matching_score", 0) / 100.0)
        
        if question_record.question_type == "technical":
            answer.accuracy_score = evaluation.get("accuracy", 5)
            answer.concept_understanding_score = evaluation.get("concept_understanding", 5)
            answer.problem_solving_score = evaluation.get("problem_solving", 5)
            answer.communication_clarity_score = evaluation.get("communication_clarity", 5)
            answer.code_quality_score = evaluation.get("code_quality", 5)
        else:
            answer.communication_skills_score = evaluation.get("communication_skills", 5)
            answer.confidence_score = evaluation.get("confidence", 5)
            answer.professionalism_score = evaluation.get("professionalism", 5)
            answer.adaptability_score = evaluation.get("adaptability", 5)
            answer.team_collaboration_score = evaluation.get("team_collaboration", 5)
            
        db.commit()
        print(f"[BG-EVAL] Successfully completed evaluation for Answer ID {answer_id} (Score: {answer.score})")
    except Exception as e:
        print(f"[BG-EVAL ERROR] Failed to evaluate answer ID {answer_id}: {e}")
    finally:
        _evaluating_answers.discard(answer_id)
        db.close()


@app.post("/submit-draft")
def submit_draft(
    answer_req: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save the current answer as a draft without evaluating."""
    interview = db.query(Interview).filter(Interview.id == answer_req.interview_id).first()
    if not interview or interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    existing_answer = db.query(Answer).filter(
        Answer.question_id == answer_req.question_id,
        Answer.interview_id == answer_req.interview_id
    ).first()
    
    if existing_answer:
        existing_answer.answer_text = answer_req.answer
        existing_answer.is_draft = True
        db.commit()
    else:
        question_record = db.query(InterviewQuestion).filter(
            InterviewQuestion.id == answer_req.question_id,
            InterviewQuestion.interview_id == answer_req.interview_id
        ).first()
        if not question_record:
            raise HTTPException(status_code=404, detail="Question not found")
            
        new_answer = Answer(
            question_id=answer_req.question_id,
            interview_id=answer_req.interview_id,
            user_id=current_user.id,
            answer_text=answer_req.answer,
            question_type=question_record.question_type,
            is_draft=True
        )
        db.add(new_answer)
        db.commit()
        
    return {"message": "Draft saved successfully"}

# ── Submit Answer (eval_agent) ────────────────────────
@app.post("/submit-answer")
def submit_answer(
    answer_req: AnswerRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer, queue it for background evaluation, and instantly return the next question."""
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

    existing_answer = db.query(Answer).filter(
        Answer.question_id == answer_req.question_id,
        Answer.interview_id == answer_req.interview_id
    ).first()

    if existing_answer:
        if getattr(existing_answer, 'is_draft', False):
            # It was a draft, now submit it for real
            existing_answer.is_draft = False
            existing_answer.answer_text = answer_req.answer
            db.commit()
            db.refresh(existing_answer)
            new_answer = existing_answer
        else:
            # Cache hit
            answered_ids = db.query(Answer.question_id).filter(
                Answer.interview_id == answer_req.interview_id,
                Answer.is_draft == False
            ).subquery()
            next_q = db.query(InterviewQuestion).filter(
                InterviewQuestion.interview_id == answer_req.interview_id,
                ~InterviewQuestion.id.in_(answered_ids)
            ).order_by(InterviewQuestion.order_index.asc()).first()
            
            # Ensure generation continues
            if next_q:
                if _is_placeholder(next_q.question):
                    _safe_queue_generation(background_tasks, answer_req.interview_id, next_q.order_index, next_q.question_type)
                next_next_q = db.query(InterviewQuestion).filter(
                    InterviewQuestion.interview_id == answer_req.interview_id,
                    InterviewQuestion.order_index == next_q.order_index + 1
                ).first()
                if next_next_q and _is_placeholder(next_next_q.question):
                    _safe_queue_generation(background_tasks, answer_req.interview_id, next_next_q.order_index, next_next_q.question_type)
            
            return {
                "message": "Answer already recorded",
                "score": existing_answer.score or 0,
                "feedback": existing_answer.feedback or "",
                "next_question": next_q.question if next_q else None,
                "question_id": next_q.id if next_q else None,
                "is_complete": next_q is None
            }
    else:
        # Step 1: Store the candidate answer in the database instantly
        new_answer = Answer(
            question_id=answer_req.question_id,
            interview_id=answer_req.interview_id,
            user_id=current_user.id,
            answer_text=answer_req.answer,
            question_type=question_record.question_type,
            is_draft=False
        )
        db.add(new_answer)
        db.commit()
        db.refresh(new_answer)

    # Step 2: Queue evaluation and context warm-up in parallel without blocking the UI
    _schedule_background_task(_evaluate_answer_bg, new_answer.id)
    # Step 5: Transition logic removed to prevent infinite loading.
    pass

    # Step 3: Get next question
    answered_ids = db.query(Answer.question_id).filter(
        Answer.interview_id == answer_req.interview_id,
        Answer.is_draft == False
    ).subquery()

    next_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == answer_req.interview_id,
        ~InterviewQuestion.id.in_(answered_ids)
    ).order_by(InterviewQuestion.order_index.asc()).first()

    # Step 4: Keep pipeline full
    if next_q:
        if _is_placeholder(next_q.question):
            _safe_queue_generation(background_tasks, answer_req.interview_id, next_q.order_index, next_q.question_type)
        else:
            _schedule_background_task(_preload_question_context, answer_req.interview_id, next_q.order_index, next_q.question_type)
        next_next_q = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == answer_req.interview_id,
            InterviewQuestion.order_index == next_q.order_index + 1
        ).first()
        if next_next_q and _is_placeholder(next_next_q.question):
            _safe_queue_generation(background_tasks, answer_req.interview_id, next_next_q.order_index, next_next_q.question_type)
        elif next_next_q:
            _schedule_background_task(_preload_question_context, answer_req.interview_id, next_next_q.order_index, next_next_q.question_type)
    

    return {
        "message": "Answer received and queued for evaluation",
        "score": 0,
        "feedback": "",
        "next_question": next_q.question if next_q else None,
        "question_id": next_q.id if next_q else None,
        "is_complete": next_q is None
    }


# ══════════════════════════════════════════════════════
#  REPORTS — Uses report_agent (Qwen)
# ══════════════════════════════════════════════════════
def get_user_from_token_string(token: str, db: Session):
    try:
        payload = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None

@app.get("/download-report/{interview_id}")
def download_report(
    interview_id: int,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Secure endpoint to download backend-generated interview report PDF.
    Supports token verification via query parameter (for opening in new tab) or Bearer header.
    """
    resolved_token = None
    if token:
        resolved_token = token
    elif authorization and authorization.startswith("Bearer "):
        resolved_token = authorization.split(" ")[1]

    if not resolved_token:
        raise HTTPException(status_code=401, detail="Authentication token required")

    user = get_user_from_token_string(resolved_token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    is_owner = (interview.user_id == user.id)
    is_admin = (user.role in ("super_admin", "admin", "tpo"))

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to download this report")

    from report_generator import get_or_create_pdf_report
    try:
        pdf_path, _ = get_or_create_pdf_report(interview_id, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Report PDF file not found on disk")

    filename = f"report_{interview_id}.pdf"
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

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
            "feedback": ans.feedback if ans and ans.feedback else "",
            "question_type": q.question_type or (ans.question_type if ans else "technical")
        })

    avg_score = sum(qa["score"] for qa in qa_list) / len(qa_list) if qa_list else 0

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

    # Create a pending report placeholder and generate it immediately.
    new_report = InterviewReport(
        interview_id=interview_id,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    try:
        # Generate the report synchronously so the frontend can reliably fetch
        # a completed report immediately after calling this endpoint.
        _generate_report_bg(interview_id, new_report.id)
    except Exception as exc:
        print(f"[REPORT] Synchronous generation failed: {exc}")
        # Fall back to background generation if synchronous generation fails.
        background_tasks.add_task(_generate_report_bg, interview_id, new_report.id)
        return {
            "message": "Report generation started in background",
            "report_id": new_report.id,
            "status": "pending",
            "interview_id": interview_id
        }

    # Re-fetch the report after generation completes
    completed_report = db.query(InterviewReport).filter(InterviewReport.id == new_report.id).first()
    if completed_report:
        return {
            "message": "Report generated and saved successfully",
            "report_id": completed_report.id,
            "interview_id": interview_id,
            "status": completed_report.status,
            "narrative_summary": completed_report.narrative_summary,
            "average_score": completed_report.average_score,
            "total_questions": completed_report.total_questions,
            "answered_questions": completed_report.answered_questions,
            "generated_at": completed_report.generated_at,
        }

    return {
        "message": "Report generation started in background",
        "report_id": new_report.id,
        "status": "pending",
        "interview_id": interview_id
    }

def _post_report_tasks(interview_id: int):
    """Background task to generate PDF and send email after the report is saved."""
    db = SessionLocal()
    try:
        from report_generator import generate_pdf_report
        pdf_path, pdf_url = generate_pdf_report(interview_id, db)
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if interview:
            interview.report_path = pdf_path
            interview.report_url = pdf_url
            db.commit()
        print(f"[POST-REPORT] Successfully generated PDF for interview {interview_id}: {pdf_path}")

        # Send report email to user
        from email_service import send_candidate_report_email
        try:
            send_candidate_report_email(interview_id, db)
        except Exception as email_exc:
            print(f"[POST-REPORT ERROR] Failed to send email for interview {interview_id}: {email_exc}")
    except Exception as exc:
        print(f"[POST-REPORT ERROR] Failed post-report tasks for interview {interview_id}: {exc}")
    finally:
        db.close()


def _generate_report_bg(interview_id: int, report_id: int):
    """Background task to generate report and save to DB."""
    def _ensure_string(val):
        if isinstance(val, list):
            return ", ".join(str(item) for item in val)
        return str(val) if val is not None else ""

    db = SessionLocal()
    try:
        start_time = time.time()
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            return

        # Step 0: Give in-flight answer evaluations a short grace period to finish,
        # then continue with the best available factor scores already stored in DB.
        import time as time_mod
        wait_start = time_mod.time()
        while time_mod.time() - wait_start < 4.0:
            db.expire_all()  # Clear SQLAlchemy session cache to see commits from bg threads
            pending_answers = db.query(Answer).filter(
                Answer.interview_id == interview_id,
                Answer.score == None
            ).all()
            if not pending_answers:
                break
            # Check if any pending answers are actively being evaluated in background
            active_bg = [a for a in pending_answers if a.id in _evaluating_answers]
            if not active_bg:
                # No background threads working on them — don't wait further
                print(f"[REPORT] {len(pending_answers)} answers pending but no active bg threads, proceeding...")
                break
            print(f"[REPORT] Waiting for {len(active_bg)} active background evaluations...")
            time_mod.sleep(0.1)

        # Step 1: Gather Q&A data from DB
        questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview_id
        ).order_by(InterviewQuestion.order_index.asc()).all()

        if not questions:
            db.close()
            return

        qa_data = []
        for q in questions:
            db.expire_all()  # Refresh to see any scores committed by bg threads
            ans = db.query(Answer).filter(Answer.question_id == q.id).first()
            if ans and ans.score is None:
                # Check if a background thread is actively evaluating this answer
                if ans.id in _evaluating_answers:
                    # Wait for the background thread to finish instead of duplicate eval
                    bg_wait_start = time_mod.time()
                    while ans.id in _evaluating_answers and time_mod.time() - bg_wait_start < 4.0:
                        time_mod.sleep(0.1)
                    # Re-fetch the answer to see if bg thread completed
                    db.expire_all()
                    ans = db.query(Answer).filter(Answer.question_id == q.id).first()
                    if ans and ans.score is not None:
                        print(f"[REPORT] Answer ID {ans.id} scored by background thread. Score: {ans.score}")
                
                # If still no score after waiting, do synchronous evaluation
                if ans and ans.score is None:
                    print(f"[REPORT] Evaluating missing score for Answer ID {ans.id} synchronously...")
                    try:
                        # 1. Resume text
                        resume_text_eval = ""
                        if interview.resume_id:
                            resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
                            if resume:
                                resume_text_eval = resume.resume_text[:1000]
                                
                        # 2. Expected answer
                        expected_answer = q.expected_answer
                        if not expected_answer:
                            try:
                                rag_matches = rag_agent.get_expected_answers([q.question], db=db)
                                if rag_matches and rag_matches[0].get("expected_answer"):
                                    expected_answer = rag_matches[0]["expected_answer"]
                            except Exception:
                                pass
                                
                        # 3. Model Inference
                        evaluation = eval_agent.evaluate_answer(
                            question=q.question,
                            user_answer=ans.answer_text,
                            job_role=interview.job_role,
                            company=interview.company,
                            resume_summary=resume_text_eval,
                            expected_answer=expected_answer,
                            question_type=q.question_type
                        )
                        
                        # 4. Save Score to Answer
                        ans.score = evaluation["score"]
                        ans.feedback = evaluation["feedback"]
                        ans.evaluated_at = datetime.utcnow()
                        if q.question_type == "technical":
                            ans.accuracy_score = evaluation.get("accuracy", 5)
                            ans.concept_understanding_score = evaluation.get("concept_understanding", 5)
                            ans.problem_solving_score = evaluation.get("problem_solving", 5)
                            ans.communication_clarity_score = evaluation.get("communication_clarity", 5)
                            ans.code_quality_score = evaluation.get("code_quality", 5)
                        else:
                            ans.communication_skills_score = evaluation.get("communication_skills", 5)
                            ans.confidence_score = evaluation.get("confidence", 5)
                            ans.professionalism_score = evaluation.get("professionalism", 5)
                            ans.adaptability_score = evaluation.get("adaptability", 5)
                            ans.team_collaboration_score = evaluation.get("team_collaboration", 5)
                        
                        db.commit()
                        db.refresh(ans)
                        print(f"[REPORT] Successfully evaluated Answer ID {ans.id} synchronously. Score: {ans.score}")
                    except Exception as eval_exc:
                        print(f"[REPORT ERROR] Failed synchronous evaluation for Answer ID {ans.id}: {eval_exc}")
                    
            qa_data.append({
                "question": q.question,
                "question_type": q.question_type,
                "answer": ans.answer_text if ans else "Not answered",
                "score": ans.score if ans and ans.score is not None else 0,
                "feedback": ans.feedback if ans and ans.feedback else "",
                "expected_answer": q.expected_answer,  # USE PRE-STORED REFERENCE
                "accuracy_score": ans.accuracy_score if ans else 0,
                "concept_understanding_score": ans.concept_understanding_score if ans else 0,
                "problem_solving_score": ans.problem_solving_score if ans else 0,
                "communication_clarity_score": ans.communication_clarity_score if ans else 0,
                "code_quality_score": ans.code_quality_score if ans else 0,
                "communication_skills_score": ans.communication_skills_score if ans else 0,
                "confidence_score": ans.confidence_score if ans else 0,
                "professionalism_score": ans.professionalism_score if ans else 0,
                "adaptability_score": ans.adaptability_score if ans else 0,
                "team_collaboration_score": ans.team_collaboration_score if ans else 0,
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

            # Step 4: Skip duplicate RAG evaluation because individual answers were evaluated in background
            print(f"[REPORT_DEBUG] Skipping duplicate comprehensive RAG evaluation...")
            rag_evaluation = {
                "technical_score": 0,
                "hr_score": 0,
                "matching_score": 0,
                "confidence_score": 0
            }
        except Exception as rag_err:
            print(f"[RAG] Report evaluation failed (non-fatal): {rag_err}")
            import traceback
            traceback.print_exc()

        # Step 5: Get proctoring summary
        proctor_summary = proctor_agent.get_proctoring_summary(interview_id, db)

        # Step 6: Calculate factor averages from individual Answer records in DB
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

        factor_evaluation = {
            "technical": {
                "accuracy": round(tech_accuracy / 10, 2),
                "concept_understanding": round(tech_concept / 10, 2),
                "problem_solving": round(tech_solving / 10, 2),
                "communication_clarity": round(tech_comm / 10, 2),
                "code_quality": round(tech_code / 10, 2),
            },
            "hr": {
                "communication_skills": round(hr_comm / 10, 2),
                "confidence": round(hr_conf / 10, 2),
                "professionalism": round(hr_prof / 10, 2),
                "adaptability": round(hr_adapt / 10, 2),
                "team_collaboration": round(hr_team / 10, 2),
            },
            "overall_technical_score": round(overall_tech, 2),
            "overall_hr_score": round(overall_hr, 2),
        }

        report_data = report_agent.generate_report(
            job_role=interview.job_role,
            company=interview.company,
            qa_data=qa_data,
            resume_text=resume_text,
            proctoring_summary=proctor_summary,
            rag_evaluation=rag_evaluation,
            factor_evaluation=factor_evaluation
        )

        # Step 7: Save report to DB with all enhanced fields
        report = db.query(InterviewReport).filter(InterviewReport.id == report_id).first()
        if report:
            report.narrative_summary = report_data.get("narrative_summary", "")
            report.average_score = report_data.get("average_score", 0)
            report.total_questions = report_data.get("total_questions", 0)
            report.answered_questions = report_data.get("answered_questions", 0)
            report.strengths = _ensure_string(report_data.get("strengths", ""))
            report.weaknesses = _ensure_string(report_data.get("weaknesses", ""))
            report.recommendation = report_data.get("recommendation", "")
            report.proctoring_analysis = json.dumps(proctor_summary)
            report.technical_score = report_data.get("technical_score", 0)
            report.hr_score = report_data.get("hr_score", 0)
            report.confidence_score = report_data.get("confidence_score", 0)
            report.missing_concepts = _ensure_string(report_data.get("missing_concepts", ""))
            report.improvement_suggestions = _ensure_string(report_data.get("improvement_suggestions", ""))
            report.rag_matching_data = _ensure_string(report_data.get("rag_matching_data", ""))
            
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
            report.hiring_readiness_score = int(report_data.get("hiring_readiness_score") or round(final_score))
            
            report.status = report_data.get("status", "completed")
            report.generated_at = datetime.utcnow()
            db.commit()

        # Mark interview completed
        interview.status = "completed"
        db.commit()

        record_metric("generate_report_bg_task", time.time() - start_time)

        # Generate PDF and send email in a separate background thread
        # so the HTTP response is not blocked by these slow I/O tasks.
        _schedule_background_task(_post_report_tasks, interview_id)

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
        "report_url": interview.report_url if interview.report_url else f"http://localhost:8000/download-report/{interview_id}",
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
        "email_delivery_status": report.email_delivery_status,
        "email_delivery_error": report.email_delivery_error,
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
        
        "final_interview_score": report.final_interview_score,
        "hiring_readiness_score": report.hiring_readiness_score
    }


# ══════════════════════════════════════════════════════
#  SCHEDULING
# ══════════════════════════════════════════════════════
@app.post("/schedule-interview")
def schedule_interview(
    request: ScheduleInterviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        scheduled_time = datetime.fromisoformat(request.scheduled_time.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    new_schedule = ScheduledInterview(
        user_id=current_user.id,
        job_role=request.job_role,
        company=request.company,
        scheduled_time=scheduled_time,
        status="scheduled"
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    # Send confirmation email
    send_interview_schedule_email(
        to_email=current_user.email,
        name=current_user.name,
        job_role=request.job_role,
        company=request.company,
        scheduled_time=scheduled_time.strftime("%B %d, %Y at %I:%M %p")
    )

    return {"message": "Interview scheduled successfully", "id": new_schedule.id}


@app.get("/scheduled-interviews")
def get_scheduled_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedules = db.query(ScheduledInterview).filter(ScheduledInterview.user_id == current_user.id).order_by(ScheduledInterview.scheduled_time.asc()).all()
    return [{"id": s.id, "job_role": s.job_role, "company": s.company, "scheduled_time": str(s.scheduled_time), "status": s.status} for s in schedules]


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
                "feedback": ans.feedback if ans and ans.feedback else "",
                "question_type": q.question_type or (ans.question_type if ans else "technical")
            })

        total_score = sum(qa["score"] for qa in qa_list)

        # Calculate duration
        duration_minutes = 10
        if questions:
            last_ans = db.query(Answer).filter(Answer.question_id == questions[-1].id).first()
            if last_ans and last_ans.created_at and interview.created_at:
                duration_minutes = max(1, int((last_ans.created_at - interview.created_at).total_seconds() / 60))

        # Calculate trust score
        from agents.proctoring_agent import proctor_agent
        risk_data = proctor_agent.get_risk_score(interview.id, db)
        trust_score = max(0, 100 - int(risk_data.get("risk_score", 0) * 100))

        # Get saved report details if available
        saved_report = db.query(InterviewReport).filter(
            InterviewReport.interview_id == interview.id
        ).first()
        
        history.append({
            "interview_id": interview.id,
            "job_role": interview.job_role,
            "company": interview.company,
            "mode": interview.mode,
            "status": interview.status,
            "date": str(interview.created_at),
            "duration_minutes": duration_minutes,
            "trust_score": trust_score,
            "qa_list": qa_list,
            "total_score": total_score,
            "average_score": total_score / len(qa_list) if qa_list else 0,
            "report_url": interview.report_url if interview.report_url else (f"http://localhost:8000/download-report/{interview.id}" if saved_report and saved_report.status == 'completed' else None),
            "report": {
                "narrative_summary": saved_report.narrative_summary if saved_report else "",
                "strengths": saved_report.strengths if saved_report else "",
                "weaknesses": saved_report.weaknesses if saved_report else "",
                "recommendation": saved_report.recommendation if saved_report else "",
                "technical_score": saved_report.technical_score if saved_report else 0,
                "hr_score": saved_report.hr_score if saved_report else 0,
                "confidence_score": saved_report.confidence_score if saved_report else 0,
                "tech_communication_avg": saved_report.tech_communication_avg if saved_report else 0,
                "hr_communication_skills_avg": saved_report.hr_communication_skills_avg if saved_report else 0,
                "missing_concepts": saved_report.missing_concepts if saved_report else "",
                "skill_gap_analysis": saved_report.skill_gap_analysis if saved_report else "",
                "improvement_suggestions": saved_report.improvement_suggestions if saved_report else "",
                "hiring_readiness_score": saved_report.hiring_readiness_score if saved_report else 0,
                "final_interview_score": saved_report.final_interview_score if saved_report else 0,
                "email_delivery_status": saved_report.email_delivery_status if saved_report else "pending",
                "email_delivery_error": saved_report.email_delivery_error if saved_report else None,
                "proctoring_analysis": json.loads(saved_report.proctoring_analysis) if saved_report and saved_report.proctoring_analysis else None
            }
        })


    history.sort(key=lambda x: x["interview_id"], reverse=True)
    return history

@app.get("/all-interviews")
def get_all_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all interview history for all users (for TPO Dashboard)."""
    # Assuming current_user is TPO or has permissions. In production, add role check.
    interviews = db.query(Interview).filter(Interview.mode == "Real").all()
    if not interviews:
        return []

    history = []
    for interview in interviews:
        user = db.query(User).filter(User.id == interview.user_id).first()
        questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview.id
        ).order_by(InterviewQuestion.order_index.asc()).all()

        qa_list = []
        if questions:
            for q in questions:
                ans = db.query(Answer).filter(Answer.question_id == q.id).first()
                qa_list.append({
                    "question": q.question,
                    "answer": ans.answer_text if ans else "Not answered",
                    "score": ans.score if ans and ans.score is not None else 0,
                    "feedback": ans.feedback if ans and ans.feedback else "",
                    "question_type": q.question_type or (ans.question_type if ans else "technical")
                })

        total_score = sum(qa["score"] for qa in qa_list)

        # Calculate duration
        duration_minutes = 10
        if questions:
            last_ans = db.query(Answer).filter(Answer.question_id == questions[-1].id).first()
            if last_ans and last_ans.created_at and interview.created_at:
                duration_minutes = max(1, int((last_ans.created_at - interview.created_at).total_seconds() / 60))

        # Calculate trust score
        from agents.proctoring_agent import proctor_agent
        risk_data = proctor_agent.get_risk_score(interview.id, db)
        trust_score = max(0, 100 - int(risk_data.get("risk_score", 0) * 100))

        saved_report = db.query(InterviewReport).filter(
            InterviewReport.interview_id == interview.id
        ).first()
        
        history.append({
            "interview_id": interview.id,
            "student_name": user.name if user else "Unknown",
            "student_email": user.email if user else "Unknown",
            "job_role": interview.job_role,
            "company": interview.company,
            "date": str(interview.created_at),
            "duration_minutes": duration_minutes,
            "trust_score": trust_score,
            "qa_list": qa_list,
            "total_score": total_score,
            "average_score": total_score / len(qa_list) if qa_list else 0,
            "status": interview.status,
            "report_url": interview.report_url if interview.report_url else (f"http://localhost:8000/download-report/{interview.id}" if saved_report and saved_report.status == 'completed' else None),
            "report": {
                "narrative_summary": saved_report.narrative_summary if saved_report else "",
                "strengths": saved_report.strengths if saved_report else "",
                "weaknesses": saved_report.weaknesses if saved_report else "",
                "recommendation": saved_report.recommendation if saved_report else "",
                "technical_score": saved_report.technical_score if saved_report else 0,
                "hr_score": saved_report.hr_score if saved_report else 0,
                "confidence_score": saved_report.confidence_score if saved_report else 0,
                "missing_concepts": saved_report.missing_concepts if saved_report else "",
                "skill_gap_analysis": saved_report.skill_gap_analysis if saved_report else "",
                "improvement_suggestions": saved_report.improvement_suggestions if saved_report else "",
                "hiring_readiness_score": saved_report.hiring_readiness_score if saved_report else 0,
                "final_interview_score": saved_report.final_interview_score if saved_report else 0,
                "email_delivery_status": saved_report.email_delivery_status if saved_report else "pending",
                "email_delivery_error": saved_report.email_delivery_error if saved_report else None
            }
        })

    history.sort(key=lambda x: x["interview_id"], reverse=True)
    return history


@app.post("/send-report-email/{interview_id}")
def send_report_email(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate sending the interview report via email."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not report or report.status != "completed":
        raise HTTPException(status_code=400, detail="Report not ready yet")

    # Security check: users can only send their own, admins/tpo can send any
    is_admin = current_user.role in ("super_admin", "admin", "tpo", "Admin", "Super Admin")
    if not is_admin and interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to email this report")
        
    from email_service import send_candidate_report_email
    try:
        send_candidate_report_email(interview_id, db)
        return {"message": "Email notification sent successfully", "status": "sent"}
    except Exception as e:
        # DB status tracking is handled inside send_candidate_report_email,
        # but let's make sure report status is updated correctly and exception is raised.
        db.refresh(report)
        report.email_delivery_status = "failed"
        report.email_delivery_error = str(e)
        db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Email delivery failed: {str(e)}"
        )


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
        user_id=current_user.id,
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
