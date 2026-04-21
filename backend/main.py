from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import engine, get_db, Base
from models import User, Interview, Resume, InterviewQuestion
from ai_service import question_generator, answer_evaluator
import PyPDF2
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Function to create access token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, key=SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# OAuth2 scheme for token (HTTPBearer for simple Bearer token input in Swagger)
oauth2_scheme = HTTPBearer()

# Function to get current user from token
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    token = credentials.credentials
    print(f"DEBUG get_current_user: Received token (first 50 chars): {token[:50]}...")
    
    try:
        payload = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG get_current_user: Decoded payload: {payload}")
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        print(f"DEBUG get_current_user: Extracted email={email}, user_id={user_id} (type={type(user_id).__name__})")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    except JWTError as e:
        print(f"DEBUG get_current_user: JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"DEBUG get_current_user: User not found for id={user_id}")
        raise HTTPException(status_code=401, detail="User not found")
    
    print(f"DEBUG get_current_user: User authenticated: {user.email} (id={user.id}, type={type(user.id).__name__})")
    return user

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic model for user registration
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

# Pydantic model for login request
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Pydantic model for user response
class UserResponse(BaseModel):
    id: int
    name: str
    email: str

# Pydantic model for interview request
class InterviewRequest(BaseModel):
    user_id: int
    job_role: str
    company: str

# Pydantic model for interview response
class InterviewResponse(BaseModel):
    id: int
    user_id: int
    job_role: str
    company: str
    status: str

# Pydantic model for answer request
class AnswerRequest(BaseModel):
    interview_id: int
    question_id: int
    answer: str
    job_role: str = Field(default="", description="Job role for context")
    company: str = Field(default="", description="Company for context")
    resume_summary: str = Field(default="", description="Resume summary for context")

# Pydantic model for question generation request
class QuestionGenerationRequest(BaseModel):
    resume_text: str = Field(..., min_length=10, description="Resume text or extracted content")
    job_role: str = Field(..., min_length=2, description="Target job role")
    company: str = Field(..., min_length=2, description="Target company")
    experience_level: str = Field(default="mid", description="Experience level: fresher/mid/senior")

# Pydantic model for individual question
class QuestionItem(BaseModel):
    question: str
    type: str  # technical/behavioral/scenario
    difficulty: str  # easy/medium/hard

# Pydantic model for question generation response
class QuestionGenerationResponse(BaseModel):
    questions: list[QuestionItem]

# Pydantic model for create interview request
class CreateInterviewRequest(BaseModel):
    job_role: str
    company: str
    resume_id: int = None

# Pydantic model for generate questions request
class GenerateQuestionsRequest(BaseModel):
    interview_id: int

# Create tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# Register API endpoint
@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Truncate password to 72 bytes (bcrypt limit)
    password_bytes = user.password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    truncated_password = password_bytes.decode('utf-8', errors='ignore')

    # Hash the password
    hashed_password = pwd_context.hash(truncated_password)

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# Login API endpoint
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Truncate password to 72 bytes (bcrypt limit)
    password_bytes = user.password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    truncated_password = password_bytes.decode('utf-8', errors='ignore')

    # Verify password
    if not pwd_context.verify(truncated_password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Create access token
    access_token = create_access_token(data={"sub": db_user.email, "user_id": db_user.id})

    return {"access_token": access_token, "token_type": "bearer"}

# Get all users endpoint (protected with JWT)
@app.get("/users", response_model=list[UserResponse])
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI Backend"}

# Upload resume endpoint
@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    # Save the uploaded file
    file_location = f"{upload_dir}/{file.filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    # Extract text from file (PDF or text)
    extracted_text = ""
    file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
    
    try:
        if file_extension == 'pdf':
            # Extract text from PDF
            with open(file_location, "rb") as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                for page in pdf_reader.pages:
                    extracted_text += page.extract_text()
        else:
            # Read as text file
            with open(file_location, "r", encoding='utf-8') as text_file:
                extracted_text = text_file.read()
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

    # Store resume in database
    new_resume = Resume(
        user_id=current_user.id,
        resume_text=extracted_text
    )
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)

    # Return resume details
    return {
        "id": new_resume.id,
        "resume_id": new_resume.id,
        "text_preview": extracted_text[:500],
        "user_id": new_resume.user_id,
        "uploaded_at": new_resume.uploaded_at
    }

# Create interview endpoint
@app.post("/create-interview")
def create_interview(
    request: CreateInterviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new interview for the logged-in user.
    Requires JWT authentication and a resume.
    """
    print("=== CREATE INTERVIEW CALLED ===")
    print(f"Request data: job_role={request.job_role}, company={request.company}, resume_id={request.resume_id}")
    print(f"Current user: {current_user.id}, email={current_user.email}")
    
    try:
        # Validate input
        if not request.job_role or not request.job_role.strip():
            print("ERROR: Job role is required")
            raise HTTPException(status_code=400, detail="Job role is required")
        
        if not request.company or not request.company.strip():
            print("ERROR: Company is required")
            raise HTTPException(status_code=400, detail="Company is required")

        # Get latest resume for the user if resume_id not provided
        resume_id = request.resume_id
        if not resume_id:
            print("Fetching latest resume for user...")
            latest_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).first()
            if not latest_resume:
                print("ERROR: No resume found for user")
                raise HTTPException(status_code=400, detail="No resume found. Please upload a resume first.")
            resume_id = latest_resume.id
            print(f"Found resume: id={resume_id}")

        print(f"Creating interview with user_id={current_user.id}, resume_id={resume_id}, job_role={request.job_role}, company={request.company}")

        # Create new interview
        new_interview = Interview(
            user_id=current_user.id,
            resume_id=resume_id,
            job_role=request.job_role,
            company=request.company
        )
        db.add(new_interview)
        db.commit()
        db.refresh(new_interview)

        print(f"Interview created successfully: id={new_interview.id}")

        return {
            "interview_id": new_interview.id,
            "job_role": new_interview.job_role,
            "company": new_interview.company,
            "resume_id": new_interview.resume_id,
            "created_at": new_interview.created_at,
            "message": "Interview created successfully"
        }
        
    except HTTPException as e:
        print(f"HTTP Exception: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Get question endpoint
@app.get("/get-question/{interview_id}")
def get_question(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"DEBUG /get-question: interview_id={interview_id}, current_user.id={current_user.id} (type={type(current_user.id).__name__}), current_user.email={current_user.email}")
    
    # Get interview
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        print(f"DEBUG /get-question: Interview not found for id={interview_id}")
        raise HTTPException(status_code=404, detail="Interview not found")
    
    print(f"DEBUG /get-question: Interview found, interview.user_id={interview.user_id} (type={type(interview.user_id).__name__})")
    
    # Verify user owns this interview
    if interview.user_id != current_user.id:
        print(f"DEBUG /get-question: ACCESS DENIED - interview.user_id ({interview.user_id}, type={type(interview.user_id).__name__}) != current_user.id ({current_user.id}, type={type(current_user.id).__name__})")
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    print(f"DEBUG /get-question: ACCESS GRANTED - User owns this interview")

    # Get first unanswered question from database
    question_record = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id,
        InterviewQuestion.answer == None
    ).order_by(InterviewQuestion.order_index.asc()).first()
    
    if question_record:
        print(f"DEBUG /get-question: Returning question_id={question_record.id}")
        return {
            "question_id": question_record.id,
            "question": question_record.question,
            "order_index": question_record.order_index
        }
    
    print(f"DEBUG /get-question: All questions answered")
    # If all questions answered, return completion status
    return {"message": "All questions answered", "is_complete": True}

# Submit answer endpoint
@app.post("/submit-answer")
def submit_answer(answer: AnswerRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if interview exists
    interview = db.query(Interview).filter(Interview.id == answer.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify user owns this interview
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    # Get the question record
    question_record = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == answer.question_id,
        InterviewQuestion.interview_id == answer.interview_id
    ).first()
    
    if not question_record:
        raise HTTPException(status_code=404, detail="Question not found")

    # Step 1: Update the question record with answer
    question_record.answer = answer.answer
    db.commit()
    db.refresh(question_record)

    # Step 2: Call AI for evaluation
    try:
        evaluation = answer_evaluator.evaluate_answer(
            question=question_record.question,
            user_answer=answer.answer,
            job_role=answer.job_role or interview.job_role,
            company=answer.company or interview.company,
            resume_summary=answer.resume_summary
        )
        
        # Step 3: Update DB with score and feedback
        question_record.score = evaluation["score"]
        question_record.feedback = evaluation["feedback"]
        db.commit()
        db.refresh(question_record)
        
        # Step 4: Fetch next question based on order_index
        next_question_record = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == answer.interview_id,
            InterviewQuestion.order_index > question_record.order_index
        ).order_by(InterviewQuestion.order_index.asc()).first()
        
        next_question = next_question_record.question if next_question_record else None
        question_id = next_question_record.id if next_question_record else None
        
        return {
            "message": "Answer received",
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "next_question": next_question,
            "question_id": question_id,
            "is_complete": next_question is None
        }
        
    except Exception as e:
        # Fallback to template evaluation if AI fails
        evaluation = answer_evaluator.evaluate_template_answer(
            question=question_record.question,
            user_answer=answer.answer,
            job_role=answer.job_role or interview.job_role,
            company=answer.company or interview.company
        )
        
        # Update DB with fallback evaluation
        question_record.score = evaluation["score"]
        question_record.feedback = evaluation["feedback"]
        db.commit()
        db.refresh(question_record)
        
        # Fetch next question
        next_question_record = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == answer.interview_id,
            InterviewQuestion.order_index > question_record.order_index
        ).order_by(InterviewQuestion.order_index.asc()).first()
        
        next_question = next_question_record.question if next_question_record else None
        question_id = next_question_record.id if next_question_record else None
        
        return {
            "message": "Answer received",
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "next_question": next_question,
            "question_id": question_id,
            "is_complete": next_question is None
        }

# Interview report endpoint
@app.get("/interview-report/{interview_id}")
def get_interview_report(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if interview exists
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify user owns this interview
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")

    # Fetch questions from database
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).order_by(InterviewQuestion.order_index.asc()).all()
    
    if not questions:
        return {
            "interview_id": interview_id,
            "job_role": interview.job_role,
            "company": interview.company,
            "questions": [],
            "average_score": 0
        }
    
    # Format questions
    questions_answers = [
        {
            "question": q.question,
            "answer": q.answer if q.answer else "Not answered",
            "score": q.score if q.score is not None else 0,
            "feedback": q.feedback if q.feedback else ""
        }
        for q in questions
    ]

    # Calculate average score
    answered_questions = [qa for qa in questions_answers if qa["answer"] != "Not answered"]
    if answered_questions:
        total_score = sum(qa["score"] for qa in answered_questions)
        average_score = total_score / len(answered_questions)
    else:
        average_score = 0

    return {
        "interview_id": interview_id,
        "job_role": interview.job_role,
        "company": interview.company,
        "created_at": interview.created_at,
        "questions": questions_answers,
        "average_score": average_score
    }

# Interview history endpoint
@app.get("/interview-history")
def get_interview_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get interview history for the logged-in user.
    Groups answers by interview session (job_role + company + date).
    """
    # Get all interviews for the user
    interviews = db.query(Interview).filter(Interview.user_id == current_user.id).all()
    
    if not interviews:
        return []
    
    history = []
    
    for interview in interviews:
        # Get questions for this interview
        questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.interview_id == interview.id
        ).order_by(InterviewQuestion.order_index.asc()).all()
        
        if not questions:
            continue  # Skip interviews with no questions
        
        # Create QA list
        qa_list = [
            {
                "question": q.question,
                "answer": q.answer if q.answer else "Not answered",
                "score": q.score if q.score is not None else 0,
                "feedback": q.feedback if q.feedback else ""
            }
            for q in questions
        ]
        
        # Calculate total score for this interview (only answered questions)
        answered_questions = [qa for qa in qa_list if qa["answer"] != "Not answered"]
        total_score = sum(qa["score"] for qa in answered_questions)
        
        history.append({
            "interview_id": interview.id,
            "job_role": interview.job_role,
            "company": interview.company,
            "date": str(interview.created_at),
            "qa_list": qa_list,
            "total_score": total_score,
            "average_score": total_score / len(answered_questions) if answered_questions else 0
        })
    
    # Sort by created_at descending (latest first)
    history.sort(key=lambda x: x["interview_id"], reverse=True)
    
    return history

# AI Question Generation endpoint
@app.post("/generate-questions")
def generate_questions(
    request: GenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate interview questions using AI based on interview details.
    Stores questions in database and returns questions list.
    """
    # Get interview
    interview = db.query(Interview).filter(Interview.id == request.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Verify user owns this interview
    if interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this interview")
    
    # Check if questions already exist for this interview
    existing_questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == request.interview_id
    ).order_by(InterviewQuestion.order_index.asc()).all()
    
    if existing_questions:
        print(f"Found {len(existing_questions)} existing questions. Returning them.")
        return {
            "message": "Questions already generated",
            "questions": [q.question for q in existing_questions]
        }

    # Check if interview has resume_id
    if not interview.resume_id:
        raise HTTPException(status_code=404, detail="Resume not linked to interview")
    
    # Get resume
    resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    try:
        # Generate questions using AI service
        questions = question_generator.generate_ai_questions(
            resume_text=resume.resume_text,
            job_role=interview.job_role,
            company=interview.company,
            experience_level="mid"
        )
        
        # Store questions in database
        created_questions = []
        for index, q in enumerate(questions):
            interview_question = InterviewQuestion(
                interview_id=request.interview_id,
                question=q["question"] if isinstance(q, dict) else q,
                order_index=index
            )
            db.add(interview_question)
            created_questions.append(interview_question)
        
        db.commit()
        
        # Return questions list
        return {
            "message": "Questions generated successfully",
            "questions": [{"id": q.id, "question": q.question} for q in created_questions]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in /generate-questions: {str(e)}")
        # Fallback questions
        fallback_questions = [
            f"Tell me about your experience related to {interview.job_role}.",
            "What are your greatest strengths as a developer?",
            f"Why do you want to work at {interview.company}?",
            "Describe a challenging technical problem you solved recently.",
            "Where do you see yourself in five years?"
        ]
        
        created_questions = []
        for index, q_text in enumerate(fallback_questions):
            new_q = InterviewQuestion(
                interview_id=request.interview_id,
                question=q_text,
                order_index=index
            )
            db.add(new_q)
            created_questions.append(new_q)
        db.commit()
        
        return {
            "message": "Generated fallback questions",
            "questions": [{"id": q.id, "question": q.question} for q in created_questions]
        }
