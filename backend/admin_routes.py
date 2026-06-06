from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, text
from typing import List, Optional
from datetime import datetime
import platform
import psutil

from database import get_db, engine
from models import User, Interview, Answer, InterviewReport, Resume, Company, JobRoleTemplate, QuestionBank, PDFDocument, JSONDocument, InterviewQuestion
from auth import require_admin
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])

# ── 1. Dashboard Stats ──────────────────────────────────
@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    total_students = db.query(User).filter(User.role == "student").count()
    total_interviews = db.query(Interview).count()
    completed_interviews = db.query(Interview).filter(Interview.status == "completed").count()
    pending_interviews = db.query(Interview).filter(Interview.status == "in_progress").count()

    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    interviews_today = db.query(Interview).filter(Interview.created_at >= today_start).count()
    
    resume_upload_count = db.query(Resume).count()

    avg_tech_score = db.query(func.avg(InterviewReport.overall_technical_score)).scalar() or 0
    avg_hr_score = db.query(func.avg(InterviewReport.overall_hr_score)).scalar() or 0

    top_students = db.query(
        User.name, User.email, InterviewReport.final_interview_score, Interview.job_role
    ).join(Interview, Interview.user_id == User.id)\
     .join(InterviewReport, InterviewReport.interview_id == Interview.id)\
     .order_by(desc(InterviewReport.final_interview_score))\
     .limit(10).all()

    recent_activity = db.query(
        User.name, Interview.job_role, Interview.company, Interview.status, Interview.created_at
    ).join(User, User.id == Interview.user_id)\
     .order_by(desc(Interview.created_at))\
     .limit(10).all()

    company_stats = db.query(
        Interview.company, func.count(Interview.id).label("count"), func.avg(InterviewReport.final_interview_score).label("avg_score")
    ).outerjoin(InterviewReport, InterviewReport.interview_id == Interview.id)\
     .group_by(Interview.company).all()

    role_stats = db.query(
        Interview.job_role, func.count(Interview.id).label("count"), func.avg(InterviewReport.final_interview_score).label("avg_score")
    ).outerjoin(InterviewReport, InterviewReport.interview_id == Interview.id)\
     .group_by(Interview.job_role).all()

    return {
        "total_students": total_students,
        "total_interviews": total_interviews,
        "interviews_today": interviews_today,
        "completed_interviews": completed_interviews,
        "pending_interviews": pending_interviews,
        "avg_technical_score": round(avg_tech_score, 1),
        "avg_hr_score": round(avg_hr_score, 1),
        "resume_upload_count": resume_upload_count,
        "top_students": [{"name": r[0], "email": r[1], "score": r[2], "role": r[3]} for r in top_students],
        "recent_activity": [{"name": r[0], "role": r[1], "company": r[2], "status": r[3], "date": r[4]} for r in recent_activity],
        "company_stats": [{"company": r[0], "count": r[1], "avg_score": r[2]} for r in company_stats],
        "role_stats": [{"role": r[0], "count": r[1], "avg_score": r[2]} for r in role_stats],
    }

# ── 2. Student Management ────────────────────────────────
@router.get("/students")
def get_students(
    search: Optional[str] = None, department: Optional[str] = None, 
    page: int = 1, limit: int = 20, 
    db: Session = Depends(get_db), current_admin: User = Depends(require_admin)
):
    query = db.query(User).filter(User.role == "student")
    if search:
        query = query.filter(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    if department:
        query = query.filter(User.department == department)
    
    total = query.count()
    users = query.order_by(desc(User.id)).offset((page - 1) * limit).limit(limit).all()
    
    students = []
    for u in users:
        latest_resume = db.query(Resume).filter(Resume.user_id == u.id).order_by(desc(Resume.id)).first()
        latest_interview = db.query(Interview).filter(Interview.user_id == u.id).order_by(desc(Interview.id)).first()
        
        score = None
        if latest_interview:
            rep = db.query(InterviewReport).filter(InterviewReport.interview_id == latest_interview.id).first()
            if rep:
                score = rep.final_interview_score
                
        students.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "department": u.department or "N/A",
            "has_resume": bool(latest_resume),
            "job_role": latest_interview.job_role if latest_interview else "N/A",
            "company": latest_interview.company if latest_interview else "N/A",
            "interview_status": latest_interview.status if latest_interview else "N/A",
            "overall_score": score
        })
    
    return {"total": total, "page": page, "limit": limit, "data": students}

@router.get("/students/{user_id}")
def get_student_details(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    student = db.query(User).filter(User.id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    resumes = db.query(Resume).filter(Resume.user_id == user_id).all()
    interviews = db.query(Interview).filter(Interview.user_id == user_id).all()
    
    interviews_with_reports = []
    for iv in interviews:
        report = db.query(InterviewReport).filter(InterviewReport.interview_id == iv.id).first()
        interviews_with_reports.append({
            "interview": iv,
            "report": report
        })
        
    return {
        "student": student,
        "resumes": resumes,
        "interviews": interviews_with_reports
    }

class RoleUpdate(BaseModel):
    role: str

@router.put("/students/{user_id}/role")
def update_user_role(user_id: int, data: RoleUpdate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    if current_admin.role != "super_admin" and data.role in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Only super_admin can promote to admin")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    db.commit()
    return {"message": "Role updated successfully", "role": user.role}

# ── 3. Interview Management ──────────────────────────────
@router.get("/interviews")
def get_all_interviews(
    status: Optional[str] = None, company: Optional[str] = None, 
    job_role: Optional[str] = None, page: int = 1, limit: int = 20,
    db: Session = Depends(get_db), current_admin: User = Depends(require_admin)
):
    query = db.query(
        Interview, User.name, User.email, InterviewReport.final_interview_score, InterviewReport.generated_at
    ).join(User, User.id == Interview.user_id)\
     .outerjoin(InterviewReport, InterviewReport.interview_id == Interview.id)
     
    if status:
        query = query.filter(Interview.status == status)
    if company:
        query = query.filter(Interview.company.ilike(f"%{company}%"))
    if job_role:
        query = query.filter(Interview.job_role.ilike(f"%{job_role}%"))
        
    total = query.count()
    results = query.order_by(desc(Interview.created_at)).offset((page - 1) * limit).limit(limit).all()
    
    data = []
    for iv, name, email, score, generated_at in results:
        duration_str = "N/A"
        if generated_at and iv.created_at:
            delta = generated_at - iv.created_at
            mins = int(delta.total_seconds() / 60)
            duration_str = f"{mins} mins" if mins > 0 else "< 1 min"
            
        data.append({
            "id": iv.id,
            "candidate_name": name,
            "email": email,
            "company": iv.company,
            "job_role": iv.job_role,
            "status": iv.status,
            "created_at": iv.created_at,
            "duration": duration_str,
            "score": score
        })
        
    return {"total": total, "page": page, "limit": limit, "data": data}

@router.get("/interviews/{interview_id}")
def get_interview_detail(interview_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    iv = db.query(Interview).filter(Interview.id == interview_id).first()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    user = db.query(User).filter(User.id == iv.user_id).first()
    report = db.query(InterviewReport).filter(InterviewReport.interview_id == iv.id).first()
    
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == iv.id).order_by(InterviewQuestion.order_index).all()
    answers = db.query(Answer).filter(Answer.interview_id == iv.id).all()
    
    qa_list = []
    for q in questions:
        ans = next((a for a in answers if a.question_id == q.id), None)
        qa_list.append({"question": q, "answer": ans})
        
    return {
        "interview": iv,
        "candidate": {"name": user.name, "email": user.email},
        "report": report,
        "qa_details": qa_list
    }

# ── 4. Reports Management ────────────────────────────────
@router.get("/reports")
def get_reports(page: int = 1, limit: int = 20, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    query = db.query(
        InterviewReport, Interview, User.name
    ).join(Interview, Interview.id == InterviewReport.interview_id)\
     .join(User, User.id == Interview.user_id)
     
    total = query.count()
    results = query.order_by(desc(InterviewReport.generated_at)).offset((page - 1) * limit).limit(limit).all()
    
    data = []
    for rep, iv, name in results:
        data.append({
            "id": rep.id,
            "interview_id": rep.interview_id,
            "candidate_name": name,
            "job_role": iv.job_role,
            "company": iv.company,
            "technical_score": rep.overall_technical_score,
            "hr_score": rep.overall_hr_score,
            "final_score": rep.final_interview_score,
            "readiness": rep.hiring_readiness_score,
            "generated_at": rep.generated_at,
            "strengths": rep.strengths,
            "weaknesses": rep.weaknesses,
            "improvement_suggestions": rep.improvement_suggestions,
            "recommendation": rep.recommendation,
            "tech_factors": {
                "accuracy": rep.tech_accuracy_avg,
                "concept": rep.tech_concept_understanding_avg,
                "problem_solving": rep.tech_problem_solving_avg,
                "communication": rep.tech_communication_avg,
                "code_quality": rep.tech_code_quality_avg
            },
            "hr_factors": {
                "communication": rep.hr_communication_skills_avg,
                "confidence": rep.hr_confidence_avg,
                "professionalism": rep.hr_professionalism_avg,
                "adaptability": rep.hr_adaptability_avg,
                "teamwork": rep.hr_team_collaboration_avg
            }
        })
    return {"total": total, "page": page, "limit": limit, "data": data}

@router.get("/reports/export")
def export_reports(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    results = db.query(
        InterviewReport, Interview, User.name, User.email
    ).join(Interview, Interview.id == InterviewReport.interview_id)\
     .join(User, User.id == Interview.user_id).all()
     
    data = []
    for rep, iv, name, email in results:
        data.append({
            "candidate_name": name,
            "email": email,
            "job_role": iv.job_role,
            "company": iv.company,
            "technical_score": rep.overall_technical_score,
            "hr_score": rep.overall_hr_score,
            "final_score": rep.final_interview_score,
            "recommendation": rep.recommendation,
            "readiness_score": rep.hiring_readiness_score
        })
    return {"data": data}

@router.get("/reports/{interview_id}")
def get_single_report(interview_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    report = db.query(InterviewReport).filter(InterviewReport.interview_id == interview_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

# ── 5. Analytics ─────────────────────────────────────────
@router.get("/analytics/department")
def analytics_department(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    stats = db.query(
        User.department, 
        func.count(Interview.id).label("interviews"),
        func.avg(InterviewReport.final_interview_score).label("avg_score")
    ).join(Interview, Interview.user_id == User.id)\
     .join(InterviewReport, InterviewReport.interview_id == Interview.id)\
     .filter(User.department != None)\
     .group_by(User.department).all()
    return [{"department": r[0] or "Unknown", "interviews": r[1], "avg_score": round(r[2] or 0, 1)} for r in stats]

@router.get("/analytics/company")
def analytics_company(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    stats = db.query(
        Interview.company, 
        func.count(Interview.id).label("interviews"),
        func.avg(InterviewReport.final_interview_score).label("avg_score")
    ).join(InterviewReport, InterviewReport.interview_id == Interview.id)\
     .group_by(Interview.company).all()
    return [{"company": r[0], "interviews": r[1], "avg_score": round(r[2] or 0, 1)} for r in stats]

@router.get("/analytics/job-role")
def analytics_job_role(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    stats = db.query(
        Interview.job_role, 
        func.count(Interview.id).label("interviews"),
        func.avg(InterviewReport.final_interview_score).label("avg_score")
    ).join(InterviewReport, InterviewReport.interview_id == Interview.id)\
     .group_by(Interview.job_role).all()
    return [{"job_role": r[0], "interviews": r[1], "avg_score": round(r[2] or 0, 1)} for r in stats]

@router.get("/analytics/trends")
def analytics_trends(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    if engine.name == "sqlite":
        date_expr = func.date(Interview.created_at)
    else:
        date_expr = func.date(Interview.created_at)
        
    stats = db.query(
        date_expr.label("date"),
        func.count(Interview.id).label("count")
    ).group_by("date").order_by("date").all()
    return [{"date": str(r[0]), "count": r[1]} for r in stats]

@router.get("/analytics/rankings")
def analytics_rankings(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    top = db.query(
        User.name, Interview.job_role, InterviewReport.final_interview_score
    ).join(Interview, Interview.user_id == User.id)\
     .join(InterviewReport, InterviewReport.interview_id == Interview.id)\
     .order_by(desc(InterviewReport.final_interview_score)).limit(50).all()
    return [{"name": r[0], "role": r[1], "score": r[2]} for r in top]

# ── 6. Resume Analytics ──────────────────────────────────
@router.get("/resumes")
def get_resumes(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    resumes = db.query(Resume, User.name, User.email).join(User, User.id == Resume.user_id).order_by(desc(Resume.uploaded_at)).all()
    data = []
    for r, name, email in resumes:
        data.append({
            "id": r.id,
            "candidate_name": name,
            "email": email,
            "uploaded_at": r.uploaded_at,
            "skills_extracted": r.skills_extracted,
            "ai_analysis": r.ai_analysis
        })
    return data

# ── 7. Question Bank Management ──────────────────────────
@router.get("/question-bank")
def get_question_bank(
    type: Optional[str] = None, category: Optional[str] = None, difficulty: Optional[str] = None,
    db: Session = Depends(get_db), current_admin: User = Depends(require_admin)
):
    query = db.query(QuestionBank)
    if type: query = query.filter(QuestionBank.question_type == type)
    if category: query = query.filter(QuestionBank.category.ilike(f"%{category}%"))
    if difficulty: query = query.filter(QuestionBank.difficulty == difficulty)
    return query.order_by(desc(QuestionBank.created_at)).all()

class QuestionCreate(BaseModel):
    question: str
    question_type: str
    category: Optional[str] = None
    difficulty: Optional[str] = "medium"
    expected_answer: Optional[str] = None

@router.post("/question-bank")
def add_question(data: QuestionCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    q = QuestionBank(**data.model_dump(), created_by=current_admin.id)
    db.add(q)
    db.commit()
    db.refresh(q)
    return q

@router.put("/question-bank/{q_id}")
def update_question(q_id: int, data: QuestionCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    q = db.query(QuestionBank).filter(QuestionBank.id == q_id).first()
    if not q: raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items():
        setattr(q, k, v)
    db.commit()
    return q

@router.delete("/question-bank/{q_id}")
def delete_question(q_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    q = db.query(QuestionBank).filter(QuestionBank.id == q_id).first()
    if not q: raise HTTPException(status_code=404, detail="Not found")
    q.is_active = False
    db.commit()
    return {"message": "Deleted"}

# ── 8. AI Assessment Monitoring ──────────────────────────
@router.get("/ai-monitoring")
def ai_monitoring(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    stats = db.query(
        func.avg(Answer.accuracy_score),
        func.avg(Answer.concept_understanding_score),
        func.avg(Answer.problem_solving_score),
        func.avg(Answer.communication_clarity_score),
        func.avg(Answer.code_quality_score),
        func.avg(Answer.communication_skills_score),
        func.avg(Answer.confidence_score),
        func.avg(Answer.professionalism_score),
        func.avg(Answer.adaptability_score),
        func.avg(Answer.team_collaboration_score),
        func.avg(Answer.rag_similarity_score)
    ).first()
    
    return {
        "technical_factors": {
            "accuracy": round(stats[0] or 0, 1),
            "concept": round(stats[1] or 0, 1),
            "problem_solving": round(stats[2] or 0, 1),
            "communication": round(stats[3] or 0, 1),
            "code_quality": round(stats[4] or 0, 1),
        },
        "hr_factors": {
            "communication": round(stats[5] or 0, 1),
            "confidence": round(stats[6] or 0, 1),
            "professionalism": round(stats[7] or 0, 1),
            "adaptability": round(stats[8] or 0, 1),
            "team_collaboration": round(stats[9] or 0, 1),
        },
        "avg_rag_similarity": round(stats[10] or 0, 2)
    }

# ── 9. Company & Job Role Management ──────────────────────
class CompanyCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None

@router.get("/companies")
def get_companies(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return db.query(Company).filter(Company.is_active == True).all()

@router.post("/companies")
def add_company(data: CompanyCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    c = Company(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.put("/companies/{id}")
def update_company(id: int, data: CompanyCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    c = db.query(Company).filter(Company.id == id).first()
    if not c: raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items(): setattr(c, k, v)
    db.commit()
    return c

@router.delete("/companies/{id}")
def delete_company(id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    c = db.query(Company).filter(Company.id == id).first()
    if not c: raise HTTPException(status_code=404, detail="Not found")
    c.is_active = False
    db.commit()
    return {"message": "Deleted"}

class JobRoleCreate(BaseModel):
    company_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    interview_template: Optional[str] = None

@router.get("/job-roles")
def get_job_roles(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    return db.query(JobRoleTemplate).filter(JobRoleTemplate.is_active == True).all()

@router.post("/job-roles")
def add_job_role(data: JobRoleCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    j = JobRoleTemplate(**data.model_dump())
    db.add(j)
    db.commit()
    db.refresh(j)
    return j

@router.put("/job-roles/{id}")
def update_job_role(id: int, data: JobRoleCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    j = db.query(JobRoleTemplate).filter(JobRoleTemplate.id == id).first()
    if not j: raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump().items(): setattr(j, k, v)
    db.commit()
    return j

@router.delete("/job-roles/{id}")
def delete_job_role(id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    j = db.query(JobRoleTemplate).filter(JobRoleTemplate.id == id).first()
    if not j: raise HTTPException(status_code=404, detail="Not found")
    j.is_active = False
    db.commit()
    return {"message": "Deleted"}

# ── 10. User & Role Management ───────────────────────────
@router.get("/users")
def get_all_users(role: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    query = db.query(User)
    if role: query = query.filter(User.role == role)
    if search: query = query.filter(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    return query.order_by(User.id).all()

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    if current_admin.role != "super_admin" and user.role != "student":
        raise HTTPException(status_code=403, detail="You can only delete students")

    # Delete related data
    db.query(Resume).filter(Resume.user_id == user_id).delete()
    
    interviews = db.query(Interview).filter(Interview.user_id == user_id).all()
    for iv in interviews:
        db.query(Answer).filter(Answer.interview_id == iv.id).delete()
        db.query(InterviewReport).filter(InterviewReport.interview_id == iv.id).delete()
        db.delete(iv)
        
    db.delete(user)
    db.commit()
    return {"message": "User and all related data deleted successfully"}

# ── 11. System Monitoring ────────────────────────────────
@router.get("/system-status")
def get_system_status(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    db_status = "Online"
    try:
        db.execute(text("SELECT 1"))
    except:
        db_status = "Offline"
        
    pdf_docs = db.query(PDFDocument).count()
    json_docs = db.query(JSONDocument).count()
    
    mem = psutil.virtual_memory()
    
    return {
        "database_status": db_status,
        "database_type": engine.name,
        "knowledge_base": {
            "pdf_documents": pdf_docs,
            "json_documents": json_docs
        },
        "system": {
            "platform": platform.platform(),
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": mem.percent
        }
    }
